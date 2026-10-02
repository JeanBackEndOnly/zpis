<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\EmployeeScheduleRequest;
use App\Models\EmployeeInformation;
use App\Models\EmployeeSchedule;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EmployeeScheduleController extends Controller
{
    use AuthorizesRequests;

    private const RELATIONS = [
        'employee_information.user:id,first_name,middle_name,last_name,suffix,email',
        'employee_information.department:id,department_name',
        'employee_information.unit_section:id,unit_section_name',
        'schedule_template',
    ];

    /**
     * GET /admin/employee-schedules
     *     ?department_id=&unit_section_id=&schedule_id=&search=&page=
     *     &date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&date_mode=active|starts
     *
     * date_mode "active" (default): schedules that are in effect at some point
     *                               between date_from and date_to
     * date_mode "starts":           schedules whose effective date is inside the range
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $this->authorize('viewAny', EmployeeSchedule::class);

            if ($invalid = $this->validateFilters($request)) {
                return $invalid;
            }

            $schedules = $this->filteredQuery($request)
                ->orderByDesc('employee_schedule.effective_date')
                ->orderByDesc('employee_schedule.id')
                ->paginate($request->integer('per_page', 10));

            return response()->json([
                'status'  => 1,
                'message' => 'Employee schedules retrieved successfully.',
                'data'    => $schedules,
            ]);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    /**
     * GET /admin/employee-schedules/export  (same filters as the index, no pagination)
     * Downloads the filtered schedules as a CSV file.
     */
    public function export(Request $request): JsonResponse|StreamedResponse
    {
        try {
            $this->authorize('viewAny', EmployeeSchedule::class);

            if ($invalid = $this->validateFilters($request)) {
                return $invalid;
            }

            $rows = $this->filteredQuery($request)
                ->get()
                ->sort(fn ($a, $b) => $this->exportSortKey($a) <=> $this->exportSortKey($b))
                ->values();

            $filename = 'employee-schedules';
            if ($request->filled('date_from') && $request->filled('date_to')) {
                $filename .= '_' . $request->date_from . '_to_' . $request->date_to;
            }
            $filename .= '.csv';

            return response()->streamDownload(function () use ($rows) {
                $out = fopen('php://output', 'w');

                // UTF-8 BOM so Excel shows accents (ñ, é) correctly
                fwrite($out, "\xEF\xBB\xBF");

                $this->putCsvRow($out, [
                    'Employee ID',
                    'Employee Name',
                    'Department',
                    'Unit Section',
                    'Schedule',
                    'Shift',
                    'Time In',
                    'Time Out',
                    'Effective From',
                    'Effective Until',
                ]);

                foreach ($rows as $row) {
                    $info = $row->employee_information;
                    $template = $row->schedule_template;

                    $this->putCsvRow($out, [
                        $info?->employment_id,
                        $this->userName($info?->user),
                        $info?->department?->department_name,
                        $info?->unit_section?->unit_section_name,
                        $template?->schedule_name,
                        $template?->shift,
                        $template ? Carbon::parse($template->schedule_from)->format('h:i A') : null,
                        $template ? Carbon::parse($template->schedule_to)->format('h:i A') : null,
                        $row->effective_date?->format('Y-m-d'),
                        $row->next_effective_date
                            ? Carbon::parse($row->next_effective_date)->subDay()->format('Y-m-d')
                            : 'No end date',
                    ]);
                }

                fclose($out);
            }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    /**
     * GET /admin/employee-schedules/employees
     *
     * data       = active employees that can be assigned a schedule
     *              (ids are employee_information ids)
     * incomplete = active users with no Employment Details saved yet,
     *              so the UI can tell the admin why they are missing
     */
    public function employees(): JsonResponse
    {
        try {
            $this->authorize('viewAny', EmployeeSchedule::class);

            $employees = EmployeeInformation::query()
                ->with(['user:id,first_name,middle_name,last_name,suffix'])
                ->whereHas('user', function ($query) {
                    $query->where('status', User::STATUS_ACTIVE);
                })
                ->get()
                ->sortBy(fn ($e) => strtolower(($e->user->last_name ?? '') . ' ' . ($e->user->first_name ?? '')))
                ->values()
                ->map(fn ($e) => [
                    'id'              => $e->id,
                    'employment_id'   => $e->employment_id,
                    'name'            => $this->userName($e->user),
                    'department_id'   => $e->department_id,
                    'unit_section_id' => $e->unit_section_id,
                ]);

            // The admin account itself is skipped to keep this list useful
            $incomplete = User::query()
                ->where('status', User::STATUS_ACTIVE)
                ->where('user_role', '!=', User::ROLE_ADMIN)
                ->whereDoesntHave('employee_information')
                ->orderBy('last_name')
                ->orderBy('first_name')
                ->get(['id', 'first_name', 'middle_name', 'last_name', 'suffix'])
                ->map(fn ($u) => [
                    'user_id' => $u->id,
                    'name'    => $this->userName($u),
                ])
                ->values();

            return response()->json([
                'status'     => 1,
                'message'    => 'Employees retrieved successfully.',
                'data'       => $employees,
                'incomplete' => $incomplete,
            ]);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    /**
     * POST /admin/employee-schedules
     */
    public function store(EmployeeScheduleRequest $request): JsonResponse
    {
        try {
            $this->authorize('create', EmployeeSchedule::class);

            $schedule = EmployeeSchedule::create($request->validated())->load(self::RELATIONS);

            return response()->json([
                'status'  => 1,
                'message' => 'Schedule has been assigned to ' . $this->scheduleOwner($schedule) . ' successfully.',
                'data'    => $schedule,
            ], 201);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    /**
     * GET /admin/employee-schedules/{employee_schedule}
     */
    public function show(EmployeeSchedule $employee_schedule): JsonResponse
    {
        try {
            if (! $employee_schedule->exists) {
                return $this->notFound();
            }

            $this->authorize('view', $employee_schedule);

            return response()->json([
                'status'  => 1,
                'message' => 'Employee schedule retrieved successfully.',
                'data'    => $employee_schedule->load(self::RELATIONS),
            ]);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    /**
     * PUT|PATCH /admin/employee-schedules/{employee_schedule}
     */
    public function update(EmployeeScheduleRequest $request, EmployeeSchedule $employee_schedule): JsonResponse
    {
        try {
            if (! $employee_schedule->exists) {
                return $this->notFound();
            }

            $this->authorize('update', $employee_schedule);

            $employee_schedule->update($request->validated());
            $employee_schedule->load(self::RELATIONS);

            return response()->json([
                'status'  => 1,
                'message' => 'Schedule for ' . $this->scheduleOwner($employee_schedule) . ' has been updated successfully.',
                'data'    => $employee_schedule,
            ]);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    /**
     * DELETE /admin/employee-schedules/{employee_schedule}
     */
    public function destroy(EmployeeSchedule $employee_schedule): JsonResponse
    {
        try {
            if (! $employee_schedule->exists) {
                return $this->notFound();
            }

            $this->authorize('delete', $employee_schedule);

            $employee_schedule->load(self::RELATIONS);
            $owner = $this->scheduleOwner($employee_schedule);
            $employee_schedule->delete();

            return response()->json([
                'status'  => 1,
                'message' => 'Schedule for ' . $owner . ' has been removed successfully.',
            ]);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    /**
     * Filters shared by the table and the CSV export.
     */
    private function filteredQuery(Request $request): Builder
    {
        return EmployeeSchedule::query()
            ->with(self::RELATIONS)
            // The date the employee's next schedule starts (null = this one has no end date)
            ->addSelect(['next_effective_date' => $this->nextEffectiveDate()])
            ->when($request->filled('schedule_id'), function ($query) use ($request) {
                $query->where('employee_schedule.schedule_id', $request->schedule_id);
            })
            ->when($request->filled('department_id'), function ($query) use ($request) {
                $query->whereHas('employee_information', function ($e) use ($request) {
                    $e->where('department_id', $request->department_id);
                });
            })
            ->when($request->filled('unit_section_id'), function ($query) use ($request) {
                $query->whereHas('employee_information', function ($e) use ($request) {
                    $e->where('unit_section_id', $request->unit_section_id);
                });
            })
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = '%' . $request->search . '%';
                $query->whereHas('employee_information', function ($e) use ($search) {
                    $e->where('employment_id', 'like', $search)
                        ->orWhereHas('user', function ($u) use ($search) {
                            $u->where('first_name', 'like', $search)
                                ->orWhere('middle_name', 'like', $search)
                                ->orWhere('last_name', 'like', $search);
                        });
                });
            })
            ->when($request->filled('date_from') && $request->filled('date_to'), function ($query) use ($request) {
                $this->applyDateRange(
                    $query,
                    $request->date_from,
                    $request->date_to,
                    $request->input('date_mode', 'active')
                );
            });
    }

    private function nextEffectiveDate(): QueryBuilder
    {
        return DB::table('employee_schedule as next_schedule')
            ->select('next_schedule.effective_date')
            ->whereColumn('next_schedule.employee_id', 'employee_schedule.employee_id')
            ->whereColumn('next_schedule.effective_date', '>', 'employee_schedule.effective_date')
            ->orderBy('next_schedule.effective_date')
            ->limit(1);
    }

    private function applyDateRange(Builder $query, string $from, string $to, string $mode): void
    {
        if ($mode === 'starts') {
            // The schedule's effective date is inside the range
            $query->whereBetween('employee_schedule.effective_date', [$from, $to]);

            return;
        }

        // In effect during the range: it started on or before the range ends,
        // and the employee's next schedule did not already replace it before the range begins
        $query->where('employee_schedule.effective_date', '<=', $to)
            ->whereNotExists(function ($sub) use ($from) {
                $sub->select(DB::raw(1))
                    ->from('employee_schedule as newer')
                    ->whereColumn('newer.employee_id', 'employee_schedule.employee_id')
                    ->whereColumn('newer.effective_date', '>', 'employee_schedule.effective_date')
                    ->where('newer.effective_date', '<=', $from);
            });
    }

    /**
     * Returns a 422 response when the date filters are invalid, otherwise null.
     */
    private function validateFilters(Request $request): ?JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'date_from' => ['nullable', 'date_format:Y-m-d', 'required_with:date_to'],
            'date_to'   => ['nullable', 'date_format:Y-m-d', 'required_with:date_from', 'after_or_equal:date_from'],
            'date_mode' => ['nullable', Rule::in(['active', 'starts'])],
        ], [
            'date_from.date_format'    => 'The start date must use the format YYYY-MM-DD.',
            'date_to.date_format'      => 'The end date must use the format YYYY-MM-DD.',
            'date_to.after_or_equal'   => 'The end date must be on or after the start date.',
            'date_from.required_with'  => 'Please provide both a start date and an end date.',
            'date_to.required_with'    => 'Please provide both a start date and an end date.',
            'date_mode.in'             => 'The date mode must be "active" or "starts".',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => 0,
                'message' => $validator->errors()->first(),
                'errors'  => $validator->errors(),
            ], 422);
        }

        return null;
    }

    /**
     * CSV order: department, then employee name, then effective date.
     */
    private function exportSortKey(EmployeeSchedule $schedule): array
    {
        $info = $schedule->employee_information;

        return [
            strtolower($info?->department?->department_name ?? ''),
            strtolower($info?->user?->last_name ?? ''),
            strtolower($info?->user?->first_name ?? ''),
            $schedule->effective_date?->format('Y-m-d') ?? '',
        ];
    }

    /**
     * @param  resource  $handle
     * @param  array<int, string|null>  $values
     */
    private function putCsvRow($handle, array $values): void
    {
        // The explicit empty $escape argument avoids the PHP 8.4 fputcsv deprecation
        fputcsv($handle, array_map(fn ($value) => $this->csvCell($value), $values), ',', '"', '');
    }

    /**
     * Stops spreadsheet apps from running a cell as a formula (CSV injection).
     */
    private function csvCell(?string $value): string
    {
        $value = (string) $value;

        if ($value !== '' && in_array($value[0], ['=', '+', '-', '@', "\t", "\r"], true)) {
            return "'" . $value;
        }

        return $value;
    }

    private function userName(?User $user): string
    {
        if (! $user) {
            return 'Unknown';
        }

        return implode(' ', array_filter([
            $user->first_name,
            $user->middle_name,
            $user->last_name,
            $user->suffix,
        ]));
    }

    private function scheduleOwner(EmployeeSchedule $schedule): string
    {
        return $this->userName($schedule->employee_information?->user);
    }

    private function notFound(): JsonResponse
    {
        return response()->json([
            'status'  => 0,
            'message' => 'Employee schedule not found.',
        ], 404);
    }

    private function forbidden(): JsonResponse
    {
        return response()->json([
            'status'  => 0,
            'message' => 'You are not authorized to perform this action.',
        ], 403);
    }

    private function serverError(\Throwable $e): JsonResponse
    {
        Log::error($e->getMessage(), ['exception' => $e]);

        return response()->json([
            'status'  => 0,
            'message' => 'server error',
        ], 500);
    }
}