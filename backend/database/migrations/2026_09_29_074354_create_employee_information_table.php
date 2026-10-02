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
        Schema::create('employee_information', function (Blueprint $table) {
            $table->id();

            // Deleting a user removes their employee record
            $table->foreignId('user_id')
                ->unique()
                ->constrained('users')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();

            // restrictOnDelete: a department/unit/position that is still in use cannot be deleted
            $table->foreignId('department_id')
                ->constrained('departments')
                ->restrictOnDelete()
                ->cascadeOnUpdate();
            $table->foreignId('unit_section_id')
                ->constrained('unit_section')
                ->restrictOnDelete()
                ->cascadeOnUpdate();
            $table->foreignId('position_id')
                ->constrained('positions')
                ->restrictOnDelete()
                ->cascadeOnUpdate();

            $table->string('employment_id')->unique();
            $table->string('employment_status');
            $table->date('date_hired');
            $table->string('sss_no')->nullable();
            $table->string('philhealth_no')->nullable();
            $table->string('pagibig_no')->nullable();
            $table->string('tin_no')->nullable();
            $table->string('houseBlock')->nullable();
            $table->string('street')->nullable();
            $table->string('subdivision')->nullable();
            $table->string('barangay')->nullable();
            $table->string('city_muntinlupa')->nullable();
            $table->string('province')->nullable();
            $table->string('zip_code')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_information');
    }
};