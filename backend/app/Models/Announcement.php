<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\AnnouncementFile;
use App\Models\EmployeeInformation;

class Announcement extends Model
{
    protected $table = 'announcement';
    protected $fillable = [
        'employee_id',
        'announcement_title',
        'announcement_description'
    ];

    public function employee_information(){
        return $this->belongsTo(EmployeeInformation::class);
    }
    
    public function announcement_files(){
        return $this->hasMany(AnnouncementFile::class);
    }
    
}
