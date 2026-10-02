<?php

namespace App\Http\Requests\Admin;

use App\Models\ScheduleTemplate;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ScheduleTemplateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
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
        $schedule_template = $this->route('schedule_template');
        $schedule_templateId = $schedule_template instanceof ScheduleTemplate
            ? $schedule_template->id : $schedule_template;

        // PATCH = partial update, POST/PUT = full payload
        $presence = $this->isMethod('PATCH') ? 'sometimes' : 'required';

        return [
            'schedule_name' => [
                $presence,
                'string',
                'max:10',
                Rule::unique('schedule_template', 'schedule_name')->ignore($schedule_templateId),
            ],
            'schedule_from' => [$presence, 'date_format:H:i'],
            'schedule_to'   => [$presence, 'date_format:H:i'],
            'shift' => [$presence, 'string', 'max:10'],
        ];
    }
    public function messages(): array
    {
        return [
            'schedule_name.required' => 'The department name is required.',
            'schedule_name.unique'   => 'This department already exists.',
            'shift.required' => 'The Schedule shift is required.',
            'schedule_from.required' => 'The schedule from is required.',
            'schedule_to.required'   => 'This schedule to is required.',
        ];
    }
}
