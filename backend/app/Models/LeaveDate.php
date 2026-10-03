<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveDate extends Model
{
    protected $table = 'leave_dates';

    protected $fillable = [
        'leave_id',
        'leave_date',
    ];

    protected function casts(): array
    {
        return [
            'leave_date' => 'date:Y-m-d',
        ];
    }

    public function leave_detail(): BelongsTo
    {
        return $this->belongsTo(LeaveDetail::class, 'leave_id');
    }
}