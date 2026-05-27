<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organizacion_equipo_usuario', function (Blueprint $table) {
            $table->id();

            // Relaciones estructurales
            $table->foreignId('organizacion_id')->constrained('organizaciones')->onDelete('cascade');
            $table->foreignId('equipo_id')->constrained('equipos')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');

            // Estado contractual en el circuito general
            $table->enum('estado_fichaje', ['activo', 'a_prueba', 'transferible', 'suspendido'])->default('activo');

            // Auditoría (Para saber cuándo fichó por el club)
            $table->timestamp('fecha_vinculacion')->useCurrent();
            $table->timestamps();

            // 🔥 REGLA DE NEGOCIO: Un jugador solo puede estar en UN equipo por organización a la vez
            $table->unique(['organizacion_id', 'user_id'], 'jugador_unico_en_organizacion');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organizacion_equipo_usuario');
    }
};
