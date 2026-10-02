<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeSchedule extends Model
{
    protected $table = 'employee_schedule';

    protected $fillable = [
        'employee_id',
        'schedule_id',
        'effective_date',
    ];

    protected function casts(): array
    {
        return [
            'effective_date' => 'date:Y-m-d',
        ];
    }

    public function schedule_template(): BelongsTo
    {
        return $this->belongsTo(ScheduleTemplate::class, 'schedule_id');
    }

    public function employee_information(): BelongsTo
    {
        return $this->belongsTo(EmployeeInformation::class, 'employee_id');
    }
}