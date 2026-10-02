<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ScheduleTemplate extends Model
{
    protected $table = 'schedule_template';

    protected $fillable = ['schedule_name', 'schedule_from', 'schedule_to', 'shift'];

    public function employee_schedules(): HasMany
    {
        return $this->hasMany(EmployeeSchedule::class, 'schedule_id');
    }
}