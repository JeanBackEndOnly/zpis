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
        Schema::create('leave_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')
                ->constrained('employee_information')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
            $table->enum('leave_type', ['special_leave', 'vacation_leave', 'sick_leave', 'others_leave']);
            $table->string('others_specify')->nullable();
            $table->enum('leave_status', ['pending', 'approve', 'disapproved']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_details');
    }
};
