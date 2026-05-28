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
        Schema::create('partidos', function (Blueprint $table) {
            $table->id();
            
            $table->foreignId('competencia_id')->constrained('competencias')->onDelete('cascade');
            $table->foreignId('equipo_local_id')->constrained('equipos')->onDelete('cascade');
            $table->foreignId('equipo_visitante_id')->constrained('equipos')->onDelete('cascade');
            
            $table->string('jornada'); // e.g. "Jornada 1", "Grupo A - J1", "Semifinal", etc.
            $table->string('grupo')->nullable(); // e.g. "A", "B" (si es Copa)
            $table->date('fecha')->nullable();
            $table->string('hora')->nullable();
            
            // Marcador
            $table->integer('goles_local')->nullable();
            $table->integer('goles_visitante')->nullable();
            
            // Ficha técnica estructurada
            $table->json('stats')->nullable(); // Guardar JSON con shots, possession, individual player stats, etc.
            
            $table->timestamps();
            
            $table->index('competencia_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partidos');
    }
};
