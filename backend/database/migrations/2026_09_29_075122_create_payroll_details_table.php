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
        Schema::create('payroll_details', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                ->constrained('employee_information')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();

            $table->foreignId('payroll_period_id')
                ->constrained('payroll_periods')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();

            $table->decimal('gross_pay', 12, 2);
            $table->decimal('sss', 12, 2);
            $table->decimal('philhealth', 12, 2);
            $table->decimal('pagibig', 12, 2);
            $table->decimal('tax_deduction', 12, 2);
            $table->decimal('net_pay', 12, 2);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payroll_details');
    }
};
