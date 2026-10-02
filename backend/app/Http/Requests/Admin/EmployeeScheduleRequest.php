<?php

namespace App\Http\Requests\Admin;

use App\Models\EmployeeSchedule;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EmployeeScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // the controller authorizes through the policy
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $employee_schedule = $this->route('employee_schedule');
        $isModel = $employee_schedule instanceof EmployeeSchedule;
        $scheduleId = $isModel ? $employee_schedule->id : $employee_schedule;
        $employeeId = $this->input('employee_id', $isModel ? $employee_schedule->employee_id : null);

        // PATCH = partial update, POST/PUT = full payload
        $presence = $this->isMethod('PATCH') ? 'sometimes' : 'required';

        return [
            'employee_id' => [
                $presence,
                'integer',
                Rule::exists('employee_information', 'id'),
            ],
            'schedule_id' => [
                $presence,
                'integer',
                Rule::exists('schedule_template', 'id'),
            ],
            'effective_date' => [
                $presence,
                'date_format:Y-m-d',
                // One schedule per employee per effective date
                Rule::unique('employee_schedule', 'effective_date')
                    ->where(fn ($query) => $query->where('employee_id', $employeeId))
                    ->ignore($scheduleId),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'employee_id.required'     => 'Please select an employee.',
            'employee_id.exists'       => 'The selected employee does not exist.',
            'schedule_id.required'     => 'Please select a schedule.',
            'schedule_id.exists'       => 'The selected schedule does not exist.',
            'effective_date.required'  => 'The effective date is required.',
            'effective_date.unique'    => 'This employee already has a schedule starting on that date.',
        ];
    }
}