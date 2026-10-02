<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('personnel_201_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')
                ->constrained('employee_information')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
            $table->string('file_name');
            $table->enum('file_type', ['communication', 'certification', 'training_certificates',
                                        'license_eligibility', 'academic_credentials',
                                        'prescreening_requirements', 'medical_certificate']);
            $table->string('file');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('personnel_201_files');
    }
};
