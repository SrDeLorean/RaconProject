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
        Schema::create('estadisticas_jugadores_ut_logs', function (Blueprint $table) {
            $table->id();
            $table->string('playername')->nullable();
            $table->foreignId('partido_ut_id')->constrained('partidos_ut')->cascadeOnDelete();
            $table->foreignId('jugador_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->foreignId('equipo_ut_id')->constrained('equipos_ut')->cascadeOnDelete();
            $table->foreignId('competencia_ut_id')->constrained('competencias_ut')->cascadeOnDelete();
            
            $table->boolean('jugo')->default(false);
            $table->boolean('procesado')->default(false);
            $table->string('estado')->default('unknown');
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('estadisticas_jugadores_ut_logs');
    }
};
