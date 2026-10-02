<?php

namespace App\Http\Requests\Admin;

use App\Models\LeaveCredit;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLeaveRequest extends FormRequest
{
    /**
     * Real permission checks are done by EmployeeInformationPolicy in the controller.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Expected body:
     * { "credits": [ { "leave_type": "vacation", "used": 2, "remaining": 13 }, ... ] }
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'credits'              => ['required', 'array', 'min:1'],
            'credits.*.leave_type' => ['required', 'distinct', Rule::in(LeaveCredit::TYPES)],
            'credits.*.used'       => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
            'credits.*.remaining'  => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
        ];
    }

    public function messages(): array
    {
        return [
            'credits.required'              => 'Please provide the leave credits.',
            'credits.*.leave_type.in'       => 'Leave type must be vacation, sick, special, or others.',
            'credits.*.leave_type.distinct' => 'Each leave type can only appear once.',
        ];
    }
}