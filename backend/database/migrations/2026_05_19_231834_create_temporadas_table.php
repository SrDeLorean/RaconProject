<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('temporadas', function (Blueprint $table) {
            $table->id();

            // Relación con tu tabla original de Organizaciones
            $table->foreignId('organizacion_id')->constrained('organizaciones')->onDelete('cascade');

            // Identidad del Ciclo
            $table->string('nombre'); // Ej: "Temporada 1 - Clausura 2026"
            $table->string('slug')->unique(); // Ej: "temporada-1-clausura-2026"

            // 🔥 Control Maestro de Fichajes para esta organización en este ciclo temporal
            $table->enum('estado_mercado', ['abierto', 'cerrado'])->default('abierto');

            // Fechas del ciclo (opcionales, para automatizar cierres)
            $table->date('fecha_inicio')->nullable();
            $table->date('fecha_fin')->nullable();

            $table->boolean('activa')->default(true);
            $table->timestamps();
            $table->softDeletes();

            // Un nombre de temporada no debería repetirse en la misma organización
            $table->unique(['organizacion_id', 'nombre']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('temporadas');
    }
};
