<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\EmployeeSchedule;

class ScheduleTemplate extends Model
{
    protected $table = 'schedule_template';
    protected $fillable = ['schedule_name', 'schedule_from', 'schedule_to', 'shift'];

    public function employee_schedules(){
        return $this->hasMany(EmployeeSchedule::class);
    }
}
