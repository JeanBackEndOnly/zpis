<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UsersRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * Real permission checks are done by UserPolicy in the controller.
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
        // On update, the route parameter is the User model (route model binding)
        $user = $this->route('user');
        $userId = $user instanceof User ? $user->id : $user;

        // PATCH = partial update, POST/PUT = full payload
        $presence = $this->isMethod('PATCH') ? 'sometimes' : 'required';

        return [
            'first_name'  => [$presence, 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name'   => [$presence, 'string', 'max:255'],
            'suffix'      => ['nullable', 'string', 'max:10'],
            'sex'         => [$presence, Rule::in(['male', 'female'])],
            'birthday'    => [$presence, 'date_format:Y-m-d', 'before:today'],
            'email'       => [
                $presence,
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            // Required when creating; optional on update (blank = keep current password)
            'password'    => [$this->isMethod('POST') ? 'required' : 'nullable', Password::min(8)],
            'user_role'   => [$presence, Rule::in(User::ROLES)],
            'status'      => [$presence, Rule::in(User::STATUSES)],
        ];
    }

    public function messages(): array
    {
        return [
            'first_name.required' => 'The first name is required.',
            'last_name.required'  => 'The last name is required.',
            'sex.in'              => 'Sex must be male or female.',
            'birthday.date_format' => 'The birthday must use the format YYYY-MM-DD.',
            'birthday.before'     => 'The birthday must be a date before today.',
            'email.unique'        => 'This email is already in use.',
            'user_role.in'        => 'Please choose a valid role.',
            'status.in'           => 'Please choose a valid status.',
        ];
    }
}