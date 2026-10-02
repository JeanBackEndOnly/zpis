<?php

namespace App\Policies;

use App\Models\EmployeeSchedule;
use App\Models\User;

class EmployeeSchedulePolicy
{
    private function manage(User $user): bool
    {
        return $user->hasRole(User::ROLE_ADMIN, User::ROLE_HR);
    }

    public function viewAny(User $user): bool
    {
        return $this->manage($user);
    }

    public function view(User $user, EmployeeSchedule $employeeSchedule): bool
    {
        return $this->manage($user);
    }

    public function create(User $user): bool
    {
        return $this->manage($user);
    }

    public function update(User $user, EmployeeSchedule $employeeSchedule): bool
    {
        return $this->manage($user);
    }

    public function delete(User $user, EmployeeSchedule $employeeSchedule): bool
    {
        return $this->manage($user);
    }
}