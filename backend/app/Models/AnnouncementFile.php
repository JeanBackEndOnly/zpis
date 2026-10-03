<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Announcement;

class AnnouncementFile extends Model
{
    protected $table = 'announcement_file';
    protected $fillable = [
        'announcement_id',
        'file_name',
        'announcement_file'
    ];

    public function announcement(){
        return $this->belongsTo(Announcement::class);
    }
}
