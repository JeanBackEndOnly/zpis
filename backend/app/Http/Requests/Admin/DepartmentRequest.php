<?php

namespace App\Http\Requests\Admin;

use App\Models\Department;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DepartmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * Real permission checks are done by DepartmentPolicy in the controller.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // On update, the route parameter is the Department model (route model binding)
        $department = $this->route('department');
        $departmentId = $department instanceof Department ? $department->id : $department;

        // PATCH = partial update, POST/PUT = full payload
        $presence = $this->isMethod('PATCH') ? 'sometimes' : 'required';

        return [
            'department_name' => [
                $presence,
                'string',
                'max:255',
                Rule::unique('departments', 'department_name')->ignore($departmentId),
            ],
            'department_code' => [
                $presence,
                'string',
                'max:50',
                Rule::unique('departments', 'department_code')->ignore($departmentId),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'department_name.required' => 'The department name is required.',
            'department_name.unique'   => 'This department already exists.',
            'department_code.required' => 'The department code is required.',
            'department_code.unique'   => 'This department code is already in use.',
        ];
    }
}