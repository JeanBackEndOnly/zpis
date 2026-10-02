<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\LeaveDetail;

class LeaveDate extends Model
{
    protected $table = 'leave_details';

    protected $fillable = [
        'leave_id',
        'leave_date'
    ];

    public function leave_detail(){
        return $this->belongsTo(LeaveDetail::class);
    }
}
