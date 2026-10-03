<?php

namespace App\Http\Requests\Admin;

use App\Models\Personnel201File;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Editing a document in an employee's 201 file.
 * The file is optional: leave it out to keep the current one.
 */
class Personnel201FileUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // the controller authorizes through Personnel201FilePolicy
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'file_type' => ['required', Rule::in(Personnel201File::TYPES)],
            'file_name' => ['required', 'string', 'max:255'],
            'file'      => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,doc,docx', 'max:5120'], // 5 MB
        ];
    }

    public function messages(): array
    {
        return [
            'file_type.required' => 'Please choose the type of document.',
            'file_type.in'       => 'Please choose a valid type of document.',
            'file_name.required' => 'The file name is required.',
            'file.file'          => 'The upload must be a file.',
            'file.mimes'         => 'The file must be a PDF, JPG, PNG, DOC or DOCX file.',
            'file.max'           => 'The file may not be larger than 5 MB.',
            'file.uploaded'      => 'The file could not be uploaded. Make sure it is 5 MB or smaller.',
        ];
    }
}