<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveCredit extends Model
{
    public const TYPES = ['vacation', 'sick', 'special', 'others'];

    protected $table = 'leave_credits';

    protected $fillable = [
        'employee_id',
        'leave_type',
        'used',
        'remaining',
    ];

    protected function casts(): array
    {
        return [
            'used' => 'decimal:2',
            'remaining' => 'decimal:2',
        ];
    }

    public function employeeInformation(): BelongsTo
    {
        return $this->belongsTo(EmployeeInformation::class, 'employee_id');
    }
}