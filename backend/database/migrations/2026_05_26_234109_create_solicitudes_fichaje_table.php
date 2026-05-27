<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('solicitudes_fichaje', function (Blueprint $table) {
            $table->id();

            // Contexto de la transferencia
            $table->foreignId('temporada_id')->constrained('temporadas')->onDelete('cascade');
            $table->foreignId('equipo_id')->constrained('equipos')->onDelete('cascade'); // Club comprador
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');     // Jugador a fichar

            // Estados del trámite (Refleja la lógica de cobro/aprobación)
            $table->enum('estado', ['pendiente_pago', 'aprobado', 'rechazado', 'libre_transito'])->default('libre_transito');

            // Campos de auditoría financiera y administrativa
            $table->string('comprobante_pago')->nullable(); // Foto/Voucher del depósito
            $table->text('observaciones_admin')->nullable(); // Por qué se rechazó, por ejemplo

            $table->timestamps();

            // Índices para búsquedas rápidas de historial
            $table->index('estado');
            $table->index(['temporada_id', 'equipo_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('solicitudes_fichaje');
    }
};
