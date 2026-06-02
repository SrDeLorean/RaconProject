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
            $table->foreignId('equipo_origen_id')
                  ->nullable()
                  ->after('temporada_id')
                  ->constrained('equipos')
                  ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('solicitudes_fichaje', function (Blueprint $table) {
            $table->dropForeign(['equipo_origen_id']);
            $table->dropColumn('equipo_origen_id');
        });
    }
};
