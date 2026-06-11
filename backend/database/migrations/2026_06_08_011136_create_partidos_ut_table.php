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
        Schema::create('partidos_ut', function (Blueprint $table) {
            $table->id();
            $table->foreignId('competencia_ut_id')->constrained('competencias_ut')->cascadeOnDelete();
            
            // Los equipos UT (pueden ser nulos temporalmente en brackets para BYEs)
            $table->foreignId('equipo_ut_local_id')->nullable()->constrained('equipos_ut')->cascadeOnDelete();
            $table->foreignId('equipo_ut_visitante_id')->nullable()->constrained('equipos_ut')->cascadeOnDelete();
            
            $table->string('jornada'); // Ej: "Jornada 1", "Semifinal"
            $table->string('grupo')->nullable();
            $table->date('fecha')->nullable();
            $table->string('hora')->nullable();
            
            // Marcador
            $table->integer('goles_local')->nullable();
            $table->integer('goles_visitante')->nullable();
            
            // Ficha técnica estructurada
            $table->json('stats')->nullable();
            
            $table->timestamps();
            
            $table->index('competencia_ut_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partidos_ut');
    }
};
