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
        // 1. Add club_id_ea to equipos table
        Schema::table('equipos', function (Blueprint $table) {
            $table->string('club_id_ea')->nullable()->after('plataforma');
        });

        // 2. Create estadisticas_equipos table
        Schema::create('estadisticas_equipos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equipo_id')->constrained('equipos')->onDelete('cascade');
            $table->foreignId('partido_id')->constrained('partidos')->onDelete('cascade');
            $table->foreignId('competencia_id')->constrained('competencias')->onDelete('cascade');

            $table->integer('goles_favor')->default(0);
            $table->integer('goles_en_contra')->default(0);
            $table->integer('asistencias')->default(0);
            $table->integer('tiros')->default(0);

            $table->integer('pases_intentados')->default(0);
            $table->integer('pases_completados')->default(0);
            $table->decimal('precision_pases', 5, 2)->default(0);

            $table->integer('entradas_intentadas')->default(0);
            $table->integer('entradas_exitosas')->default(0);
            $table->decimal('tasa_exito_entradas', 5, 2)->default(0);

            $table->integer('tarjetas_rojas')->default(0);
            $table->integer('goles_contra_agregado')->default(0);

            $table->integer('atajadas')->default(0);
            $table->integer('atajadas_buena_colocacion')->default(0);
            $table->integer('atajadas_volada')->default(0);
            $table->integer('atajadas_reflejos')->default(0);
            $table->integer('centros_cortados')->default(0);
            $table->integer('despejes_punos')->default(0);
            $table->integer('desvios')->default(0);

            $table->boolean('valla_invicta_global')->default(false);
            $table->boolean('valla_invicta_defensa')->default(false);
            $table->boolean('valla_invicta_portero')->default(false);

            $table->decimal('valoracion_agregada', 4, 2)->default(0);
            $table->boolean('jugador_partido')->default(false);

            $table->integer('segundos_jugados_agregado')->default(0);
            $table->integer('tiempo_juego_motor')->default(0);
            $table->integer('tiempo_inactivo_agregado')->default(0);
            $table->integer('tiempo_real_lag')->default(0);

            $table->boolean('procesado')->default(false);
            $table->timestamps();
        });

        // 3. Create estadisticas_jugadores table
        Schema::create('estadisticas_jugadores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('jugador_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('equipo_id')->constrained('equipos')->onDelete('cascade');
            $table->foreignId('partido_id')->constrained('partidos')->onDelete('cascade');
            $table->foreignId('competencia_id')->constrained('competencias')->onDelete('cascade');

            $table->string('posicion')->default('unknown');
            $table->integer('id_arquetipo')->default(0);

            $table->decimal('valoracion', 4, 2)->default(0);
            $table->integer('goles')->default(0);
            $table->integer('asistencias')->default(0);
            $table->integer('tiros')->default(0);
            $table->integer('tarjetas_rojas')->default(0);
            $table->boolean('jugador_partido')->default(false);
            $table->string('resultado_usuario')->default('0');

            $table->decimal('precision_tiro', 5, 2)->default(0);

            $table->integer('pases_intentados')->default(0);
            $table->integer('pases_completados')->default(0);
            $table->decimal('precision_pases', 5, 2)->default(0);

            $table->integer('entradas_intentadas')->default(0);
            $table->integer('entradas_exitosas')->default(0);
            $table->decimal('tasa_exito_entradas', 5, 2)->default(0);

            $table->integer('goles_recibidos')->default(0);
            $table->integer('atajadas')->default(0);

            $table->integer('atajadas_buena_colocacion')->default(0);
            $table->integer('atajadas_volada')->default(0);
            $table->integer('atajadas_reflejos')->default(0);
            $table->integer('centros_cortados')->default(0);
            $table->integer('despejes_punos')->default(0);
            $table->integer('desvios')->default(0);

            $table->integer('segundos_jugados')->default(0);
            $table->integer('tiempo_juego_motor')->default(0);
            $table->integer('tiempo_inactivo')->default(0);
            $table->integer('tiempo_real_lag')->default(0);

            $table->timestamps();
        });

        // 4. Create estadisticas_jugadores_logs table
        Schema::create('estadisticas_jugadores_logs', function (Blueprint $table) {
            $table->id();
            $table->string('playername')->nullable();
            $table->foreignId('partido_id')->constrained('partidos')->onDelete('cascade');
            $table->foreignId('jugador_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->foreignId('equipo_id')->constrained('equipos')->onDelete('cascade');
            $table->foreignId('competencia_id')->constrained('competencias')->onDelete('cascade');

            $table->boolean('jugo')->default(false);
            $table->boolean('procesado')->default(false);
            $table->string('estado')->default('unknown');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('estadisticas_jugadores_logs');
        Schema::dropIfExists('estadisticas_jugadores');
        Schema::dropIfExists('estadisticas_equipos');

        Schema::table('equipos', function (Blueprint $table) {
            $table->dropColumn('club_id_ea');
        });
    }
};
