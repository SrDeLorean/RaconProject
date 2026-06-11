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
        Schema::create('estadisticas_jugadores_ut', function (Blueprint $table) {
            $table->id();
            $table->foreignId('jugador_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('equipo_ut_id')->constrained('equipos_ut')->cascadeOnDelete();
            $table->foreignId('partido_ut_id')->constrained('partidos_ut')->cascadeOnDelete();
            $table->foreignId('competencia_ut_id')->constrained('competencias_ut')->cascadeOnDelete();
            
            $table->string('posicion')->default('unknown');
            $table->decimal('valoracion', 4, 2)->default(0);
            $table->integer('goles')->default(0);
            $table->integer('asistencias')->default(0);
            $table->integer('tiros')->default(0);
            $table->integer('tarjetas_rojas')->default(0);
            $table->boolean('jugador_partido')->default(false);
            
            $table->integer('pases_intentados')->default(0);
            $table->integer('pases_completados')->default(0);
            $table->decimal('precision_pases', 5, 2)->default(0);
            
            $table->integer('entradas_intentadas')->default(0);
            $table->integer('entradas_exitosas')->default(0);
            $table->decimal('tasa_exito_entradas', 5, 2)->default(0);
            
            $table->integer('segundos_jugados')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('estadisticas_jugadores_ut');
    }
};
