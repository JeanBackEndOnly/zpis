<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\EmployeeInformation;
use App\Models\LeaveDate;

class LeaveDetail extends Model
{
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
        'leave_status'
    ];

    public function employee_information(){
        return $this->belongsTo(EmployeeInformation::class);
    }
    public function leave_dates(){
        return $this->hasMany(LeaveDate::class);
    }
}
