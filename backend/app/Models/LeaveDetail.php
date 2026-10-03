<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LeaveDetail extends Model
{
    public const TYPE_SPECIAL  = 'special_leave';
    public const TYPE_VACATION = 'vacation_leave';
    public const TYPE_SICK     = 'sick_leave';
    public const TYPE_OTHERS   = 'others_leave';

    public const TYPES = [
        self::TYPE_VACATION,
        self::TYPE_SICK,
        self::TYPE_SPECIAL,
        self::TYPE_OTHERS,
    ];

    // These values match the enum in the leave_details migration
    public const STATUS_PENDING     = 'pending';
    public const STATUS_APPROVED    = 'approve';
    public const STATUS_DISAPPROVED = 'disapproved';

    public const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_APPROVED,
        self::STATUS_DISAPPROVED,
    ];

    // leave_details.leave_type => leave_credits.leave_type
    // "others" leave does not use leave credits
    public const CREDIT_TYPES = [
        self::TYPE_VACATION => 'vacation',
        self::TYPE_SICK     => 'sick',
        self::TYPE_SPECIAL  => 'special',
    ];

    protected $table = 'leave_details';

    protected $fillable = [
        'employee_id',
        'leave_type',
        'others_specify',
        'purpose',
        'number_of_days',
        'contact',
        'section_head',
        'department_head',
        'medical_proof',
        'request_date',
        'leave_status',
    ];

    protected function casts(): array
    {
        return [
            'number_of_days' => 'integer',
            'request_date'   => 'date:Y-m-d',
        ];
    }

    public function employee_information(): BelongsTo
    {
        return $this->belongsTo(EmployeeInformation::class, 'employee_id');
    }

    public function leave_dates(): HasMany
    {
        return $this->hasMany(LeaveDate::class, 'leave_id')->orderBy('leave_date');
    }

    /**
     * The matching leave_credits type, or null when this leave does not use credits.
     */
    public function creditType(): ?string
    {
        return self::CREDIT_TYPES[$this->leave_type] ?? null;
    }
}