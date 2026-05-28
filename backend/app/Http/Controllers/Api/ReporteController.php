<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Partido;
use App\Models\EstadisticaJugador;
use App\Models\EstadisticaJugadorLog;
use App\Models\User;
use App\Services\EaProClubsService;
use App\Services\EaPlayerStatsMapper;
use App\Services\EaTeamStatsService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

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

                EstadisticaJugadorLog::firstOrCreate(
                    [
                        'playername'    => $playername,
                        'partido_id'    => $partido->id,
                    ],
                    [
                        'jugador_id'     => $user?->id,
                        'equipo_id'      => $equipoId,
                        'competencia_id' => $partido->competencia_id,
                        'jugo'           => true,
                        'procesado'      => (bool) $user,
                        'estado'         => $user ? 'ok' : 'error',
                    ]
                );

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
        $jugadoresEquipo = User::whereHas('equipos', function ($q) use ($partido) {
            $q->whereIn('equipo_id', [
                $partido->local->id,
                $partido->visitante->id,
            ]);
        })->get();

        $eaPlayersGlobal = $eaPlayersGlobal->unique();

        foreach ($jugadoresEquipo as $jugador) {
            if (!$jugador->id_ea || $eaPlayersGlobal->contains($jugador->id_ea)) {
                continue;
            }

            // Encontrar el equipo al que pertenece en la relacion pivot de organizacion_equipo_usuario
            $equipoPivot = $jugador->equipos()->whereIn('equipo_id', [
                $partido->local->id,
                $partido->visitante->id,
            ])->first();

            if ($equipoPivot) {
                EstadisticaJugadorLog::firstOrCreate(
                    [
                        'playername'    => null, // no jugó
                        'partido_id'    => $partido->id,
                        'jugador_id'    => $jugador->id,
                    ],
                    [
                        'equipo_id'      => $equipoPivot->id,
                        'competencia_id' => $partido->competencia_id,
                        'jugo'           => false,
                        'procesado'      => false,
                        'estado'         => 'no_jugo',
                    ]
                );
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
