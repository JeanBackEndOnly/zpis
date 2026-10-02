<?php

namespace App\Policies;

use App\Models\UnitSection;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class UnitSectionPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, UnitSection $unitSection): bool
    {
        return in_array($user->user_role, ['admin', 'hr'], true);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->user_role === 'admin';
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, UnitSection $unitSection): bool
    {
        return $user->user_role === 'admin';
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, UnitSection $unitSection): bool
    {
        return $user->user_role === 'admin';
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, UnitSection $unitSection): bool
    {
        return $user->user_role === 'admin';
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, UnitSection $unitSection): bool
    {
        return $user->user_role === 'admin';
    }
}
