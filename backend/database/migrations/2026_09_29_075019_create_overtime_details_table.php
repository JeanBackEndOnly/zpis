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
        Schema::create('overtime_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')
                ->constrained('employee_information')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
           $table->foreignId('approved_by')
                ->constrained('employee_information')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
            $table->date('overtime_date');
            $table->integer('total_hours');
            $table->enum('overtime_status', ['pending', 'approved', 'disapproved']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('overtime_details');
    }
};
