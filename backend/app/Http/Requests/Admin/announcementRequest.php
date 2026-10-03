<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * The "Create announcement" form.
 * The employee_id is NOT sent by the client:
 * the server gets it from the authenticated employee.
 */
class AnnouncementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // the controller authorizes through AnnouncementPolicy
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'announcement_title' => [
                'required',
                'string',
                'max:255',
            ],

            'announcement_description' => [
                'required',
                'string',
            ],

            'announcement_files' => [
                'nullable',
                'array',
                'max:6',
            ],

            'announcement_files.*' => [
                'required',
                'file',
                'mimes:pdf,jpg,jpeg,png',
                'max:5120',
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'announcement_title.required' => 'The announcement title is required.',
            'announcement_title.string'   => 'The announcement title must be a valid text.',
            'announcement_title.max'      => 'The announcement title may not exceed 255 characters.',

            'announcement_description.required' => 'The announcement description is required.',
            'announcement_description.string'   => 'The announcement description must be valid text.',

            'announcement_files.array' => 'The announcement files must be submitted as a list of files.',
            'announcement_files.max'   => 'You can upload at most 5 files.',

            'announcement_files.*.required' => 'The uploaded file is required.',
            'announcement_files.*.file'     => 'Each announcement attachment must be a valid file.',
            'announcement_files.*.mimes'    => 'Announcement files must be PDF, JPG, JPEG, or PNG.',
            'announcement_files.*.max'      => 'Each announcement file may not exceed 5 MB.',
        ];
    }
}