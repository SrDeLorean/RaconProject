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

                // Verificar conflicto de ID EA antes de auto-asignación
                if (empty($systemUser->id_ea)) {
                    $conflictUser = User::where('id_ea', $playername)->first();
                    if ($conflictUser) {
                        $warningPlayers[] = [
                            'playername' => $playername,
                            'club' => $clubName,
                            'reason' => "Conflicto de ID de EA: El ID de EA '{$playername}' ya está registrado por el jugador '{$conflictUser->name}' (Gamertag: {$conflictUser->gamertag})."
                        ];
                    }
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
                        $conflictUser = User::where('id_ea', $playername)->first();
                        if ($conflictUser) {
                            return response()->json([
                                'success' => false,
                                'message' => "Conflicto de ID de EA: El ID de EA '{$playername}' ya está registrado por el jugador '{$conflictUser->name}' (Gamertag: {$conflictUser->gamertag}). Por favor, verifica la configuración de IDs en el sistema."
                            ], 422);
                        }
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

        $result = $procesarJugadoresUt($players[$clubLocalId], $partido->local);
        if ($result instanceof JsonResponse) {
            return $result;
        }

        $result = $procesarJugadoresUt($players[$clubVisitanteId], $partido->visitante);
        if ($result instanceof JsonResponse) {
            return $result;
        }

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

    /**
     * Enviar reporte manual por parte de un capitán en UT.
     */
    public function submitManualReport(Request $request, $id): JsonResponse
    {
        $partido = PartidoUt::with(['local', 'visitante', 'competencia'])->findOrFail($id);
        $user = Auth::user();

        $isOrganizerOrAdmin = in_array($user->role, ['administrador', 'organizador']);
        $isHomeCaptain = $partido->local && $partido->local->id_capitan == $user->id;
        $isAwayCaptain = $partido->visitante && $partido->visitante->id_capitan == $user->id;

        if (!$isOrganizerOrAdmin && !$isHomeCaptain && !$isAwayCaptain) {
            return response()->json(['message' => 'No tienes permiso para reportar este partido.'], 403);
        }

        if ($partido->reporte_confirmado) {
            return response()->json(['message' => 'Este partido ya ha sido confirmado y cerrado por el organizador.'], 422);
        }

        $data = $request->validate([
            'goles_local'     => ['required', 'integer', 'min:0'],
            'goles_visitante' => ['required', 'integer', 'min:0'],
            'fotos'           => ['required', 'array'],
            'fotos.partido'   => ['nullable', 'string'],
            'fotos.jugadores' => ['nullable', 'string'],
            'fotos.conectados'=> ['nullable', 'string'],
            'team_stats'      => ['required', 'array'],
            'player_stats'    => ['required', 'array'],
            'side'            => ['nullable', 'string', 'in:local,visitante'],
        ]);

        // Si es empate, se exige que las 3 fotos estén presentes
        $isEmpate = (int)$data['goles_local'] === (int)$data['goles_visitante'];
        if ($isEmpate) {
            if (empty($data['fotos']['partido']) || empty($data['fotos']['jugadores']) || empty($data['fotos']['conectados'])) {
                return response()->json(['message' => 'Para reportar un empate es obligatorio subir las 3 fotos (Estadísticas del partido, Estadísticas del jugador, y Jugadores conectados).'], 422);
            }
        }

        // Determinar el lado (local/visitante) del reporte
        $side = $data['side'] ?? null;
        if (!$side) {
            if ($isHomeCaptain) {
                $side = 'local';
            } elseif ($isAwayCaptain) {
                $side = 'visitante';
            }
        }

        if (!$side) {
            return response()->json(['message' => 'Debes especificar el lado del reporte (local/visitante).'], 422);
        }

        $reportData = [
            'goles_local' => $data['goles_local'],
            'goles_visitante' => $data['goles_visitante'],
            'fotos' => $data['fotos'],
            'team_stats' => $data['team_stats'],
            'player_stats' => $data['player_stats'],
            'submitted_by' => $user->id,
            'submitted_at' => now()->toDateTimeString(),
        ];

        if ($side === 'local') {
            $partido->reporte_local_stats = $reportData;
            $partido->reporte_local_completado = true;
        } else {
            $partido->reporte_visitante_stats = $reportData;
            $partido->reporte_visitante_completado = true;
        }

        $partido->save();

        return response()->json([
            'success' => true,
            'message' => 'Reporte manual unificado enviado con éxito. Pendiente de revisión por el organizador.',
            'partido' => $partido
        ]);
    }

    /**
     * Confirmar y consolidar reporte manual por parte de un organizador en UT.
     */
    public function confirmManualReport(Request $request, $id): JsonResponse
    {
        $partido = PartidoUt::with(['local', 'visitante', 'competencia'])->findOrFail($id);
        $user = Auth::user();
        $isOrganizerOrAdmin = in_array($user->role, ['administrador', 'organizador']);

        if (!$isOrganizerOrAdmin) {
            return response()->json(['message' => 'No tienes permiso para confirmar este partido.'], 403);
        }

        if ($partido->reporte_confirmado) {
            return response()->json(['message' => 'Este partido ya ha sido confirmado y cerrado anteriormente.'], 422);
        }

        $data = $request->validate([
            'goles_local'     => ['required', 'integer', 'min:0'],
            'goles_visitante' => ['required', 'integer', 'min:0'],
            'local_stats'     => ['required', 'array'],
            'local_stats.team_stats' => ['required', 'array'],
            'local_stats.player_stats' => ['required', 'array'],
            'visitante_stats' => ['required', 'array'],
            'visitante_stats.team_stats' => ['required', 'array'],
            'visitante_stats.player_stats' => ['required', 'array'],
        ]);

        // Validar coherencia de estadísticas de plantilla Local en backend
        $localGoalsSum = collect($data['local_stats']['player_stats'])->sum('goles');
        $localAssistsSum = collect($data['local_stats']['player_stats'])->sum('asistencias');
        $localTeamGoals = (int)($data['local_stats']['team_stats']['goles_favor'] ?? 0);
        $localTeamAssists = (int)($data['local_stats']['team_stats']['asistencias'] ?? 0);

        if ($localGoalsSum !== $localTeamGoals) {
            return response()->json(['message' => "La suma de goles de los jugadores locales ({$localGoalsSum}) no coincide con los Goles a Favor del club local ({$localTeamGoals})."], 422);
        }
        if ($localAssistsSum !== $localTeamAssists) {
            return response()->json(['message' => "La suma de asistencias de los jugadores locales ({$localAssistsSum}) no coincide con las Asistencias del club local ({$localTeamAssists})."], 422);
        }

        // Validar coherencia de estadísticas de plantilla Visitante en backend
        $visitanteGoalsSum = collect($data['visitante_stats']['player_stats'])->sum('goles');
        $visitanteAssistsSum = collect($data['visitante_stats']['player_stats'])->sum('asistencias');
        $visitanteTeamGoals = (int)($data['visitante_stats']['team_stats']['goles_favor'] ?? 0);
        $visitanteTeamAssists = (int)($data['visitante_stats']['team_stats']['asistencias'] ?? 0);

        if ($visitanteGoalsSum !== $visitanteTeamGoals) {
            return response()->json(['message' => "La suma de goles de los jugadores visitantes ({$visitanteGoalsSum}) no coincide con los Goles a Favor del club visitante ({$visitanteTeamGoals})."], 422);
        }
        if ($visitanteAssistsSum !== $visitanteTeamAssists) {
            return response()->json(['message' => "La suma de asistencias de los jugadores visitantes ({$visitanteAssistsSum}) no coincide con las Asistencias del club visitante ({$visitanteTeamAssists})."], 422);
        }

        DB::transaction(function() use ($partido, $data) {
            // 1. Eliminar estadísticas previas
            EstadisticaEquipoUt::where('partido_ut_id', $partido->id)->delete();
            EstadisticaJugadorUt::where('partido_ut_id', $partido->id)->delete();
            EstadisticaJugadorUtLog::where('partido_ut_id', $partido->id)->delete();

            // 2. Procesar Equipo Local
            $localTeamStats = $data['local_stats']['team_stats'];
            $localPlayerStats = $data['local_stats']['player_stats'];
            
            $pasesIntentadosLocal = (int)($localTeamStats['pases_intentados'] ?? 0);
            $precisionPasesLocal = (float)($localTeamStats['precision_pases'] ?? 0);
            $pasesCompletadosLocal = round($pasesIntentadosLocal * ($precisionPasesLocal / 100));

            $entradasIntentadasLocal = (int)($localTeamStats['entradas_intentadas'] ?? 0);
            $entradasExitosasLocal = (int)($localTeamStats['entradas_exitosas'] ?? 0);
            $tasaEntradasLocal = $entradasIntentadasLocal > 0 ? round(($entradasExitosasLocal / $entradasIntentadasLocal) * 100, 2) : 0;

            $avgRatingLocal = 0;
            if (count($localPlayerStats) > 0) {
                $avgRatingLocal = collect($localPlayerStats)->avg('valoracion') ?? 0;
            }

            EstadisticaEquipoUt::create([
                'equipo_ut_id' => $partido->equipo_ut_local_id,
                'partido_ut_id' => $partido->id,
                'competencia_ut_id' => $partido->competencia_ut_id,
                'goles_favor' => (int)($localTeamStats['goles_favor'] ?? 0),
                'goles_en_contra' => (int)($localTeamStats['goles_en_contra'] ?? 0),
                'asistencias' => (int)($localTeamStats['asistencias'] ?? 0),
                'tiros' => (int)($localTeamStats['tiros'] ?? 0),
                'pases_intentados' => $pasesIntentadosLocal,
                'pases_completados' => $pasesCompletadosLocal,
                'precision_pases' => $precisionPasesLocal,
                'entradas_intentadas' => $entradasIntentadasLocal,
                'entradas_exitosas' => $entradasExitosasLocal,
                'tasa_exito_entradas' => $tasaEntradasLocal,
                'tarjetas_rojas' => (int)($localTeamStats['tarjetas_rojas'] ?? 0),
                'tarjetas_amarillas' => (int)($localTeamStats['tarjetas_amarillas'] ?? 0),
                'valla_invicta_global' => (int)($localTeamStats['goles_en_contra'] ?? 0) === 0 ? 1 : 0,
                'valoracion_agregada' => $avgRatingLocal,
                'procesado' => true
            ]);

            // 3. Procesar Equipo Visitante
            $visitTeamStats = $data['visitante_stats']['team_stats'];
            $visitPlayerStats = $data['visitante_stats']['player_stats'];
            
            $pasesIntentadosVisit = (int)($visitTeamStats['pases_intentados'] ?? 0);
            $precisionPasesVisit = (float)($visitTeamStats['precision_pases'] ?? 0);
            $pasesCompletadosVisit = round($pasesIntentadosVisit * ($precisionPasesVisit / 100));

            $entradasIntentadasVisit = (int)($visitTeamStats['entradas_intentadas'] ?? 0);
            $entradasExitosasVisit = (int)($visitTeamStats['entradas_exitosas'] ?? 0);
            $tasaEntradasVisit = $entradasIntentadasVisit > 0 ? round(($entradasExitosasVisit / $entradasIntentadasVisit) * 100, 2) : 0;

            $avgRatingVisit = 0;
            if (count($visitPlayerStats) > 0) {
                $avgRatingVisit = collect($visitPlayerStats)->avg('valoracion') ?? 0;
            }

            EstadisticaEquipoUt::create([
                'equipo_ut_id' => $partido->equipo_ut_visitante_id,
                'partido_ut_id' => $partido->id,
                'competencia_ut_id' => $partido->competencia_ut_id,
                'goles_favor' => (int)($visitTeamStats['goles_favor'] ?? 0),
                'goles_en_contra' => (int)($visitTeamStats['goles_en_contra'] ?? 0),
                'asistencias' => (int)($visitTeamStats['asistencias'] ?? 0),
                'tiros' => (int)($visitTeamStats['tiros'] ?? 0),
                'pases_intentados' => $pasesIntentadosVisit,
                'pases_completados' => $pasesCompletadosVisit,
                'precision_pases' => $precisionPasesVisit,
                'entradas_intentadas' => $entradasIntentadasVisit,
                'entradas_exitosas' => $entradasExitosasVisit,
                'tasa_exito_entradas' => $tasaEntradasVisit,
                'tarjetas_rojas' => (int)($visitTeamStats['tarjetas_rojas'] ?? 0),
                'tarjetas_amarillas' => (int)($visitTeamStats['tarjetas_amarillas'] ?? 0),
                'valla_invicta_global' => (int)($visitTeamStats['goles_en_contra'] ?? 0) === 0 ? 1 : 0,
                'valoracion_agregada' => $avgRatingVisit,
                'procesado' => true
            ]);

            // 4. Guardar Estadísticas de Jugadores Locales y Registrar Logs
            $jugadoresJugoIds = [];
            foreach ($localPlayerStats as $p) {
                $userId = $p['jugador_id'];
                $jugadoresJugoIds[] = $userId;

                $user = User::find($userId);
                if ($user) {
                    EstadisticaJugadorUt::create([
                        'jugador_id' => $user->id,
                        'equipo_ut_id' => $partido->equipo_ut_local_id,
                        'partido_ut_id' => $partido->id,
                        'competencia_ut_id' => $partido->competencia_ut_id,
                        'posicion' => $user->posicion ?? 'MC',
                        'valoracion' => (float)($p['valoracion'] ?? 6.0),
                        'goles' => (int)($p['goles'] ?? 0),
                        'asistencias' => (int)($p['asistencias'] ?? 0),
                        'pases_completados' => (int)($p['pases'] ?? 0),
                        'pases_intentados' => (int)($p['pases'] ?? 0),
                        'precision_pases' => (int)($p['pases'] ?? 0) > 0 ? 100 : 0,
                        'tarjetas_rojas' => !empty($p['redCard']) ? 1 : 0,
                        'tarjetas_amarillas' => !empty($p['yellowCard']) ? 1 : 0,
                    ]);

                    EstadisticaJugadorUtLog::create([
                        'playername' => $user->gamertag ?: $user->name,
                        'partido_ut_id' => $partido->id,
                        'jugador_id' => $user->id,
                        'equipo_ut_id' => $partido->equipo_ut_local_id,
                        'competencia_ut_id' => $partido->competencia_ut_id,
                        'jugo' => true,
                        'procesado' => true,
                        'estado' => 'ok'
                    ]);
                }
            }

            // 5. Guardar Estadísticas de Jugadores Visitantes y Registrar Logs
            foreach ($visitPlayerStats as $p) {
                $userId = $p['jugador_id'];
                $jugadoresJugoIds[] = $userId;

                $user = User::find($userId);
                if ($user) {
                    EstadisticaJugadorUt::create([
                        'jugador_id' => $user->id,
                        'equipo_ut_id' => $partido->equipo_ut_visitante_id,
                        'partido_ut_id' => $partido->id,
                        'competencia_ut_id' => $partido->competencia_ut_id,
                        'posicion' => $user->posicion ?? 'MC',
                        'valoracion' => (float)($p['valoracion'] ?? 6.0),
                        'goles' => (int)($p['goles'] ?? 0),
                        'asistencias' => (int)($p['asistencias'] ?? 0),
                        'pases_completados' => (int)($p['pases'] ?? 0),
                        'pases_intentados' => (int)($p['pases'] ?? 0),
                        'precision_pases' => (int)($p['pases'] ?? 0) > 0 ? 100 : 0,
                        'tarjetas_rojas' => !empty($p['redCard']) ? 1 : 0,
                        'tarjetas_amarillas' => !empty($p['yellowCard']) ? 1 : 0,
                    ]);

                    EstadisticaJugadorUtLog::create([
                        'playername' => $user->gamertag ?: $user->name,
                        'partido_ut_id' => $partido->id,
                        'jugador_id' => $user->id,
                        'equipo_ut_id' => $partido->equipo_ut_visitante_id,
                        'competencia_ut_id' => $partido->competencia_ut_id,
                        'jugo' => true,
                        'procesado' => true,
                        'estado' => 'ok'
                    ]);
                }
            }

            // 6. Roster Logs para los que no jugaron
            $rosterUsers = collect([
                $partido->local?->id_capitan,
                $partido->local?->id_companero,
                $partido->visitante?->id_capitan,
                $partido->visitante?->id_companero
            ])->filter()->unique()->toArray();

            $jugadoresEquipo = User::whereIn('id', $rosterUsers)->get();
            foreach ($jugadoresEquipo as $jugador) {
                if (!in_array($jugador->id, $jugadoresJugoIds)) {
                    $teamId = ($partido->local && ($partido->local->id_capitan == $jugador->id || $partido->local->id_companero == $jugador->id)) 
                        ? $partido->equipo_ut_local_id 
                        : $partido->equipo_ut_visitante_id;

                    EstadisticaJugadorUtLog::create([
                        'playername' => $jugador->gamertag ?: $jugador->name,
                        'partido_ut_id' => $partido->id,
                        'jugador_id' => $jugador->id,
                        'equipo_ut_id' => $teamId,
                        'competencia_ut_id' => $partido->competencia_ut_id,
                        'jugo' => false,
                        'procesado' => false,
                        'estado' => 'no_jugo'
                    ]);
                }
            }

            // 7. Actualizar el partido
            $partido->goles_local = $data['goles_local'];
            $partido->goles_visitante = $data['goles_visitante'];
            $partido->reporte_confirmado = true;
            $partido->reporte_local_completado = true;
            $partido->reporte_visitante_completado = true;
            $partido->save();
        });

        Cache::forget('competencia_ut_show_' . $partido->competencia_ut_id);

        return response()->json([
            'success' => true,
            'message' => 'Partido de UT confirmado y estadísticas unificadas guardadas exitosamente.'
        ]);
    }
}

