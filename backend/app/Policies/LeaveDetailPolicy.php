<?php

namespace App\Policies;

use App\Models\LeaveDetail;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class LeaveDetailPolicy
{
    public function manage(User $user): bool
    {
        return $user->hasRole(User::ROLE_ADMIN, User::ROLE_HR);
    }
    public function viewAny(User $user): bool
    {
        return $this->manage($user);
    }

    public function view(User $user, LeaveDetail $leaveDetail): bool
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
    public function create(User $user): bool
    {
        return $this->manage($user);
    }

    public function update(User $user, LeaveDetail $LeaveDetail): bool
    {
        return $this->manage($user);
    }

    public function delete(User $user, LeaveDetail $LeaveDetail): bool
    {
        return $user->isAdmin();
    }    
}
