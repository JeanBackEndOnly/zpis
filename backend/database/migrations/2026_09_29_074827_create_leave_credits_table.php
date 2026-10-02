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
        Schema::create('leave_credits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')
                ->constrained('employee_information')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
            $table->enum('leave_type', ['vacation', 'sick', 'special', 'others']);
            $table->decimal('used', 12, 2);
            $table->decimal('remaining', 12, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_credits');
    }
};
