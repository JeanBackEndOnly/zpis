<?php

namespace App\Policies;

use App\Models\Personnel201File;
use App\Models\User;

class Personnel201FilePolicy
{
    // Admin and HR keep the employees' 201 files
    public function manage(User $user): bool
    {
        return $user->hasRole(User::ROLE_ADMIN, User::ROLE_HR);
    }

    public function viewAny(User $user): bool
    {
        return $this->manage($user);
    }

    public function view(User $user, Personnel201File $file): bool
    {
        return $this->manage($user);
    }

    public function create(User $user): bool
    {
        return $this->manage($user);
    }

        public function update(User $user, Personnel201File $file): bool
    {
        return $this->manage($user);
    }

    public function delete(User $user, Personnel201File $file): bool
    {
        return $this->manage($user);
    }
}