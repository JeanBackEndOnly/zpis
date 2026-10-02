<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\ScheduleTemplate;
use App\Models\EmployeeInformation;

class EmployeeSchedule extends Model
{
    protected $table = '';
    protected $fillable = [
        'employee_id',  
        'schedule_id',  
        'effective_date',  
    ];

    public function schedule_template(){
        return $this->belongsTo(ScheduleTemplate::class);
    }
    public function employee_information(){
        return $this->belongsTo(EmployeeInformation::class);
    }
}
