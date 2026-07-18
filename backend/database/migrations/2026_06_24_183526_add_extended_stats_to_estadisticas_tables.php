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
        Schema::table('estadisticas_equipos', function (Blueprint $table) {
            $table->integer('posesion')->default(0)->after('asistencias');
            $table->integer('recuperaciones')->default(0)->after('entradas_exitosas');
            $table->integer('fueras_lugar')->default(0)->after('tarjetas_rojas');
            $table->integer('tiros_esquina')->default(0)->after('fueras_lugar');
            $table->integer('tiros_libres')->default(0)->after('tiros_esquina');
            $table->integer('penales')->default(0)->after('tiros_libres');
            $table->integer('faltas_cometidas')->default(0)->after('penales');
            $table->decimal('precision_tiros', 5, 2)->default(0)->after('tiros');
            $table->decimal('tasa_exito_regates', 5, 2)->default(0)->after('precision_tiros');
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('estadisticas_equipos', function (Blueprint $table) {
            $table->dropColumn([
                'posesion', 'recuperaciones', 'fueras_lugar', 'tiros_esquina', 
                'tiros_libres', 'penales', 'faltas_cometidas',
                'precision_tiros', 'tasa_exito_regates'
            ]);
        });
    }
};
