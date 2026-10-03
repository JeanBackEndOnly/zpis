<?php

namespace App\Http\Controllers;

use App\Http\Requests\Admin\LeaveDetailsRequest;
use App\Models\LeaveDetail;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Employee self-service: the logged-in employee files and follows
 * their own leave requests ("Request a leave" form).
 */
class LeaveRequestController extends Controller
{
    use AuthorizesRequests;

    private const RELATIONS = ['leave_dates:id,leave_id,leave_date'];

    /**
     * GET /leave-requests?leave_status=&page=
     * The logged-in employee's own requests, newest first.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'leave_status' => ['nullable', Rule::in(LeaveDetail::STATUSES)],
            ]);

            $requests = LeaveDetail::query()
                ->with(self::RELATIONS)
                ->whereHas('employee_information', function ($query) use ($request) {
                    $query->where('user_id', $request->user()->id);
                })
                ->when($request->filled('leave_status'), function ($query) use ($request) {
                    $query->where('leave_status', $request->leave_status);
                })
                ->orderByDesc('request_date')
                ->orderByDesc('id')
                ->paginate($request->integer('per_page', 10));

            return response()->json([
                'status'  => 1,
                'message' => 'Leave requests retrieved successfully.',
                'data'    => $requests,
            ]);
        } catch (ValidationException $e) {
            throw $e; // Laravel turns this into a 422 JSON response
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    /**
     * POST /leave-requests
     */
    public function store(LeaveDetailsRequest $request): JsonResponse
    {
        try {
            $employee = $request->user()->employee_information;

            if (! $employee) {
                return response()->json([
                    'status'  => 0,
                    'message' => 'Your employment details have not been set up yet. Please contact HR.',
                ], 422);
            }

            $this->authorize('create', LeaveDetail::class);

            $data = $request->validated();
            $dates = collect($data['dates'])->unique()->sort()->values();

            $leave = DB::transaction(function () use ($employee, $data, $dates) {
                $leave = LeaveDetail::create([
                    'employee_id'     => $employee->id,
                    'leave_type'      => $data['leave_type'],
                    'others_specify'  => $data['leave_type'] === LeaveDetail::TYPE_OTHERS
                        ? $data['others_specify']
                        : null,
                    'purpose'         => $data['purpose'],
                    'number_of_days'  => $dates->count(), // counted here, never trusted from the client
                    'contact'         => $data['contact'],
                    'section_head'    => $data['section_head'] ?? null,
                    'department_head' => $data['department_head'] ?? null,
                    'request_date'    => now()->toDateString(),
                    'leave_status'    => LeaveDetail::STATUS_PENDING,
                ]);

                $leave->leave_dates()->createMany(
                    $dates->map(fn ($date) => ['leave_date' => $date])->all()
                );

                return $leave;
            });

            return response()->json([
                'status'  => 1,
                'message' => 'Your leave request has been submitted successfully.',
                'data'    => $leave->load(self::RELATIONS),
            ], 201);
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    /**
     * GET /leave-requests/{leave_detail}
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
     * DELETE /leave-requests/{leave_detail}
     * An employee withdraws their own request while it is still pending.
     */
    public function destroy(LeaveDetail $leave_detail): JsonResponse
    {
        try {
            $this->authorize('cancel', $leave_detail);

            $leave_detail->delete(); // the leave dates are removed by the foreign key cascade

            return response()->json([
                'status'  => 1,
                'message' => 'Your leave request has been cancelled.',
            ]);
        } catch (AuthorizationException $e) {
            return response()->json([
                'status'  => 0,
                'message' => 'Only your own pending requests can be cancelled.',
            ], 403);
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
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