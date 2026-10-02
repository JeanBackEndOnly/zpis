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
        Schema::create('unit_section', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')
                ->constrained('departments')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
            $table->string('unit_section_name');
            $table->string('unit_section_code');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('unit_section');
    }
};
