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
        $partido->load(['local', 'visitante']);

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
                ->get()
                ->keyBy('id_ea');

            foreach ($playersEA as $playerEA) {
                $playername = $playerEA['playername'];
                $eaPlayersGlobal->push($playername);

                $user = $users[$playername] ?? null;

                // Determinar el estado detallado de cumplimiento
                $estado = 'ok';
                $procesado = false;

                if (!$user) {
                    $estado = 'no_existe_sistema'; // Jugador jugó pero no existe en el sistema
                } else {
                    // Verificar si está inscrito activamente en la plantilla del equipo en esta organización
                    $isInRoster = DB::table('organizacion_equipo_usuario')
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

                if (!$user) {
                    continue;
                }

                // Borrar previo por si es reporte corregido
                EstadisticaJugador::where([
                    'jugador_id' => $user->id,
                    'partido_id' => $partido->id
                ])->delete();

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
        $procesarJugadores(
            $players[$clubLocalId],
            $partido->local->id
        );

        // Procesar Visitante
        $procesarJugadores(
            $players[$clubVisitanteId],
            $partido->visitante->id
        );

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

        return response()->json([
            'success' => true,
            'message' => 'Partido EA reportado y procesado exitosamente.',
            'goles_local' => $partido->goles_local,
            'goles_visitante' => $partido->goles_visitante,
        ]);
    }
}
