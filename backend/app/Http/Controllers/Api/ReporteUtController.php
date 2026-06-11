<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PartidoUt;
use App\Models\EquipoUt;
use App\Models\EstadisticaEquipoUt;
use App\Models\EstadisticaJugadorUt;
use App\Models\EstadisticaJugadorUtLog;
use App\Models\User;
use App\Services\EaProClubsService;
use App\Services\EaPlayerStatsMapper;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class ReporteUtController extends Controller
{
    /**
     * Obtener partidos disponibles desde la API de EA para los equipos UT.
     */
    public function getEaMatches($id, EaProClubsService $eaService): JsonResponse
    {
        $partido = PartidoUt::with(['local', 'visitante'])->findOrFail($id);
        $user = Auth::user();

        $isOrganizerOrAdmin = in_array($user->role, ['administrador', 'organizador']);
        $isHomeCaptain = $partido->local && $partido->local->id_capitan == $user->id;
        $isAwayCaptain = $partido->visitante && $partido->visitante->id_capitan == $user->id;

        if (!$isOrganizerOrAdmin && !$isHomeCaptain && !$isAwayCaptain) {
            return response()->json(['message' => 'No tienes permiso para reportar este partido.'], 403);
        }

        $clubLocalId = $partido->local?->club_id_ea;
        $clubVisitanteId = $partido->visitante?->club_id_ea;

        $matches = [];
        $matchType = 'friendlyMatch';

        if (!empty($clubLocalId)) {
            $res = $eaService->obtenerPartidos((string) $clubLocalId);
            $matches = array_merge($matches, $res['matches'] ?? []);
            $matchType = $res['matchType'] ?? $matchType;
        }

        if (!empty($clubVisitanteId) && empty($matches)) {
            $res = $eaService->obtenerPartidos((string) $clubVisitanteId);
            $matches = array_merge($matches, $res['matches'] ?? []);
            $matchType = $res['matchType'] ?? $matchType;
        }

        // Remover duplicados por matchId
        $matches = collect($matches)->unique('matchId')->values()->all();

        return response()->json([
            'partido_id' => $partido->id,
            'club_local' => $partido->local,
            'club_visitante' => $partido->visitante,
            'partidosEA' => $matches,
            'matchTypeEA' => $matchType,
            'tieneClubEA' => !empty($clubLocalId) || !empty($clubVisitanteId),
        ]);
    }

    /**
     * Procesar y guardar el reporte de EA para partidos UT
     */
    public function storeEaReport(Request $request, $id, EaProClubsService $eaService): JsonResponse
    {
        $partido = PartidoUt::with(['local.capitan', 'local.companero', 'visitante.capitan', 'visitante.companero', 'competencia'])->findOrFail($id);
        $user = Auth::user();

        $isOrganizerOrAdmin = in_array($user->role, ['administrador', 'organizador']);
        $isHomeCaptain = $partido->local && $partido->local->id_capitan == $user->id;
        $isAwayCaptain = $partido->visitante && $partido->visitante->id_capitan == $user->id;

        if (!$isOrganizerOrAdmin && !$isHomeCaptain && !$isAwayCaptain) {
            return response()->json(['message' => 'No tienes permiso para reportar este partido.'], 403);
        }

        if (!$isOrganizerOrAdmin && $partido->goles_local !== null && $partido->goles_visitante !== null) {
            return response()->json(['message' => 'Este partido ya ha sido reportado.'], 422);
        }

        $data = $request->validate([
            'ea_match_id'       => ['required', 'string'],
            'club_local_id'     => ['required', 'string'],
            'club_visitante_id' => ['required', 'string'],
        ]);

        $clubLocalEaId = $partido->local?->club_id_ea;
        $clubVisitanteEaId = $partido->visitante?->club_id_ea;

        if (empty($clubLocalEaId) && empty($clubVisitanteEaId)) {
            return response()->json(['message' => 'Los equipos no tienen registrado su ID de Club de EA.'], 422);
        }

        $queryClubId = !empty($clubLocalEaId) ? $clubLocalEaId : $clubVisitanteEaId;
        $eaData = $eaService->obtenerPartidos((string) $queryClubId);

        $match = collect($eaData['matches'] ?? [])->firstWhere('matchId', $data['ea_match_id']);

        if (!$match) {
            return response()->json(['message' => 'Partido EA no encontrado en los últimos encuentros.'], 404);
        }

        $clubLocalId = (string) $data['club_local_id'];
        $clubVisitanteId = (string) $data['club_visitante_id'];

        $players = $match['players'] ?? [];
        $aggregate = $match['aggregate'] ?? [];

        if (!isset($players[$clubLocalId]) || !isset($players[$clubVisitanteId])) {
            return response()->json(['message' => 'Las estadísticas del partido no corresponden a los clubes seleccionados.'], 422);
        }

        // --- VALIDACIÓN DE INTEGRANTES DEL EQUIPO UT ---
        $warningPlayers = [];

        $validateUtPlayers = function (array $playersEA, EquipoUt $team, string $clubName) use (&$warningPlayers) {
            $allowedUsers = collect([$team->capitan, $team->companero])->filter()->values();
            
            foreach ($playersEA as $playerEA) {
                $playername = $playerEA['playername'];
                
                // Buscar si existe el usuario en nuestro sistema con ese gamertag/EA ID
                $systemUser = User::where(function ($q) use ($playername) {
                    $q->where('id_ea', $playername)->orWhere('gamertag', $playername);
                })->first();

                if (!$systemUser) {
                    $warningPlayers[] = [
                        'playername' => $playername,
                        'club' => $clubName,
                        'reason' => 'El jugador no está registrado en la base de datos.'
                    ];
                    continue;
                }

                // Verificar si pertenece a esta pareja/equipo UT
                $isTeamRoster = $allowedUsers->contains('id', $systemUser->id);
                if (!$isTeamRoster) {
                    $warningPlayers[] = [
                        'playername' => $playername,
                        'club' => $clubName,
                        'reason' => 'El jugador no pertenece a la plantilla del equipo UT.'
                    ];
                }
            }
        };

        $validateUtPlayers($players[$clubLocalId], $partido->local, $partido->local->nombre);
        $validateUtPlayers($players[$clubVisitanteId], $partido->visitante, $partido->visitante->nombre);

        if (!empty($warningPlayers) && !$request->boolean('force')) {
            return response()->json([
                'success' => false,
                'code' => 'VALIDATION_WARNING',
                'players' => $warningPlayers,
                'message' => 'Algunos jugadores no están inscritos en este equipo UT.'
            ], 422);
        }

        // --- PROCESAR JUGADORES ---
        $eaPlayersGlobal = collect();

        $procesarJugadoresUt = function (array $playersEA, EquipoUt $team) use ($partido, &$eaPlayersGlobal) {
            $allowedUsers = collect([$team->capitan, $team->companero])->filter()->values();

            foreach ($playersEA as $playerEA) {
                $playername = $playerEA['playername'];
                $eaPlayersGlobal->push($playername);

                $user = User::where(function ($q) use ($playername) {
                    $q->where('id_ea', $playername)->orWhere('gamertag', $playername);
                })->first();

                $estado = 'ok';
                $procesado = false;

                if (!$user) {
                    $estado = 'no_existe_sistema';
                } else {
                    if (empty($user->id_ea)) {
                        $user->id_ea = $playername;
                        $user->save();
                    }

                    $isTeamRoster = $allowedUsers->contains('id', $user->id);
                    if (!$isTeamRoster) {
                        $estado = 'no_inscrito_equipo';
                    } else {
                        $estado = 'ok';
                        $procesado = true;
                    }
                }

                // Limpiar logs previos
                EstadisticaJugadorUtLog::where([
                    'playername' => $playername,
                    'partido_ut_id' => $partido->id
                ])->delete();

                EstadisticaJugadorUtLog::create([
                    'playername' => $playername,
                    'partido_ut_id' => $partido->id,
                    'jugador_id' => $user?->id,
                    'equipo_ut_id' => $team->id,
                    'competencia_ut_id' => $partido->competencia_ut_id,
                    'jugo' => true,
                    'procesado' => $procesado,
                    'estado' => $estado,
                ]);

                if ($user) {
                    EstadisticaJugadorUt::where([
                        'jugador_id' => $user->id,
                        'partido_ut_id' => $partido->id
                    ])->delete();
                }

                if (!$procesado) {
                    continue;
                }

                // Mapear estadísticas individuales utilizando el mapper común
                $mappedStats = EaPlayerStatsMapper::map(
                    $user->id,
                    $playerEA,
                    $team->id,
                    $partido->id,
                    $partido->competencia_ut_id
                );

                // Reemplazar nombres de las llaves foráneas para que calcen con la tabla de UT
                $mappedStatsUt = [
                    'jugador_id' => $mappedStats['jugador_id'],
                    'equipo_ut_id' => $mappedStats['equipo_id'],
                    'partido_ut_id' => $mappedStats['partido_id'],
                    'competencia_ut_id' => $mappedStats['competencia_id'],
                    'posicion' => $mappedStats['posicion'],
                    'valoracion' => $mappedStats['valoracion'],
                    'goles' => $mappedStats['goles'],
                    'asistencias' => $mappedStats['asistencias'],
                    'tiros' => $mappedStats['tiros'],
                    'tarjetas_rojas' => $mappedStats['tarjetas_rojas'],
                    'jugador_partido' => $mappedStats['jugador_partido'],
                    'pases_intentados' => $mappedStats['pases_intentados'],
                    'pases_completados' => $mappedStats['pases_completados'],
                    'precision_pases' => $mappedStats['precision_pases'],
                    'entradas_intentadas' => $mappedStats['entradas_intentadas'],
                    'entradas_exitosas' => $mappedStats['entradas_exitosas'],
                    'tasa_exito_entradas' => $mappedStats['tasa_exito_entradas'],
                    'segundos_jugados' => $mappedStats['segundos_jugados'],
                ];

                EstadisticaJugadorUt::create($mappedStatsUt);
            }
        };

        $procesarJugadoresUt($players[$clubLocalId], $partido->local);
        $procesarJugadoresUt($players[$clubVisitanteId], $partido->visitante);

        // Procesar logs para los integrantes que no jugaron
        $allowedLocalUsers = collect([$partido->local->capitan, $partido->local->companero])->filter()->values();
        $allowedVisitUsers = collect([$partido->visitante->capitan, $partido->visitante->companero])->filter()->values();
        $allTeamUsers = $allowedLocalUsers->concat($allowedVisitUsers);
        
        $eaPlayersGlobal = $eaPlayersGlobal->unique();
        EstadisticaJugadorUtLog::where('partido_ut_id', $partido->id)->where('jugo', false)->delete();

        foreach ($allTeamUsers as $jugador) {
            $teamId = $allowedLocalUsers->contains('id', $jugador->id) ? $partido->local->id : $partido->visitante->id;
            
            if (!$jugador->id_ea && !$jugador->gamertag) {
                EstadisticaJugadorUtLog::create([
                    'playername' => null,
                    'partido_ut_id' => $partido->id,
                    'jugador_id' => $jugador->id,
                    'equipo_ut_id' => $teamId,
                    'competencia_ut_id' => $partido->competencia_ut_id,
                    'jugo' => false,
                    'procesado' => false,
                    'estado' => 'sin_gamertag',
                ]);
                continue;
            }

            $idEa = $jugador->id_ea ?: $jugador->gamertag;

            if (!$eaPlayersGlobal->contains($idEa)) {
                EstadisticaJugadorUtLog::create([
                    'playername' => $idEa,
                    'partido_ut_id' => $partido->id,
                    'jugador_id' => $jugador->id,
                    'equipo_ut_id' => $teamId,
                    'competencia_ut_id' => $partido->competencia_ut_id,
                    'jugo' => false,
                    'procesado' => false,
                    'estado' => 'no_jugo',
                ]);
            }
        }

        // --- PROCESAR EQUIPOS ---
        EstadisticaEquipoUt::where('partido_ut_id', $partido->id)->delete();

        $procesarEquipoStats = function (array $clubData, array $agg, int $teamId) use ($partido) {
            $pasesIntentados   = (int) ($agg['passattempts'] ?? 0);
            $pasesCompletados  = (int) ($agg['passesmade'] ?? 0);
            $entradasIntentadas = (int) ($agg['tackleattempts'] ?? 0);
            $entradasExitosas   = (int) ($agg['tacklesmade'] ?? 0);

            EstadisticaEquipoUt::create([
                'equipo_ut_id' => $teamId,
                'partido_ut_id' => $partido->id,
                'competencia_ut_id' => $partido->competencia_ut_id,
                'goles_favor' => (int) ($clubData['goals'] ?? 0),
                'goles_en_contra' => (int) ($clubData['goalsAgainst'] ?? 0),
                'asistencias' => (int) ($agg['assists'] ?? 0),
                'tiros' => (int) ($agg['shots'] ?? 0),
                'pases_intentados' => $pasesIntentados,
                'pases_completados' => $pasesCompletados,
                'precision_pases' => $pasesIntentados > 0 ? round(($pasesCompletados / $pasesIntentados) * 100, 2) : 0,
                'entradas_intentadas' => $entradasIntentadas,
                'entradas_exitosas' => $entradasExitosas,
                'tasa_exito_entradas' => $entradasIntentadas > 0 ? round(($entradasExitosas / $entradasIntentadas) * 100, 2) : 0,
                'tarjetas_rojas' => (int) ($agg['redcards'] ?? 0),
                'valla_invicta_global' => (bool) ($agg['cleansheetsany'] ?? false),
                'valoracion_agregada' => (float) ($agg['rating'] ?? 0),
                'segundos_jugados_agregado' => (int) ($agg['secondsPlayed'] ?? 0),
                'tiempo_juego_motor' => (int) ($agg['gameTime'] ?? 0),
                'procesado' => true,
            ]);
        };

        $procesarEquipoStats($match['clubs'][$clubLocalId], $aggregate[$clubLocalId], $partido->local->id);
        $procesarEquipoStats($match['clubs'][$clubVisitanteId], $aggregate[$clubVisitanteId], $partido->visitante->id);

        // Actualizar marcador
        $partido->goles_local = (int) $match['clubs'][$clubLocalId]['goals'];
        $partido->goles_visitante = (int) $match['clubs'][$clubVisitanteId]['goals'];
        $partido->save();

        Cache::forget('competencia_ut_show_' . $partido->competencia_ut_id);

        return response()->json([
            'success' => true,
            'message' => 'Partido EA reportado y procesado exitosamente.',
            'goles_local' => $partido->goles_local,
            'goles_visitante' => $partido->goles_visitante,
        ]);
    }
}
