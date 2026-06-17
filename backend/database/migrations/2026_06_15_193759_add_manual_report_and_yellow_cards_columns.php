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
        // 1. Add manual report columns to partidos table
        Schema::table('partidos', function (Blueprint $table) {
            $table->json('reporte_local_stats')->nullable()->after('stats');
            $table->json('reporte_visitante_stats')->nullable()->after('reporte_local_stats');
            $table->boolean('reporte_local_completado')->default(false)->after('reporte_visitante_stats');
            $table->boolean('reporte_visitante_completado')->default(false)->after('reporte_local_completado');
            $table->boolean('reporte_confirmado')->default(false)->after('reporte_visitante_completado');
        });

        // 2. Add manual report columns to partidos_ut table
        if (Schema::hasTable('partidos_ut')) {
            Schema::table('partidos_ut', function (Blueprint $table) {
                $table->json('reporte_local_stats')->nullable()->after('stats');
                $table->json('reporte_visitante_stats')->nullable()->after('reporte_local_stats');
                $table->boolean('reporte_local_completado')->default(false)->after('reporte_visitante_stats');
                $table->boolean('reporte_visitante_completado')->default(false)->after('reporte_local_completado');
                $table->boolean('reporte_confirmado')->default(false)->after('reporte_visitante_completado');
            });
        }

        // 3. Add tarjetas_amarillas to stats tables
        Schema::table('estadisticas_equipos', function (Blueprint $table) {
            $table->integer('tarjetas_amarillas')->default(0)->after('tarjetas_rojas');
        });

        if (Schema::hasTable('estadisticas_equipos_ut')) {
            Schema::table('estadisticas_equipos_ut', function (Blueprint $table) {
                $table->integer('tarjetas_amarillas')->default(0)->after('tarjetas_rojas');
            });
        }

        Schema::table('estadisticas_jugadores', function (Blueprint $table) {
            $table->integer('tarjetas_amarillas')->default(0)->after('tarjetas_rojas');
        });

        if (Schema::hasTable('estadisticas_jugadores_ut')) {
            Schema::table('estadisticas_jugadores_ut', function (Blueprint $table) {
                $table->integer('tarjetas_amarillas')->default(0)->after('tarjetas_rojas');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('partidos', function (Blueprint $table) {
            $table->dropColumn([
                'reporte_local_stats',
                'reporte_visitante_stats',
                'reporte_local_completado',
                'reporte_visitante_completado',
                'reporte_confirmado'
            ]);
        });

        if (Schema::hasTable('partidos_ut')) {
            Schema::table('partidos_ut', function (Blueprint $table) {
                $table->dropColumn([
                    'reporte_local_stats',
                    'reporte_visitante_stats',
                    'reporte_local_completado',
                    'reporte_visitante_completado',
                    'reporte_confirmado'
                ]);
            });
        }

        Schema::table('estadisticas_equipos', function (Blueprint $table) {
            $table->dropColumn('tarjetas_amarillas');
        });

        if (Schema::hasTable('estadisticas_equipos_ut')) {
            Schema::table('estadisticas_equipos_ut', function (Blueprint $table) {
                $table->dropColumn('tarjetas_amarillas');
            });
        }

        Schema::table('estadisticas_jugadores', function (Blueprint $table) {
            $table->dropColumn('tarjetas_amarillas');
        });

        if (Schema::hasTable('estadisticas_jugadores_ut')) {
            Schema::table('estadisticas_jugadores_ut', function (Blueprint $table) {
                $table->dropColumn('tarjetas_amarillas');
            });
        }
    }
};
