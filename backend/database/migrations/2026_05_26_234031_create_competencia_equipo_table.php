<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('competencia_equipo', function (Blueprint $table) {
            $table->id();
            $table->foreignId('competencia_id')->constrained('competencias')->onDelete('cascade');
            $table->foreignId('equipo_id')->constrained('equipos')->onDelete('cascade');

            // Estado de la inscripción (El Admin la aprueba manualmente)
            $table->enum('estado_inscripcion', ['pendiente', 'aprobado', 'rechazado'])->default('aprobado');
            $table->timestamps();

            // Evita que un equipo se asigne dos veces al mismo torneo
            $table->unique(['competencia_id', 'equipo_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('competencia_equipo');
    }
};
