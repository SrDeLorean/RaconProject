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
        Schema::create('competencia_equipo_ut', function (Blueprint $table) {
            $table->id();
            $table->foreignId('competencia_ut_id')->constrained('competencias_ut')->cascadeOnDelete();
            $table->foreignId('equipo_ut_id')->constrained('equipos_ut')->cascadeOnDelete();
            $table->enum('estado_inscripcion', ['pendiente', 'aprobado', 'rechazado'])->default('aprobado');
            $table->timestamps();
            
            $table->unique(['competencia_ut_id', 'equipo_ut_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('competencia_equipo_ut');
    }
};
