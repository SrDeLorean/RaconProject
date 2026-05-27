<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('competencia_equipo_usuario', function (Blueprint $table) {
            $table->id();

            // Relaciones al torneo y al club
            $table->foreignId('competencia_id')->constrained('competencias')->onDelete('cascade');
            $table->foreignId('equipo_id')->constrained('equipos')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');

            // Datos tácticos para ESTA competencia en particular
            $table->integer('dorsal')->nullable();
            $table->string('posicion_bloque', 10)->nullable(); // Ej: POR, DEF, MED, DEL, DFC, DC

            $table->timestamps();

            // 🔥 REGLA DE NEGOCIO: Un jugador solo juega en UN equipo en una competencia específica
            $table->unique(['competencia_id', 'user_id'], 'jugador_unico_en_competencia');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('competencia_equipo_usuario');
    }
};
