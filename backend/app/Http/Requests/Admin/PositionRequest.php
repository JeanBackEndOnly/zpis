<?php

namespace App\Http\Requests\Admin;

use App\Models\Position;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PositionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * Real permission checks are done by PositionPolicy in the controller.
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
        // On update, the route parameter is the Position model (route model binding)
        $position = $this->route('position');
        $positionId = $position instanceof Position ? $position->id : $position;

        // For PATCH requests that omit department_id, fall back to the current one
        $departmentId = $this->input(
            'department_id',
            $position instanceof Position ? $position->department_id : null
        );

        // PATCH = partial update, POST/PUT = full payload
        $presence = $this->isMethod('PATCH') ? 'sometimes' : 'required';

        return [
            'department_id' => [
                $presence,
                'integer',
                Rule::exists('departments', 'id'),
            ],
            'position_title' => [
                $presence,
                'string',
                'max:255',
                // Title must be unique within the same department
                Rule::unique('positions', 'position_title')
                    ->where('department_id', $departmentId)
                    ->ignore($positionId),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'department_id.required'  => 'Please select a department.',
            'department_id.exists'    => 'The selected department does not exist.',
            'position_title.required' => 'The position title is required.',
            'position_title.unique'   => 'This position already exists in the selected department.',
        ];
    }
}