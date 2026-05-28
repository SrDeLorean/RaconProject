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
        Schema::table('solicitudes_fichaje', function (Blueprint $table) {
            $table->foreignId('organizacion_id')->nullable()->after('id')->constrained('organizaciones')->onDelete('cascade');
            $table->unsignedBigInteger('temporada_id')->nullable()->change();
            $table->dropColumn('estado');
        });

        Schema::table('solicitudes_fichaje', function (Blueprint $table) {
            $table->enum('estado', ['pendiente_jugador', 'pendiente_admin', 'aprobado', 'rechazado'])
                  ->default('pendiente_jugador')
                  ->after('user_id');
            $table->string('dorsal')->nullable()->after('estado');
            $table->string('posicion')->nullable()->after('dorsal');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('solicitudes_fichaje', function (Blueprint $table) {
            $table->dropColumn(['organizacion_id', 'estado', 'dorsal', 'posicion']);
        });

        Schema::table('solicitudes_fichaje', function (Blueprint $table) {
            $table->enum('estado', ['pendiente_pago', 'aprobado', 'rechazado', 'libre_transito'])->default('libre_transito')->after('user_id');
            $table->unsignedBigInteger('temporada_id')->nullable(false)->change();
        });
    }
};
