<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Department;

class Position extends Model
{
    protected $table = 'positions';
    protected $fillable = [
        'department_id',
        'position_title',
    ];

    public function department(){
        return $this->belongsTo(Department::class);
    }
}
