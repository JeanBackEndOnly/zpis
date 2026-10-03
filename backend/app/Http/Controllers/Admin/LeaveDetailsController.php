<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LeaveCredit;
use App\Models\LeaveDetail;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

/**
 * Admin / HR side of leave requests: review, approve, disapprove and delete.
 * Employees file their own requests through LeaveRequestController.
 */
class LeaveDetailsController extends Controller
{
    use AuthorizesRequests;

    private const RELATIONS = [
        'leave_dates:id,leave_id,leave_date',
        'employee_information:id,user_id,department_id,unit_section_id,employment_id',
        'employee_information.user:id,first_name,middle_name,last_name,suffix,email',
        'employee_information.department:id,department_name',
        'employee_information.unit_section:id,unit_section_name',
    ];

    private const TYPE_LABELS = [
        LeaveDetail::TYPE_VACATION => 'vacation leave',
        LeaveDetail::TYPE_SICK     => 'sick leave',
        LeaveDetail::TYPE_SPECIAL  => 'special leave',
        LeaveDetail::TYPE_OTHERS   => 'other leave',
    ];

    /**
     * GET /admin/leave-details
     *     ?leave_status=&leave_type=&department_id=&unit_section_id=&search=&page=
     *     &date_from=YYYY-MM-DD&date_to=YYYY-MM-DD   (requests that include a leave date in the range)
     *
     * Pending requests are listed first, then the newest.
     * "counts" is the number of requests per status (for the filter tabs).
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $this->authorize('viewAny', LeaveDetail::class);

            $validator = Validator::make($request->all(), [
                'leave_status' => ['nullable', Rule::in(LeaveDetail::STATUSES)],
                'leave_type'   => ['nullable', Rule::in(LeaveDetail::TYPES)],
                'date_from'    => ['nullable', 'date_format:Y-m-d', 'required_with:date_to'],
                'date_to'      => ['nullable', 'date_format:Y-m-d', 'required_with:date_from', 'after_or_equal:date_from'],
            ], [
                'date_to.after_or_equal'  => 'The end date must be on or after the start date.',
                'date_from.required_with' => 'Please provide both a start date and an end date.',
                'date_to.required_with'   => 'Please provide both a start date and an end date.',
            ]);

            if ($validator->fails()) {
                return $this->invalid($validator);
            }

            $leaves = LeaveDetail::query()
                ->with(self::RELATIONS)
                ->when($request->filled('leave_status'), function ($query) use ($request) {
                    $query->where('leave_status', $request->leave_status);
                })
                ->when($request->filled('leave_type'), function ($query) use ($request) {
                    $query->where('leave_type', $request->leave_type);
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
                    $query->whereHas('leave_dates', function ($d) use ($request) {
                        $d->whereBetween('leave_date', [$request->date_from, $request->date_to]);
                    });
                })
                ->orderByRaw("CASE WHEN leave_status = 'pending' THEN 0 ELSE 1 END")
                ->orderByDesc('request_date')
                ->orderByDesc('id')
                ->paginate($request->integer('per_page', 10));

            $counts = LeaveDetail::query()
                ->select('leave_status', DB::raw('count(*) as total'))
                ->groupBy('leave_status')
                ->pluck('total', 'leave_status');

            return response()->json([
                'status'  => 1,
                'message' => 'Leave requests retrieved successfully.',
                'data'    => $leaves,
                'counts'  => [
                    LeaveDetail::STATUS_PENDING     => (int) ($counts[LeaveDetail::STATUS_PENDING] ?? 0),
                    LeaveDetail::STATUS_APPROVED    => (int) ($counts[LeaveDetail::STATUS_APPROVED] ?? 0),
                    LeaveDetail::STATUS_DISAPPROVED => (int) ($counts[LeaveDetail::STATUS_DISAPPROVED] ?? 0),
                ],
            ]);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    /**
     * GET /admin/leave-details/{leave_detail}
     */
    public function show(LeaveDetail $leave_detail): JsonResponse
    {
        try {
            $this->authorize('view', $leave_detail);

            return response()->json([
                'status'  => 1,
                'message' => 'Leave request retrieved successfully.',
                'data'    => $leave_detail->load(self::RELATIONS),
            ]);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    /**
     * PUT /admin/leave-details/{leave_detail}/approve
     * Only pending requests. Vacation, sick and special leave are deducted from the
     * employee's leave credits (the request is refused when there are not enough).
     */
    public function approve(LeaveDetail $leave_detail): JsonResponse
    {
        try {
            $this->authorize('approve', $leave_detail);

            $error = DB::transaction(function () use ($leave_detail) {
                // Lock the rows so two approvals cannot spend the same credits twice
                $leave = LeaveDetail::query()->lockForUpdate()->findOrFail($leave_detail->id);

                if ($leave->leave_status !== LeaveDetail::STATUS_PENDING) {
                    return 'Only pending requests can be approved.';
                }

                $creditType = $leave->creditType();

                if ($creditType) {
                    $credit = LeaveCredit::query()
                        ->where('employee_id', $leave->employee_id)
                        ->where('leave_type', $creditType)
                        ->lockForUpdate()
                        ->first();

                    $remaining = $credit ? (float) $credit->remaining : 0.0;

                    if (! $credit || $remaining < $leave->number_of_days) {
                        return 'Not enough ' . self::TYPE_LABELS[$leave->leave_type] . ' credits: '
                            . rtrim(rtrim(number_format($remaining, 2, '.', ''), '0'), '.') . ' day(s) remaining, '
                            . $leave->number_of_days . ' day(s) requested. Update the employee\'s leave credits first.';
                    }

                    $credit->update([
                        'used'      => (float) $credit->used + $leave->number_of_days,
                        'remaining' => $remaining - $leave->number_of_days,
                    ]);
                }

                $leave->update(['leave_status' => LeaveDetail::STATUS_APPROVED]);

                return null;
            });

            if ($error) {
                return $this->unprocessable($error);
            }

            return response()->json([
                'status'  => 1,
                'message' => $this->ownerName($leave_detail) . '\'s leave request has been approved.',
                'data'    => $leave_detail->fresh(self::RELATIONS),
            ]);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    /**
     * PUT /admin/leave-details/{leave_detail}/disapprove
     * Only pending requests. Leave credits are not touched.
     */
    public function disapprove(LeaveDetail $leave_detail): JsonResponse
    {
        try {
            $this->authorize('disapprove', $leave_detail);

            $changed = DB::transaction(function () use ($leave_detail) {
                $leave = LeaveDetail::query()->lockForUpdate()->findOrFail($leave_detail->id);

                if ($leave->leave_status !== LeaveDetail::STATUS_PENDING) {
                    return false;
                }

                $leave->update(['leave_status' => LeaveDetail::STATUS_DISAPPROVED]);

                return true;
            });

            if (! $changed) {
                return $this->unprocessable('Only pending requests can be disapproved.');
            }

            return response()->json([
                'status'  => 1,
                'message' => $this->ownerName($leave_detail) . '\'s leave request has been disapproved.',
                'data'    => $leave_detail->fresh(self::RELATIONS),
            ]);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    /**
     * DELETE /admin/leave-details/{leave_detail}
     * Deleting an approved request gives its days back to the employee's leave credits.
     */
    public function destroy(LeaveDetail $leave_detail): JsonResponse
    {
        try {
            $this->authorize('delete', $leave_detail);

            $owner = $this->ownerName($leave_detail);

            DB::transaction(function () use ($leave_detail) {
                $leave = LeaveDetail::query()->lockForUpdate()->findOrFail($leave_detail->id);
                $creditType = $leave->creditType();

                if ($leave->leave_status === LeaveDetail::STATUS_APPROVED && $creditType) {
                    $credit = LeaveCredit::query()
                        ->where('employee_id', $leave->employee_id)
                        ->where('leave_type', $creditType)
                        ->lockForUpdate()
                        ->first();

                    if ($credit) {
                        $credit->update([
                            'used'      => max(0, (float) $credit->used - $leave->number_of_days),
                            'remaining' => (float) $credit->remaining + $leave->number_of_days,
                        ]);
                    }
                }

                $leave->delete(); // the leave dates are removed by the foreign key cascade
            });

            return response()->json([
                'status'  => 1,
                'message' => $owner . '\'s leave request has been deleted successfully.',
            ]);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    private function ownerName(LeaveDetail $leave): string
    {
        $leave->loadMissing('employee_information.user');
        $user = $leave->employee_information?->user;

        if (! $user) {
            return 'The employee';
        }

        return implode(' ', array_filter([
            $user->first_name,
            $user->middle_name,
            $user->last_name,
            $user->suffix,
        ]));
    }

    private function invalid(ValidatorContract $validator): JsonResponse
    {
        return response()->json([
            'status'  => 0,
            'message' => $validator->errors()->first(),
            'errors'  => $validator->errors(),
        ], 422);
    }

    private function unprocessable(string $message): JsonResponse
    {
        return response()->json([
            'status'  => 0,
            'message' => $message,
        ], 422);
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