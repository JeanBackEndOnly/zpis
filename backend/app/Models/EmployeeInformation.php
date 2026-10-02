<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Model\User;
use App\Model\Position;
use App\Model\UnitSection;
use App\Model\Department;

class EmployeeInformation extends Model
{
    protected $table = 'employee_information';
    protected $fillable = [
        'user_id',
        'department_id',
        'unit_section_id',
        'position_id',
        'employment_id',
        'employment_status',
        'date_hired',
        'first_name',
        'middle_name',
        'last_name',
        'suffix',
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

    public function user(){
        return $this->belongsTo(User::class);
    }
    public function department(){
        return $this->belongsTo(Department::class);
    }
    public function unit_section(){
        return $this->belongsTo(UnitSection::class);
    }
    public function position(){
        return $this->belongsTo(Position::class);
    }
}
