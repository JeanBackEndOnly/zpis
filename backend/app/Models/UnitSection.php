<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Department;

class UnitSection extends Model
{
    protected $table = 'unit_section';
    protected $fillable = [
        'department_id',
        'unit_section_name',
        'unit_section_code'
    ];

    public function department(){
        return $this->belongsTo(Department::class);
    }
}
