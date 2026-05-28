<?php

namespace App\Services;

class EaPlayerStatsMapper
{
    /**
     * Mapea un jugador EA a datos DB
     */
    public static function map(
        int|string $userId,
        array $player,
        int $equipoId,
        int $calendarioId,
        int $temporadaCompetenciaId
    ): array {

        $tiros = (int) ($player['shots'] ?? 0);
        $goles = (int) ($player['goals'] ?? 0);

        $pasesIntentados = (int) ($player['passattempts'] ?? 0);
        $pasesCompletados = (int) ($player['passesmade'] ?? 0);

        $entradasIntentadas = (int) ($player['tackleattempts'] ?? 0);
        $entradasExitosas = (int) ($player['tacklesmade'] ?? 0);

        return [
            // Relaciones
            'jugador_id'               => $userId,
            'equipo_id'                => $equipoId,
            'partido_id'               => $calendarioId,
            'competencia_id'           => $temporadaCompetenciaId,

            // Identidad
            'posicion'     => $player['pos'] ?? 'unknown',
            'id_arquetipo' => (int) ($player['archetypeid'] ?? 0),

            // Rendimiento
            'valoracion'        => (float) ($player['rating'] ?? 0),
            'goles'             => $goles,
            'asistencias'       => (int) ($player['assists'] ?? 0),
            'tiros'             => $tiros,
            'tarjetas_rojas'    => (int) ($player['redcards'] ?? 0),
            'jugador_partido'   => (bool) ($player['mom'] ?? false),
            'resultado_usuario' => (string) ($player['userResult'] ?? '0'),

            // Precisión tiro
            'precision_tiro' => $tiros > 0
                ? round(($goles / $tiros) * 100, 2)
                : 0,

            // Pases
            'pases_intentados'  => $pasesIntentados,
            'pases_completados'=> $pasesCompletados,
            'precision_pases'  => $pasesIntentados > 0
                ? round(($pasesCompletados / $pasesIntentados) * 100, 2)
                : 0,

            // Entradas
            'entradas_intentadas' => $entradasIntentadas,
            'entradas_exitosas'   => $entradasExitosas,
            'tasa_exito_entradas' => $entradasIntentadas > 0
                ? round(($entradasExitosas / $entradasIntentadas) * 100, 2)
                : 0,

            // Portería
            'goles_recibidos' => (int) ($player['goalsconceded'] ?? 0),
            'atajadas'        => (int) ($player['saves'] ?? 0),

            'atajadas_buena_colocacion' => (int) ($player['goodDirectionSaves'] ?? 0),
            'atajadas_volada'           => (int) ($player['ballDiveSaves'] ?? 0),
            'atajadas_reflejos'         => (int) ($player['reflexSaves'] ?? 0),
            'centros_cortados'          => (int) ($player['crossSaves'] ?? 0),
            'despejes_punos'            => (int) ($player['punchSaves'] ?? 0),
            'desvios'                   => (int) ($player['parrySaves'] ?? 0),

            // Tiempos
            'segundos_jugados'   => (int) ($player['secondsPlayed'] ?? 0),
            'tiempo_juego_motor' => (int) ($player['gameTime'] ?? 0),
            'tiempo_inactivo'    => (int) ($player['realtimeidle'] ?? 0),
            'tiempo_real_lag'    => (int) ($player['realtimegame'] ?? 0),
        ];
    }
}
