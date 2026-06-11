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
        Schema::create('competencias_ut', function (Blueprint $table) {
            $table->id();
            $table->foreignId('temporada_id')->constrained('temporadas')->cascadeOnDelete();
            
            // Datos básicos
            $table->string('nombre');
            $table->string('slug')->unique();
            $table->text('descripcion')->nullable();
            $table->text('reglas')->nullable();
            $table->string('logo')->nullable();
            $table->string('banner')->nullable();
            $table->string('color_tema')->default('#ef4444');
            
            // Configuración
            $table->enum('tipo', ['1vs1', '2vs2'])->default('1vs1');
            $table->enum('formato', ['liga', 'copa', 'eliminatoria'])->default('liga');
            $table->enum('plataforma', ['ps5', 'xbox', 'pc', 'crossplay'])->default('crossplay');
            $table->decimal('prize_pool', 10, 2)->default(0.00);
            $table->decimal('entry_fee', 10, 2)->default(0.00);
            $table->integer('max_participantes')->default(16);
            $table->boolean('es_publico')->default(true);
            
            // Estados y Control de Tiempo
            $table->enum('estado', ['borrador', 'inscripciones', 'en_curso', 'finalizada'])->default('borrador');
            $table->timestamp('fecha_inicio_inscripciones')->nullable();
            $table->timestamp('fecha_fin_inscripciones')->nullable();
            $table->timestamp('fecha_inicio_competencia')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            $table->index('estado');
            $table->index('temporada_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('competencias_ut');
    }
};
