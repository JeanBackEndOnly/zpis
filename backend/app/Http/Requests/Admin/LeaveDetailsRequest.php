<?php

namespace App\Http\Requests\Admin;

use App\Models\LeaveDate;
use App\Models\LeaveDetail;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * The "Request a leave" form. The number of days is NOT sent by the client:
 * the server counts the selected dates.
 */
class LeaveDetailsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // the controller authorizes through LeaveDetailPolicy
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'leave_type'      => ['required', Rule::in(LeaveDetail::TYPES)],
            'others_specify'  => ['required_if:leave_type,' . LeaveDetail::TYPE_OTHERS, 'nullable', 'string', 'max:255'],
            'purpose'         => ['required', 'string', 'max:255'],
            'dates'           => ['required', 'array', 'min:1', 'max:60'],
            'dates.*'         => ['required', 'date_format:Y-m-d', 'distinct'],
            'contact'         => ['required', 'string', 'max:20', 'regex:/^[0-9+\-\s()]+$/'],
            'section_head'    => ['nullable', 'string', 'max:255'],
            'department_head' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * An employee cannot have two pending/approved requests on the same date.
     *
     * @return array<int, \Closure>
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $employee = $this->user()?->employee_information;

                if (! $employee) {
                    return;
                }

                $taken = LeaveDate::query()
                    ->whereIn('leave_date', $this->input('dates', []))
                    ->whereHas('leave_detail', function ($query) use ($employee) {
                        $query->where('employee_id', $employee->id)
                            ->whereIn('leave_status', [LeaveDetail::STATUS_PENDING, LeaveDetail::STATUS_APPROVED]);
                    })
                    ->orderBy('leave_date')
                    ->get()
                    ->map(fn ($date) => $date->leave_date->format('m/d/Y'))
                    ->unique();

                if ($taken->isNotEmpty()) {
                    $validator->errors()->add(
                        'dates',
                        'You already have a leave request on: ' . $taken->implode(', ') . '.'
                    );
                }
            },
        ];
    }

    public function messages(): array
    {
        return [
            'leave_type.required'        => 'Please choose the type of leave.',
            'leave_type.in'              => 'Please choose a valid type of leave.',
            'others_specify.required_if' => 'Please specify the type of leave.',
            'purpose.required'           => 'The course/purpose is required.',
            'dates.required'             => 'Please add at least one leave date.',
            'dates.min'                  => 'Please add at least one leave date.',
            'dates.max'                  => 'You can request at most 60 days at a time.',
            'dates.*.date_format'        => 'Each leave date must use the format YYYY-MM-DD.',
            'dates.*.distinct'           => 'The same date was added more than once.',
            'contact.required'           => 'The contact number while on leave is required.',
            'contact.regex'              => 'The contact number may only contain digits, spaces, +, - and parentheses.',
        ];
    }
}