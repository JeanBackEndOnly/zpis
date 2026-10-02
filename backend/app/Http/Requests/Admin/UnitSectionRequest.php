<?php

namespace App\Http\Requests\Admin;

use App\Models\UnitSection;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UnitSectionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * Real permission checks are done by UnitSectionPolicy in the controller.
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
        // On update, the route parameter is the UnitSection model (route model binding)
        $unitSection = $this->route('unit_section');
        $unitSectionId = $unitSection instanceof UnitSection ? $unitSection->id : $unitSection;

        // For PATCH requests that omit department_id, fall back to the current one
        $departmentId = $this->input(
            'department_id',
            $unitSection instanceof UnitSection ? $unitSection->department_id : null
        );

        // PATCH = partial update, POST/PUT = full payload
        $presence = $this->isMethod('PATCH') ? 'sometimes' : 'required';

        return [
            'department_id' => [
                $presence,
                'integer',
                Rule::exists('departments', 'id'),
            ],
            'unit_section_name' => [
                $presence,
                'string',
                'max:255',
                // Name must be unique within the same department
                Rule::unique('unit_section', 'unit_section_name')
                    ->where('department_id', $departmentId)
                    ->ignore($unitSectionId),
            ],
            'unit_section_code' => [
                $presence,
                'string',
                'max:50',
                Rule::unique('unit_section', 'unit_section_code')->ignore($unitSectionId),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'department_id.required'        => 'Please select a department.',
            'department_id.exists'          => 'The selected department does not exist.',
            'unit_section_name.required'    => 'The unit/section name is required.',
            'unit_section_name.unique'      => 'This unit/section already exists in the selected department.',
            'unit_section_code.required'    => 'The unit/section code is required.',
            'unit_section_code.unique'      => 'This unit/section code is already in use.',
        ];
    }
}