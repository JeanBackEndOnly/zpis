<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    /**
     * Admin and HR can list and view users.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasRole(User::ROLE_ADMIN, User::ROLE_HR);
    }

    public function view(User $user, User $model): bool
    {
        return $user->hasRole(User::ROLE_ADMIN, User::ROLE_HR);
    }

    /**
     * Only admins can create, change, or remove accounts.
     */
    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, User $model): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, User $model): bool
    {
        return $user->isAdmin();
    }
}