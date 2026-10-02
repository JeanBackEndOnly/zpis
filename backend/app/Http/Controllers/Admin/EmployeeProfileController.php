<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateEmploymentRequest;
use App\Http\Requests\Admin\UpdateLeaveRequest;
use App\Http\Requests\Admin\UpdatePersonalRequest;
use App\Models\EmployeeInformation;
use App\Models\LeaveCredit;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class EmployeeProfileController extends Controller
{
    use AuthorizesRequests;

    /**
     * Load the whole profile page in one request:
     * personal info + employment details (with salary) + leave credits.
     */
    public function show(User $user): JsonResponse
    {
        try {
            $this->authorize('manage', EmployeeInformation::class);

            return $this->profileResponse($user, 'Employee profile retrieved successfully.');
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    /**
     * Tab 1: Personal Information (saved to the users table).
     */
    public function updatePersonal(UpdatePersonalRequest $request, User $user): JsonResponse
    {
        try {
            $this->authorize('manage', EmployeeInformation::class);

            $user->update($request->validated());

            return $this->profileResponse(
                $user->fresh(),
                $user->full_name . "'s personal information has been updated successfully."
            );
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    /**
     * Tab 2: Employment Details (employee_information + salary in employment_details).
     * Creates the employee record the first time it is saved.
     */
    public function updateEmployment(UpdateEmploymentRequest $request, User $user): JsonResponse
    {
        try {
            $this->authorize('manage', EmployeeInformation::class);

            $data = $request->validated();
            $salary = Arr::only($data, ['basic_salary', 'salary_type', 'date_effective']);
            $info = Arr::except($data, array_keys($salary));

            DB::transaction(function () use ($user, $info, $salary) {
                $employee = EmployeeInformation::updateOrCreate(['user_id' => $user->id], $info);
                $this->syncSalary($employee, $salary);
            });

            return $this->profileResponse(
                $user->fresh(),
                $user->full_name . "'s employment details have been updated successfully."
            );
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    /**
     * Tab 3: Leave Details (leave_credits, one row per leave type).
     */
    public function updateLeave(UpdateLeaveRequest $request, User $user): JsonResponse
    {
        try {
            $this->authorize('manage', EmployeeInformation::class);

            $employee = $user->employee_information;

            if (! $employee) {
                return response()->json([
                    'status' => 0,
                    'message' => 'Save the employment details first before setting leave credits.',
                ], 422);
            }

            DB::transaction(function () use ($employee, $request) {
                foreach ($request->validated()['credits'] as $credit) {
                    LeaveCredit::updateOrCreate(
                        ['employee_id' => $employee->id, 'leave_type' => $credit['leave_type']],
                        ['used' => $credit['used'], 'remaining' => $credit['remaining']]
                    );
                }
            });

            return $this->profileResponse(
                $user->fresh(),
                $user->full_name . "'s leave credits have been updated successfully."
            );
        } catch (AuthorizationException $e) {
            return $this->forbidden();
        } catch (\Throwable $e) {
            return $this->serverError($e);
        }
    }

    /**
     * Keep salary history: when the amount or type changes, the old record is
     * marked as not current and a new current record is created.
     */
    private function syncSalary(EmployeeInformation $employee, array $salary): void
    {
        $current = $employee->employmentDetails()->where('is_current', true)->first();

        $changed = ! $current
            || (float) $current->basic_salary !== (float) $salary['basic_salary']
            || $current->salary_type !== $salary['salary_type'];

        if ($changed) {
            $employee->employmentDetails()->where('is_current', true)->update(['is_current' => false]);
            $employee->employmentDetails()->create($salary + ['is_current' => true]);
        } elseif ($current->date_effective->format('Y-m-d') !== $salary['date_effective']) {
            $current->update(['date_effective' => $salary['date_effective']]);
        }
    }

    /**
     * Build the full profile payload used by every response.
     */
    private function profile(User $user): array
    {
        $employee = $user->employee_information()
            ->with(['department', 'unit_section', 'position', 'currentEmploymentDetail'])
            ->first();

        $credits = $employee
            ? $employee->leaveCredits()->get()->keyBy('leave_type')
            : collect();

        // Always return all four leave types, with zeros when not set yet
        $leaveCredits = collect(LeaveCredit::TYPES)->map(function ($type) use ($credits) {
            $credit = $credits->get($type);

            return [
                'leave_type' => $type,
                'used' => $credit?->used ?? '0.00',
                'remaining' => $credit?->remaining ?? '0.00',
            ];
        })->values();

        return [
            'user' => $user,
            'employment' => $employee, // null until employment details are saved
            'leave_credits' => $leaveCredits,
        ];
    }

    private function profileResponse(User $user, string $message): JsonResponse
    {
        return response()->json([
            'status' => 1,
            'message' => $message,
            'data' => $this->profile($user),
        ], 200);
    }

    private function forbidden(): JsonResponse
    {
        return response()->json([
            'status' => 0,
            'message' => 'You are not authorized to perform this action.',
        ], 403);
    }

    private function serverError(\Throwable $e): JsonResponse
    {
        Log::error($e->getMessage(), ['exception' => $e]);

        return response()->json([
            'status' => 0,
            'message' => 'server error',
        ], 500);
    }
}