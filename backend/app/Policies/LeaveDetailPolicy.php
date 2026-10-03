<?php

namespace App\Policies;

use App\Models\LeaveDetail;
use App\Models\User;

class LeaveDetailPolicy
{
    public function manage(User $user): bool
    {
        return $user->hasRole(User::ROLE_ADMIN, User::ROLE_HR);
    }

    private function owns(User $user, LeaveDetail $leaveDetail): bool
    {
        return (int) $leaveDetail->employee_information?->user_id === (int) $user->id;
    }

    // The all-employees list is for admin and HR
    public function viewAny(User $user): bool
    {
        return $this->manage($user);
    }

    // Admin/HR can open any request, an employee only their own
    public function view(User $user, LeaveDetail $leaveDetail): bool
    {
        return $this->manage($user) || $this->owns($user, $leaveDetail);
    }

    // An employee files a request for themselves, so they need Employment Details saved
    public function create(User $user): bool
    {
        return $user->employee_information()->exists();
    }

    public function update(User $user, LeaveDetail $leaveDetail): bool
    {
        return $this->manage($user);
    }

    public function approve(User $user, LeaveDetail $leaveDetail): bool
    {
        return $this->manage($user);
    }

    public function disapprove(User $user, LeaveDetail $leaveDetail): bool
    {
        return $this->manage($user);
    }

    // An employee can withdraw their own request while it is still pending
    public function cancel(User $user, LeaveDetail $leaveDetail): bool
    {
        return $this->owns($user, $leaveDetail)
            && $leaveDetail->leave_status === LeaveDetail::STATUS_PENDING;
    }

    public function delete(User $user, LeaveDetail $leaveDetail): bool
    {
        return $user->isAdmin();
    }
}