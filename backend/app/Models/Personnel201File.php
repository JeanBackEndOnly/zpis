<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Personnel201File extends Model
{
    // These values match the file_type enum in the personnel_201_files migration
    public const TYPES = [
        'communication',
        'certification',
        'training_certificates',
        'license_eligibility',
        'academic_credentials',
        'prescreening_requirements',
        'medical_certificate',
    ];

    protected $table = 'personnel_201_files';

    protected $fillable = [
        'employee_id',
        'file_name',
        'file_type',
        'file',
    ];

    // The storage path stays on the server; clients download through the API
    protected $hidden = ['file'];

    protected $appends = ['extension'];

    public function getExtensionAttribute(): string
    {
        return strtolower(pathinfo((string) $this->file, PATHINFO_EXTENSION));
    }

    public function employee_information(): BelongsTo
    {
        return $this->belongsTo(EmployeeInformation::class, 'employee_id');
    }
}