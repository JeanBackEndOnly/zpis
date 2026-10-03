<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class EmployeeInformation extends Model
{
    // Edit this list to match your HR policy
    public const EMPLOYMENT_STATUSES = ['Regular', 'Probationary', 'Contractual', 'Casual', 'Part-time'];

    protected $table = 'employee_information';

    protected $fillable = [
        'user_id',
        'department_id',
        'unit_section_id',
        'position_id',
        'employment_id',
        'employment_status',
        'date_hired',
        'sss_no',
        'philhealth_no',
        'pagibig_no',
        'tin_no',
        'houseBlock',
        'street',
        'subdivision',
        'barangay',
        'city_muntinlupa',
        'province',
        'zip_code',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function unit_section(): BelongsTo
    {
        return $this->belongsTo(UnitSection::class);
    }

    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class);
    }

    // Full salary history
    public function employmentDetails(): HasMany
    {
        return $this->hasMany(EmploymentDetail::class, 'employee_id');
    }

    // The salary record that is active right now
    public function currentEmploymentDetail(): HasOne
    {
        return $this->hasOne(EmploymentDetail::class, 'employee_id')->where('is_current', true);
    }

    public function leaveCredits(): HasMany
    {
        return $this->hasMany(LeaveCredit::class, 'employee_id');
    }

    // Leave requests filed by this employee
    public function leaveDetails(): HasMany
    {
        return $this->hasMany(LeaveDetail::class, 'employee_id');
    }
}