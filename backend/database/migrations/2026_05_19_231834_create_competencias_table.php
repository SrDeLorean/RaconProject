<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('competencias', function (Blueprint $table) {
            $table->id();

            // Relación con Organizaciones (usamos 'organizacion_id' para evitar errores FK)
            $table->foreignId('organizacion_id')->constrained('organizaciones')->onDelete('cascade');

            // Datos básicos
            $table->string('nombre');
            $table->string('slug')->unique(); // Para URLs tipo /torneo/liga-pro-fc26
            $table->text('descripcion')->nullable(); // Pitch de venta para el usuario
            $table->string('banner')->nullable(); // Imagen para el frontend

            // Stats para atraer al público
            $table->string('formato')->default('liga'); // liga, copa, eliminatoria
            $table->decimal('prize_pool', 10, 2)->default(0.00); // Premio en dinero/moneda
            $table->decimal('entry_fee', 10, 2)->default(0.00); // Costo de entrada
            $table->integer('max_participantes')->default(16);

            // Estados y Control de Tiempo
            $table->enum('estado', ['borrador', 'inscripciones', 'en_curso', 'finalizada'])->default('borrador');
            $table->timestamp('fecha_inicio_inscripciones')->nullable();
            $table->timestamp('fecha_fin_inscripciones')->nullable();
            $table->timestamp('fecha_inicio_competencia')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('competencias');
    }
};
