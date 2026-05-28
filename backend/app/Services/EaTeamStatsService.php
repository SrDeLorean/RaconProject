<?php

namespace App\Services;

use App\Models\EstadisticaEquipo;

class EaTeamStatsService
{
    /**
     * Procesa y persiste estadísticas agregadas de un equipo
     */
    public function procesar(
        array $clubData,
        array $aggregate,
        int $equipoId,
        int $calendarioId,
        int $temporadaCompetenciaId
    ): EstadisticaEquipo {

        $pasesIntentados   = (int) ($aggregate['passattempts'] ?? 0);
        $pasesCompletados  = (int) ($aggregate['passesmade'] ?? 0);
        $entradasIntentadas = (int) ($aggregate['tackleattempts'] ?? 0);
        $entradasExitosas   = (int) ($aggregate['tacklesmade'] ?? 0);

        return EstadisticaEquipo::create([
            // Relaciones
            'equipo_id'                => $equipoId,
            'partido_id'               => $calendarioId,
            'competencia_id'           => $temporadaCompetenciaId,

            // OFENSIVA
            'goles_favor'              => (int) ($clubData['goals'] ?? 0),
            'goles_en_contra'          => (int) ($clubData['goalsAgainst'] ?? 0),
            'asistencias'              => (int) ($aggregate['assists'] ?? 0),
            'tiros'                    => (int) ($aggregate['shots'] ?? 0),

            // PASES
            'pases_intentados'         => $pasesIntentados,
            'pases_completados'        => $pasesCompletados,
            'precision_pases'          => $pasesIntentados > 0
                ? round(($pasesCompletados / $pasesIntentados) * 100, 2)
                : 0,

            // DEFENSA
            'entradas_intentadas'      => $entradasIntentadas,
            'entradas_exitosas'        => $entradasExitosas,
            'tasa_exito_entradas'      => $entradasIntentadas > 0
                ? round(($entradasExitosas / $entradasIntentadas) * 100, 2)
                : 0,

            'tarjetas_rojas'           => (int) ($aggregate['redcards'] ?? 0),
            'goles_contra_agregado'    => (int) ($aggregate['goalsconceded'] ?? 0),

            // PORTERÍA
            'atajadas'                 => (int) ($aggregate['saves'] ?? 0),
            'atajadas_buena_colocacion'=> (int) ($aggregate['goodDirectionSaves'] ?? 0),
            'atajadas_volada'          => (int) ($aggregate['ballDiveSaves'] ?? 0),
            'atajadas_reflejos'        => (int) ($aggregate['reflexSaves'] ?? 0),
            'centros_cortados'         => (int) ($aggregate['crossSaves'] ?? 0),
            'despejes_punos'           => (int) ($aggregate['punchSaves'] ?? 0),
            'desvios'                  => (int) ($aggregate['parrySaves'] ?? 0),

            // VALLAS INVICTAS
            'valla_invicta_global'     => (bool) ($aggregate['cleansheetsany'] ?? false),
            'valla_invicta_defensa'    => (bool) ($aggregate['cleansheetsdef'] ?? false),
            'valla_invicta_portero'    => (bool) ($aggregate['cleansheetsgk'] ?? false),

            // RESULTADOS
            'valoracion_agregada'      => (float) ($aggregate['rating'] ?? 0),
            'jugador_partido'          => (bool) ($aggregate['mom'] ?? false),

            // TIEMPOS
            'segundos_jugados_agregado'=> (int) ($aggregate['secondsPlayed'] ?? 0),
            'tiempo_juego_motor'       => (int) ($aggregate['gameTime'] ?? 0),
            'tiempo_inactivo_agregado' => (int) ($aggregate['realtimeidle'] ?? 0),
            'tiempo_real_lag'          => (int) ($aggregate['realtimegame'] ?? 0),

            // META
            'procesado'                => true,
        ]);
    }
}
