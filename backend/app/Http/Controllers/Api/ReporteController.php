<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Partido;
use App\Models\EstadisticaJugador;
use App\Models\EstadisticaJugadorLog;
use App\Models\EstadisticaEquipo;
use App\Models\User;
use App\Services\EaProClubsService;
use App\Services\EaPlayerStatsMapper;
use App\Services\EaTeamStatsService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ReporteController extends Controller
{
    /**
     * Obtener partidos disponibles desde la API de EA para los clubes del encuentro.
     */
    public function getEaMatches(Partido $partido, EaProClubsService $eaService): JsonResponse
    {
        $user = Auth::user();

        // Cargar relaciones
        $partido->load(['local', 'visitante']);

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

        // Consultar partidos del equipo local
        if (!empty($clubLocalId)) {
            $res = $eaService->obtenerPartidos((string) $clubLocalId);
            $matches = array_merge($matches, $res['matches'] ?? []);
            $matchType = $res['matchType'] ?? $matchType;
        }

        // Consultar partidos del equipo visitante si es capitan visitante o admin, y no se obtuvieron antes
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
     * Procesar y guardar el reporte de EA
     */
    public function storeEaReport(
        Request $request,
        Partido $partido,
        EaProClubsService $eaService,
        EaTeamStatsService $teamStatsService
    ): JsonResponse {
        $user = Auth::user();

        // Cargar relaciones
        $partido->load(['local', 'visitante', 'competencia.temporada']);

        $isOrganizerOrAdmin = in_array($user->role, ['administrador', 'organizador']);
        $isHomeCaptain = $partido->local && $partido->local->id_capitan == $user->id;
        $isAwayCaptain = $partido->visitante && $partido->visitante->id_capitan == $user->id;

        if (!$isOrganizerOrAdmin && !$isHomeCaptain && !$isAwayCaptain) {
            return response()->json(['message' => 'No tienes permiso para reportar este partido.'], 403);
        }

        if (!$isOrganizerOrAdmin && $partido->goles_local !== null && $partido->goles_visitante !== null) {
            return response()->json(['message' => 'Este partido ya ha sido reportado y cerrado por el capitán correspondiente.'], 422);
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

        // Buscar partido en la API
        $queryClubId = !empty($clubLocalEaId) ? $clubLocalEaId : $clubVisitanteEaId;
        $eaData = $eaService->obtenerPartidos((string) $queryClubId);

        $match = collect($eaData['matches'] ?? [])
            ->firstWhere('matchId', $data['ea_match_id']);

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

        // --- INICIO VALIDACIÓN DE GAMERTAGS Y ID_EA ---
        $warningPlayers = [];

        $validatePlayers = function (array $playersEA, int $equipoId, string $clubName) use ($partido, &$warningPlayers) {
            $isSinTransferencias = isset($partido->competencia->config['sin_transferencias']) && $partido->competencia->config['sin_transferencias'] == true;
            $eaNames = array_column($playersEA, 'playername');
            $users = User::whereIn('id_ea', $eaNames)
                ->orWhereIn('gamertag', $eaNames)
                ->get();

            foreach ($playersEA as $playerEA) {
                $playername = $playerEA['playername'];
                $user = $users->first(function($u) use ($playername) {
                    return strtolower($u->id_ea) === strtolower($playername) || strtolower($u->gamertag) === strtolower($playername);
                });

                if (!$user) {
                    $warningPlayers[] = [
                        'playername' => $playername,
                        'club' => $clubName,
                        'reason' => 'El jugador no está registrado en el sistema.'
                    ];
                } else {
                    // Verificar si está inscrito en la plantilla (se omite si es sin transferencias)
                    $isInRoster = $isSinTransferencias || DB::table('organizacion_equipo_usuario')
                        ->where('user_id', $user->id)
                        ->where('equipo_id', $equipoId)
                        ->where('organizacion_id', $partido->competencia->temporada->organizacion_id)
                        ->where('estado_fichaje', 'activo')
                        ->exists();

                    if (!$isInRoster) {
                        $warningPlayers[] = [
                            'playername' => $playername,
                            'club' => $clubName,
                            'reason' => 'El jugador no pertenece a la plantilla activa de este equipo.'
                        ];
                    }

                    // Verificar si el EA ID y el Gamertag coinciden en el sistema
                    if (!empty($user->id_ea) && !empty($user->gamertag) && strtolower($user->id_ea) !== strtolower($user->gamertag)) {
                        $warningPlayers[] = [
                            'playername' => $playername,
                            'club' => $clubName,
                            'reason' => "Discrepancia de identidad: EA ID ({$user->id_ea}) y Gamertag ({$user->gamertag}) no coinciden."
                        ];
                    }

                    // Si no tiene gamertag
                    if (empty($user->gamertag)) {
                        $warningPlayers[] = [
                            'playername' => $playername,
                            'club' => $clubName,
                            'reason' => 'El jugador no tiene un Gamertag registrado en su perfil.'
                        ];
                    }

                    // Verificar conflicto de ID EA antes de auto-asignación
                    if (empty($user->id_ea)) {
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
            }
        };

        $validatePlayers($players[$clubLocalId], $partido->local->id, $partido->local->nombre);
        $validatePlayers($players[$clubVisitanteId], $partido->visitante->id, $partido->visitante->nombre);

        if (!empty($warningPlayers) && !$request->boolean('force')) {
            return response()->json([
                'success' => false,
                'code' => 'VALIDATION_WARNING',
                'players' => $warningPlayers,
                'message' => 'Algunos jugadores no están inscritos correctamente.'
            ], 422);
        }
        // --- FIN VALIDACIÓN DE GAMERTAGS Y ID_EA ---

        $eaPlayersGlobal = collect();

        // Función anonima para procesar estadísticas individuales de jugadores
        $procesarJugadores = function (
            array $playersEA,
            int $equipoId
        ) use (
            $partido,
            &$eaPlayersGlobal
        ) {
            $eaNames = array_column($playersEA, 'playername');

            $users = User::whereIn('id_ea', $eaNames)
                ->orWhereIn('gamertag', $eaNames)
                ->get();

            foreach ($playersEA as $playerEA) {
                $playername = $playerEA['playername'];
                $eaPlayersGlobal->push($playername);

                $user = $users->first(function($u) use ($playername) {
                    return strtolower($u->id_ea) === strtolower($playername) || strtolower($u->gamertag) === strtolower($playername);
                });

                // Determinar el estado detallado de cumplimiento
                $estado = 'ok';
                $procesado = false;

                if (!$user) {
                    $estado = 'no_existe_sistema'; // Jugador jugó pero no existe en el sistema
                } else {
                    // Auto-inscribir ID EA si no lo tiene
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

                    // Verificar si está inscrito activamente en la plantilla del equipo en esta organización (se omite si es sin transferencias)
                    $isSinTransferencias = isset($partido->competencia->config['sin_transferencias']) && $partido->competencia->config['sin_transferencias'] == true;
                    $isInRoster = $isSinTransferencias || DB::table('organizacion_equipo_usuario')
                        ->where('user_id', $user->id)
                        ->where('equipo_id', $equipoId)
                        ->where('organizacion_id', $partido->competencia->temporada->organizacion_id)
                        ->where('estado_fichaje', 'activo')
                        ->exists();

                    if (!$isInRoster) {
                        $estado = 'no_inscrito_equipo'; // Existe en el sistema pero no en el roster de este equipo
                    } else {
                        $estado = 'ok';
                        $procesado = true;
                    }
                }

                // Limpiar previo log por si es reporte corregido
                EstadisticaJugadorLog::where([
                    'playername' => $playername,
                    'partido_id' => $partido->id
                ])->delete();

                EstadisticaJugadorLog::create([
                    'playername'     => $playername,
                    'partido_id'     => $partido->id,
                    'jugador_id'     => $user?->id,
                    'equipo_id'      => $equipoId,
                    'competencia_id' => $partido->competencia_id,
                    'jugo'           => true,
                    'procesado'      => $procesado,
                    'estado'         => $estado,
                ]);

                if ($user) {
                    // Borrar previo por si es reporte corregido
                    EstadisticaJugador::where([
                        'jugador_id' => $user->id,
                        'partido_id' => $partido->id
                    ])->delete();
                }

                if (!$procesado) {
                    continue;
                }

                EstadisticaJugador::create(
                    EaPlayerStatsMapper::map(
                        $user->id,
                        $playerEA,
                        $equipoId,
                        $partido->id,
                        $partido->competencia_id
                    )
                );
            }
        };

        // Procesar Local
        $result = $procesarJugadores(
            $players[$clubLocalId],
            $partido->local->id
        );
        if ($result instanceof JsonResponse) {
            return $result;
        }

        // Procesar Visitante
        $result = $procesarJugadores(
            $players[$clubVisitanteId],
            $partido->visitante->id
        );
        if ($result instanceof JsonResponse) {
            return $result;
        }

        // Registrar jugadores que NO jugaron en plantilla vinculada
        $rosterUsers = DB::table('organizacion_equipo_usuario')
            ->where('organizacion_id', $partido->competencia->temporada->organizacion_id)
            ->whereIn('equipo_id', [$partido->local->id, $partido->visitante->id])
            ->where('estado_fichaje', 'activo')
            ->pluck('user_id');

        $jugadoresEquipo = User::whereIn('id', $rosterUsers)->get();
        $eaPlayersGlobal = $eaPlayersGlobal->unique();

        // Limpiar previos logs de no_jugo/sin_gamertag por si es reporte corregido
        EstadisticaJugadorLog::where('partido_id', $partido->id)->where('jugo', false)->delete();

        foreach ($jugadoresEquipo as $jugador) {
            // Encontrar el equipo al que pertenece en la relacion pivot de organizacion_equipo_usuario
            $equipoPivot = DB::table('organizacion_equipo_usuario')
                ->where('organizacion_id', $partido->competencia->temporada->organizacion_id)
                ->where('user_id', $jugador->id)
                ->whereIn('equipo_id', [$partido->local->id, $partido->visitante->id])
                ->where('estado_fichaje', 'activo')
                ->first();

            if (!$equipoPivot) {
                continue;
            }

            // Caso A: El jugador no tiene Gamertag / ID EA registrado
            if (!$jugador->id_ea && !$jugador->gamertag) {
                EstadisticaJugadorLog::create([
                    'playername'     => null,
                    'partido_id'     => $partido->id,
                    'jugador_id'     => $jugador->id,
                    'equipo_id'      => $equipoPivot->equipo_id,
                    'competencia_id' => $partido->competencia_id,
                    'jugo'           => false,
                    'procesado'      => false,
                    'estado'         => 'sin_gamertag',
                ]);
                continue;
            }

            $idEa = $jugador->id_ea ?: $jugador->gamertag;

            // Caso B: El jugador tiene gamertag registrado pero no jugó en este partido
            if (!$eaPlayersGlobal->contains($idEa)) {
                EstadisticaJugadorLog::create([
                    'playername'     => $idEa,
                    'partido_id'     => $partido->id,
                    'jugador_id'     => $jugador->id,
                    'equipo_id'      => $equipoPivot->equipo_id,
                    'competencia_id' => $partido->competencia_id,
                    'jugo'           => false,
                    'procesado'      => false,
                    'estado'         => 'no_jugo',
                ]);
            }
        }

        // Borrar estadísticas de equipo previas por si es reporte corregido
        EstadisticaEquipo::where('partido_id', $partido->id)->delete();

        // Procesar equipo local
        $teamStatsService->procesar(
            $match['clubs'][$clubLocalId],
            $aggregate[$clubLocalId],
            $partido->local->id,
            $partido->id,
            $partido->competencia_id
        );

        // Procesar equipo visitante
        $teamStatsService->procesar(
            $match['clubs'][$clubVisitanteId],
            $aggregate[$clubVisitanteId],
            $partido->visitante->id,
            $partido->id,
            $partido->competencia_id
        );

        // Guardar goles en el partido
        $partido->goles_local = (int) $match['clubs'][$clubLocalId]['goals'];
        $partido->goles_visitante = (int) $match['clubs'][$clubVisitanteId]['goals'];
        $partido->save();

        // Invalidar caché de competencia y equipos involucrados
        \Illuminate\Support\Facades\Cache::forget('competencia_show_' . $partido->competencia_id);
        if ($partido->equipo_local_id) {
            \Illuminate\Support\Facades\Cache::forget('equipo_show_' . $partido->equipo_local_id);
        }
        if ($partido->equipo_visitante_id) {
            \Illuminate\Support\Facades\Cache::forget('equipo_show_' . $partido->equipo_visitante_id);
        }

        return response()->json([
            'success' => true,
            'message' => 'Partido EA reportado y procesado exitosamente.',
            'goles_local' => $partido->goles_local,
            'goles_visitante' => $partido->goles_visitante,
        ]);
    }

    /**
     * Enviar reporte manual por parte de un capitán.
     */
    public function submitManualReport(Request $request, Partido $partido): JsonResponse
    {
        $user = Auth::user();
        $partido->load(['local', 'visitante', 'competencia.temporada']);

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
            'player_stats'    => ['present', 'array'],
            'side'            => ['nullable', 'string', 'in:local,visitante'],
        ]);

        // Es obligatorio subir las 3 fotos para completar el reporte manual o por foto
        if (empty($data['fotos']['partido']) || empty($data['fotos']['jugadores']) || empty($data['fotos']['conectados'])) {
            return response()->json(['message' => 'Es obligatorio subir las 3 fotos (Estadísticas del partido, Estadísticas del jugador, y Jugadores conectados) para completar el reporte.'], 422);
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
     * Confirmar y consolidar reporte manual por parte de un organizador.
     */
    public function confirmManualReport(Request $request, Partido $partido): JsonResponse
    {
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
            'local_stats.player_stats' => ['present', 'array'],
            'visitante_stats' => ['required', 'array'],
            'visitante_stats.team_stats' => ['required', 'array'],
            'visitante_stats.player_stats' => ['present', 'array'],
        ]);

        $partido->load(['local', 'visitante', 'competencia.temporada']);
        $statsDisabled = isset($partido->competencia->config['sin_transferencias']) && $partido->competencia->config['sin_transferencias'] == true;

        // Validar coherencia de estadísticas de plantilla Local en backend (solo si se proveen jugadores y no están deshabilitadas)
        if (!$statsDisabled && count($data['local_stats']['player_stats']) > 0) {
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
        }

        // Validar coherencia de estadísticas de plantilla Visitante en backend (solo si se proveen jugadores y no están deshabilitadas)
        if (!$statsDisabled && count($data['visitante_stats']['player_stats']) > 0) {
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
        }

        DB::transaction(function() use ($partido, $data, $statsDisabled) {
            // 1. Eliminar estadísticas previas
            EstadisticaEquipo::where('partido_id', $partido->id)->delete();
            EstadisticaJugador::where('partido_id', $partido->id)->delete();
            EstadisticaJugadorLog::where('partido_id', $partido->id)->delete();

            // 2. Procesar Equipo Local
            $localTeamStats = $data['local_stats']['team_stats'];
            $localPlayerStats = $statsDisabled ? [] : $data['local_stats']['player_stats'];
            
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

            EstadisticaEquipo::create([
                'equipo_id' => $partido->equipo_local_id,
                'partido_id' => $partido->id,
                'competencia_id' => $partido->competencia_id,
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
                'atajadas' => (int)($localTeamStats['atajadas'] ?? 0),
                'valla_invicta_global' => (int)($localTeamStats['goles_en_contra'] ?? 0) === 0 ? 1 : 0,
                'valoracion_agregada' => $avgRatingLocal,
                'procesado' => true
            ]);

            // 3. Procesar Equipo Visitante
            $visitTeamStats = $data['visitante_stats']['team_stats'];
            $visitPlayerStats = $statsDisabled ? [] : $data['visitante_stats']['player_stats'];
            
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

            EstadisticaEquipo::create([
                'equipo_id' => $partido->equipo_visitante_id,
                'partido_id' => $partido->id,
                'competencia_id' => $partido->competencia_id,
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
                'atajadas' => (int)($visitTeamStats['atajadas'] ?? 0),
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
                    EstadisticaJugador::create([
                        'jugador_id' => $user->id,
                        'equipo_id' => $partido->equipo_local_id,
                        'partido_id' => $partido->id,
                        'competencia_id' => $partido->competencia_id,
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

                    EstadisticaJugadorLog::create([
                        'playername' => $user->gamertag ?: $user->name,
                        'partido_id' => $partido->id,
                        'jugador_id' => $user->id,
                        'equipo_id' => $partido->equipo_local_id,
                        'competencia_id' => $partido->competencia_id,
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
                    EstadisticaJugador::create([
                        'jugador_id' => $user->id,
                        'equipo_id' => $partido->equipo_visitante_id,
                        'partido_id' => $partido->id,
                        'competencia_id' => $partido->competencia_id,
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

                    EstadisticaJugadorLog::create([
                        'playername' => $user->gamertag ?: $user->name,
                        'partido_id' => $partido->id,
                        'jugador_id' => $user->id,
                        'equipo_id' => $partido->equipo_visitante_id,
                        'competencia_id' => $partido->competencia_id,
                        'jugo' => true,
                        'procesado' => true,
                        'estado' => 'ok'
                    ]);
                }
            }

            // 6. Roster Logs para los que no jugaron (solo si hay estadísticas de jugadores registradas)
            if (count($localPlayerStats) > 0 || count($visitPlayerStats) > 0) {
                $rosterUsers = DB::table('organizacion_equipo_usuario')
                    ->where('organizacion_id', $partido->competencia->temporada->organizacion_id)
                    ->whereIn('equipo_id', [$partido->equipo_local_id, $partido->equipo_visitante_id])
                    ->where('estado_fichaje', 'activo')
                    ->pluck('user_id');

                $jugadoresEquipo = User::whereIn('id', $rosterUsers)->get();
                foreach ($jugadoresEquipo as $jugador) {
                    if (!in_array($jugador->id, $jugadoresJugoIds)) {
                        $eqPivot = DB::table('organizacion_equipo_usuario')
                            ->where('organizacion_id', $partido->competencia->temporada->organizacion_id)
                            ->where('user_id', $jugador->id)
                            ->where('estado_fichaje', 'activo')
                            ->first();

                        if ($eqPivot) {
                            EstadisticaJugadorLog::create([
                                'playername' => $jugador->gamertag ?: $jugador->name,
                                'partido_id' => $partido->id,
                                'jugador_id' => $jugador->id,
                                'equipo_id' => $eqPivot->equipo_id,
                                'competencia_id' => $partido->competencia_id,
                                'jugo' => false,
                                'procesado' => false,
                                'estado' => 'no_jugo'
                            ]);
                        }
                    }
                }
            }

            // 6.5 Borrar fotos asociadas a los reportes de capitanes
            if ($partido->reporte_local_stats && isset($partido->reporte_local_stats['fotos'])) {
                $localStats = $partido->reporte_local_stats;
                foreach ($localStats['fotos'] as $key => $path) {
                    if ($path) {
                        $fullPath = public_path(ltrim($path, '/'));
                        if (file_exists($fullPath) && is_file($fullPath)) {
                            @unlink($fullPath);
                        }
                    }
                }
                $localStats['fotos'] = [
                    'partido' => null,
                    'jugadores' => null,
                    'conectados' => null
                ];
                $partido->reporte_local_stats = $localStats;
            }

            if ($partido->reporte_visitante_stats && isset($partido->reporte_visitante_stats['fotos'])) {
                $visitStats = $partido->reporte_visitante_stats;
                foreach ($visitStats['fotos'] as $key => $path) {
                    if ($path) {
                        $fullPath = public_path(ltrim($path, '/'));
                        if (file_exists($fullPath) && is_file($fullPath)) {
                            @unlink($fullPath);
                        }
                    }
                }
                $visitStats['fotos'] = [
                    'partido' => null,
                    'jugadores' => null,
                    'conectados' => null
                ];
                $partido->reporte_visitante_stats = $visitStats;
            }

            // 7. Actualizar el partido
            $partido->goles_local = $data['goles_local'];
            $partido->goles_visitante = $data['goles_visitante'];
            $partido->reporte_confirmado = true;
            $partido->reporte_local_completado = true;
            $partido->reporte_visitante_completado = true;
            $partido->save();
        });

        // Invalidar caché
        \Illuminate\Support\Facades\Cache::forget('competencia_show_' . $partido->competencia_id);
        if ($partido->equipo_local_id) {
            \Illuminate\Support\Facades\Cache::forget('equipo_show_' . $partido->equipo_local_id);
        }
        if ($partido->equipo_visitante_id) {
            \Illuminate\Support\Facades\Cache::forget('equipo_show_' . $partido->equipo_visitante_id);
        }

        return response()->json([
            'success' => true,
            'message' => 'Partido confirmado y estadísticas unificadas guardadas exitosamente.'
        ]);
    }
}

