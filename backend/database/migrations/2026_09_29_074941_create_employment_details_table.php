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
        Schema::create('employment_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')
                ->constrained('employee_information')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
            $table->decimal('basic_salary', 12, 2);
            $table->enum('salary_type', ['Monthly', 'Hour', 'Daily', 'Commission']);
            $table->date('date_effective');
            $table->boolean('is_current')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employment_details');
    }
};
