<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmploymentDetail extends Model
{
    public const SALARY_TYPES = ['Monthly', 'Hour', 'Daily', 'Commission'];

    protected $table = 'employment_details';

    protected $fillable = [
        'employee_id',
        'basic_salary',
        'salary_type',
        'date_effective',
        'is_current',
    ];

    protected function casts(): array
    {
        return [
            'basic_salary' => 'decimal:2',
            'date_effective' => 'date:Y-m-d',
            'is_current' => 'boolean',
        ];
    }

    public function employeeInformation(): BelongsTo
    {
        return $this->belongsTo(EmployeeInformation::class, 'employee_id');
    }
}