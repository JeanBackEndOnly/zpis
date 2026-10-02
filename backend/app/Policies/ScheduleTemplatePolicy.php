<?php

namespace App\Policies;

use App\Models\ScheduleTemplate;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ScheduleTemplatePolicy
{
    public function view(User $user, ScheduleTemplate $schedule_template): bool
    {
        return in_array($user->user_role, ['admin', 'hr']);
    }

    public function viewAny(User $user): bool
    {
        return in_array($user->user_role, ['admin', 'hr']);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return in_array($user->user_role, ['admin', 'hr']);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, ScheduleTemplate $department): bool
    {
        return in_array($user->user_role, ['admin', 'hr']);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, ScheduleTemplate $department): bool
    {
        return $user->user_role === 'admin';
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, ScheduleTemplate $department): bool
    {
        return $user->user_role === 'admin';
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, ScheduleTemplate $department): bool
    {
        return $user->user_role === 'admin';
    }
}
