<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Models\EmployeeInformation;

#[Fillable([
    'first_name', 'middle_name', 'last_name', 'suffix',
    'sex', 'birthday', 'email', 'password', 'user_role', 'status',
])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    // Roles
    public const ROLE_ADMIN    = 'admin';
    public const ROLE_HR       = 'hr';
    public const ROLE_PAYROLL  = 'payroll';
    public const ROLE_HEAD     = 'head';
    public const ROLE_EMPLOYEE = 'employee';

    public const ROLES = [
        self::ROLE_ADMIN,
        self::ROLE_HR,
        self::ROLE_PAYROLL,
        self::ROLE_HEAD,
        self::ROLE_EMPLOYEE,
    ];

    // Statuses
    public const STATUS_ACTIVE      = 'Active';
    public const STATUS_DEACTIVATED = 'Deactivated';
    public const STATUS_INACTIVE    = 'Inactive';

    public const STATUSES = [
        self::STATUS_ACTIVE,
        self::STATUS_DEACTIVATED,
        self::STATUS_INACTIVE,
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Role helpers
    |--------------------------------------------------------------------------
    */

    public function hasRole(string ...$roles): bool
    {
        return in_array($this->user_role, $roles, true);
    }

    public function isAdmin(): bool
    {
        return $this->user_role === self::ROLE_ADMIN;
    }

    public function isHr(): bool
    {
        return $this->user_role === self::ROLE_HR;
    }

    public function isPayroll(): bool
    {
        return $this->user_role === self::ROLE_PAYROLL;
    }

    public function isHead(): bool
    {
        return $this->user_role === self::ROLE_HEAD;
    }

    public function isEmployee(): bool
    {
        return $this->user_role === self::ROLE_EMPLOYEE;
    }

    /*
    |--------------------------------------------------------------------------
    | Status helpers
    |--------------------------------------------------------------------------
    */

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function isDeactivated(): bool
    {
        return $this->status === self::STATUS_DEACTIVATED;
    }

    public function isInactive(): bool
    {
        return $this->status === self::STATUS_INACTIVE;
    }

    /*
    |--------------------------------------------------------------------------
    | Query scopes
    |--------------------------------------------------------------------------
    */

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function scopeRole(Builder $query, string ...$roles): Builder
    {
        return $query->whereIn('user_role', $roles);
    }

    public function employee_information(){
        return $this->hasOne(EmployeeInformation::class);
    }
}