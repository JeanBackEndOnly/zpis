<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePersonalRequest extends FormRequest
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
        return [
            'first_name'   => ['required', 'string', 'max:255'],
            'middle_name'  => ['nullable', 'string', 'max:255'],
            'last_name'    => ['required', 'string', 'max:255'],
            'suffix'       => ['nullable', 'string', 'max:10'],
            'contact'      => ['nullable', 'string', 'max:20', 'regex:/^[0-9+\-\s()]+$/'],
            'sex'          => ['required', Rule::in(['male', 'female'])],
            'civil_status' => ['nullable', 'string', 'max:50'],
            'citizenship'  => ['nullable', 'string', 'max:100'],
            'religion'     => ['nullable', 'string', 'max:100'],
            'birthday'     => ['required', 'date_format:Y-m-d', 'before:today'],
            'birthPlace'   => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'first_name.required'  => 'The first name is required.',
            'last_name.required'   => 'The last name is required.',
            'contact.regex'        => 'The contact number may only contain digits, spaces, +, - and parentheses.',
            'sex.in'               => 'Sex must be male or female.',
            'birthday.date_format' => 'The birthday must use the format YYYY-MM-DD.',
            'birthday.before'      => 'The birthday must be a date before today.',
        ];
    }
}