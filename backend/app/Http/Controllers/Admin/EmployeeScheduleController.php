<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\EmployeeScheduleRequest;
use App\Models\EmployeeInformation;
use App\Models\EmployeeSchedule;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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
     * GET /admin/employee-schedules?department_id=&unit_section_id=&schedule_id=&search=&page=
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $this->authorize('viewAny', EmployeeSchedule::class);

            $schedules = EmployeeSchedule::query()
                ->with(self::RELATIONS)
                ->when($request->filled('schedule_id'), function ($query) use ($request) {
                    $query->where('schedule_id', $request->schedule_id);
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
                ->orderByDesc('effective_date')
                ->orderByDesc('id')
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