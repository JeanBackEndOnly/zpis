<?php

namespace App\Policies;

use App\Models\EmployeeInformation;
use App\Models\User;

class EmployeeInformationPolicy
{
    /**
     * Admin and HR can view and edit employee profiles
     * (personal info, employment details, salary, leave credits).
     * Used as: $this->authorize('manage', EmployeeInformation::class)
     */
    public function manage(User $user): bool
    {
        return $user->hasRole(User::ROLE_ADMIN, User::ROLE_HR);
    }

    public function viewAny(User $user): bool
    {
        return $this->manage($user);
    }

    public function view(User $user, EmployeeInformation $employeeInformation): bool
    {
        return $this->manage($user);
    }

    public function create(User $user): bool
    {
        return $this->manage($user);
    }

    public function update(User $user, EmployeeInformation $employeeInformation): bool
    {
        return $this->manage($user);
    }

    public function delete(User $user, EmployeeInformation $employeeInformation): bool
    {
        return $user->isAdmin();
    }
}