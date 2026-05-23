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
            $table->foreignId('id_temporada_division')->constrained('temporada_divisiones')->onDelete('cascade');
            $table->foreignId('id_equipo_local')->constrained('equipos')->onDelete('cascade');
            $table->foreignId('id_equipo_visitante')->constrained('equipos')->onDelete('cascade');
            $table->string('jornada', 50); // Ej: "Jornada 1", "Cuartos de final"
            $table->dateTime('fecha_hora')->nullable();
            $table->integer('goles_local')->nullable();
            $table->integer('goles_visitante')->nullable();
            $table->enum('estado', ['pendiente', 'jugado', 'revision'])->default('pendiente');
            $table->timestamps();
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
