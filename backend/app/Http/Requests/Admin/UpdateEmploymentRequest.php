<?php

namespace App\Http\Requests\Admin;

use App\Models\EmployeeInformation;
use App\Models\EmploymentDetail;
use App\Models\UnitSection;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEmploymentRequest extends FormRequest
{
    /**
     * Real permission checks are done by EmployeeInformationPolicy in the controller.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // The route parameter is the User model (route model binding)
        $user = $this->route('user');
        $employeeInfoId = $user instanceof User ? $user->employee_information?->id : null;

        $departmentId = $this->input('department_id');

        // A unit section is required only when the department has unit sections
        $departmentHasUnits = $departmentId
            && UnitSection::where('department_id', $departmentId)->exists();

        return [
            // Employment
            'department_id'   => ['required', 'integer', Rule::exists('departments', 'id')],
            // The unit section and position must belong to the chosen department
            'unit_section_id' => [
                $departmentHasUnits ? 'required' : 'nullable',
                'integer',
                Rule::exists('unit_section', 'id')->where('department_id', $departmentId),
            ],
            'position_id'     => [
                'required',
                'integer',
                Rule::exists('positions', 'id')->where('department_id', $departmentId),
            ],
            'employment_id'   => [
                'required',
                'string',
                'max:50',
                Rule::unique('employee_information', 'employment_id')->ignore($employeeInfoId),
            ],
            'employment_status' => ['required', Rule::in(EmployeeInformation::EMPLOYMENT_STATUSES)],
            'date_hired'        => ['required', 'date_format:Y-m-d', 'before_or_equal:today'],

            // Government IDs
            'sss_no'        => ['nullable', 'string', 'max:30'],
            'philhealth_no' => ['nullable', 'string', 'max:30'],
            'pagibig_no'    => ['nullable', 'string', 'max:30'],
            'tin_no'        => ['nullable', 'string', 'max:30'],

            // Address
            'houseBlock'      => ['nullable', 'string', 'max:255'],
            'street'          => ['nullable', 'string', 'max:255'],
            'subdivision'     => ['nullable', 'string', 'max:255'],
            'barangay'        => ['nullable', 'string', 'max:255'],
            'city_muntinlupa' => ['nullable', 'string', 'max:255'],
            'province'        => ['nullable', 'string', 'max:255'],
            'zip_code'        => ['nullable', 'string', 'max:10'],

            // Salary (saved to employment_details as history)
            'basic_salary'   => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
            'salary_type'    => ['required', Rule::in(EmploymentDetail::SALARY_TYPES)],
            'date_effective' => ['required', 'date_format:Y-m-d'],
        ];
    }

    public function messages(): array
    {
        return [
            'unit_section_id.required' => 'Please select a unit section for this department.',
            'unit_section_id.exists' => 'The selected unit section does not belong to the selected department.',
            'position_id.exists'     => 'The selected position does not belong to the selected department.',
            'employment_id.unique'   => 'This employment ID is already assigned to another employee.',
            'date_hired.before_or_equal' => 'The date hired cannot be in the future.',
            'date_hired.date_format'     => 'The date hired must use the format YYYY-MM-DD.',
            'date_effective.date_format' => 'The effective date must use the format YYYY-MM-DD.',
        ];
    }
}