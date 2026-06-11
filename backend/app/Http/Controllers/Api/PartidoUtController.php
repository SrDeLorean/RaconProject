<?php

namespace App\Http\Controllers\Api;

use App\Models\PartidoUt;
use App\Models\CompetenciaUt;
use App\Models\Organizacion;
use App\Models\EstadisticaEquipoUt;
use App\Models\EstadisticaJugadorUt;
use App\Models\EstadisticaJugadorUtLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class PartidoUtController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = PartidoUt::select([
            'id',
            'competencia_ut_id',
            'equipo_ut_local_id',
            'equipo_ut_visitante_id',
            'jornada',
            'grupo',
            'fecha',
            'hora',
            'goles_local',
            'goles_visitante'
        ])->with([
            'local:id,nombre,logo,club_id_ea,id_capitan,id_companero',
            'local.capitan:id,name,gamertag',
            'local.companero:id,name,gamertag',
            'visitante:id,nombre,logo,club_id_ea,id_capitan,id_companero',
            'visitante.capitan:id,name,gamertag',
            'visitante.companero:id,name,gamertag',
            'competencia.temporada.organizacion:id,nombre,logo',
        ]);

        // Guard limit to prevent memory exhausted / timeout errors if no filters are applied
        $hasFilters = $request->filled('fecha') ||
                      $request->filled('status') ||
                      $request->filled('competencia_ut_id') ||
                      $request->filled('organizacion_id') ||
                      $request->filled('equipo_ut_id') ||
                      $request->filled('jugador_id') ||
                      $request->filled('search') ||
                      $request->boolean('for_organizer') ||
                      $request->has('page') ||
                      $request->boolean('paginate') ||
                      $request->boolean('paginate_by_time') ||
                      $request->get('paginate') === 'time';

        if (!$hasFilters) {
            $query->limit(500);
        }

        $user = auth('sanctum')->user();
        if ($request->boolean('for_organizer') && $user) {
            $organizacion = Organizacion::where('owner_id', $user->id)->first();
            if ($organizacion) {
                $query->whereHas('competencia.temporada', function ($q) use ($organizacion) {
                    $q->where('organizacion_id', $organizacion->id);
                });
            } else {
                if ($user->role !== 'administrador') {
                    return response()->json([]);
                }
            }
        }

        if ($request->filled('competencia_ut_id')) {
            $query->where('competencia_ut_id', $request->competencia_ut_id);
        }

        if ($request->filled('organizacion_id')) {
            $query->whereHas('competencia.temporada', function ($q) use ($request) {
                $q->where('organizacion_id', $request->organizacion_id);
            });
        }

        if ($request->filled('equipo_ut_id')) {
            $query->where(function ($q) use ($request) {
                $q->where('equipo_ut_local_id', $request->equipo_ut_id)
                  ->orWhere('equipo_ut_visitante_id', $request->equipo_ut_id);
            });
        }

        if ($request->filled('jugador_id')) {
            $jugadorId = $request->jugador_id;
            $query->where(function ($q) use ($jugadorId) {
                $q->whereHas('local', function ($sq) use ($jugadorId) {
                    $sq->where('id_capitan', $jugadorId)
                      ->orWhere('id_companero', $jugadorId);
                })->orWhereHas('visitante', function ($sq) use ($jugadorId) {
                    $sq->where('id_capitan', $jugadorId)
                      ->orWhere('id_companero', $jugadorId);
                });
            });
        }

        if ($request->filled('fecha')) {
            $query->where('fecha', $request->fecha);
        }

        if ($request->filled('status')) {
            $today = $request->input('today', date('Y-m-d'));
            if ($request->status === 'live') {
                $query->where('fecha', $today);
            } elseif ($request->status === 'finished') {
                $query->whereNotNull('goles_local')
                      ->whereNotNull('goles_visitante');
            } elseif ($request->status === 'upcoming') {
                $query->whereNull('goles_local')
                      ->whereNull('goles_visitante')
                      ->where('fecha', '!=', $today);
            } elseif ($request->status === 'pending_report') {
                $query->whereNull('goles_local')
                      ->whereNull('goles_visitante')
                      ->where('fecha', '<', $today);
            }
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereHas('local', function($sq) use ($search) {
                    $sq->where('nombre', 'like', "%{$search}%");
                })->orWhereHas('visitante', function($sq) use ($search) {
                    $sq->where('nombre', 'like', "%{$search}%");
                })->orWhereHas('competencia', function($sq) use ($search) {
                    $sq->where('nombre', 'like', "%{$search}%");
                });
            });
        }

        if (!$request->has('page') && !$request->boolean('paginate') && !$request->filled('fecha') && ($request->status === 'finished' || $request->status === 'upcoming')) {
            $query->limit(100);
        }

        if ($request->boolean('paginate_by_time') || $request->get('paginate') === 'time') {
            $uniqueHoursQuery = (clone $query)->select('hora')
                ->whereNotNull('hora')
                ->where('hora', '!=', '')
                ->groupBy('hora')
                ->orderBy('hora');

            $uniqueHours = $uniqueHoursQuery->pluck('hora')->toArray();
            $totalHours = count($uniqueHours);
            
            $perPage = (int)$request->get('per_page', 1);
            $page = (int)$request->get('page', 1);
            
            $offset = ($page - 1) * $perPage;
            $selectedHours = array_slice($uniqueHours, $offset, $perPage);
            
            if (!empty($selectedHours)) {
                $query->whereIn('hora', $selectedHours);
            } else {
                $query->whereRaw('1 = 0');
            }
            
            $partidos = $query->orderBy('fecha')->orderBy('hora')->get();
            
            return response()->json([
                'data' => $partidos,
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $totalHours,
                'last_page' => (int)ceil($totalHours / $perPage),
                'selected_hours' => $selectedHours,
                'all_hours' => $uniqueHours,
            ]);
        }

        if ($request->has('page') || $request->boolean('paginate')) {
            $perPage = $request->get('per_page', 10);
            return response()->json($query->orderBy('fecha')->orderBy('hora')->paginate($perPage));
        }

        return response()->json($query->orderBy('fecha')->orderBy('hora')->get());
    }

    public function dates(Request $request): JsonResponse
    {
        $query = PartidoUt::select('fecha', DB::raw('count(*) as count'))
            ->groupBy('fecha');

        $user = auth('sanctum')->user();
        if ($request->boolean('for_organizer') && $user) {
            $organizacion = Organizacion::where('owner_id', $user->id)->first();
            if ($organizacion) {
                $query->whereHas('competencia.temporada', function ($q) use ($organizacion) {
                    $q->where('organizacion_id', $organizacion->id);
                });
            } else {
                if ($user->role !== 'administrador') {
                    return response()->json([]);
                }
            }
        }

        if ($request->filled('organizacion_id')) {
            $query->whereHas('competencia.temporada', function ($q) use ($request) {
                $q->where('organizacion_id', $request->organizacion_id);
            });
        }

        if ($request->filled('competencia_ut_id')) {
            $query->where('competencia_ut_id', $request->competencia_ut_id);
        }

        if ($request->filled('equipo_ut_id')) {
            $query->where(function ($q) use ($request) {
                $q->where('equipo_ut_local_id', $request->equipo_ut_id)
                  ->orWhere('equipo_ut_visitante_id', $request->equipo_ut_id);
            });
        }

        if ($request->filled('jugador_id')) {
            $jugadorId = $request->jugador_id;
            $query->where(function ($q) use ($jugadorId) {
                $q->whereHas('local', function ($sq) use ($jugadorId) {
                    $sq->where('id_capitan', $jugadorId)
                      ->orWhere('id_companero', $jugadorId);
                })->orWhereHas('visitante', function ($sq) use ($jugadorId) {
                    $sq->where('id_capitan', $jugadorId)
                      ->orWhere('id_companero', $jugadorId);
                });
            });
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereHas('local', function($sq) use ($search) {
                    $sq->where('nombre', 'like', "%{$search}%");
                })->orWhereHas('visitante', function($sq) use ($search) {
                    $sq->where('nombre', 'like', "%{$search}%");
                })->orWhereHas('competencia', function($sq) use ($search) {
                    $sq->where('nombre', 'like', "%{$search}%");
                });
            });
        }

        $dates = $query->whereNotNull('fecha')
            ->orderBy('fecha')
            ->get();

        return response()->json($dates);
    }

    public function bulkStore(Request $request, CompetenciaUt $competenciaUt): JsonResponse
    {
        $request->validate([
            'partidos' => 'required|array',
            'partidos.*.jornada' => 'required|string',
            'partidos.*.fecha' => 'nullable|string',
            'partidos.*.hora' => 'nullable|string',
            'partidos.*.local.id' => 'required',
            'partidos.*.visitante.id' => 'required',
        ]);

        // Limpiar partidos previos para regenerar
        PartidoUt::where('competencia_ut_id', $competenciaUt->id)->delete();

        $saved = [];
        foreach ($request->input('partidos') as $pData) {
            // Ignorar descansos "BYE"
            if ($pData['local']['id'] === 'bye' || $pData['visitante']['id'] === 'bye') {
                continue;
            }

            $localId = is_numeric($pData['local']['id']) ? $pData['local']['id'] : null;
            $visitanteId = is_numeric($pData['visitante']['id']) ? $pData['visitante']['id'] : null;

            $partido = PartidoUt::create([
                'competencia_ut_id' => $competenciaUt->id,
                'equipo_ut_local_id' => $localId,
                'equipo_ut_visitante_id' => $visitanteId,
                'jornada' => $pData['jornada'],
                'grupo' => $pData['grupo'] ?? null,
                'fecha' => $pData['fecha'] ?? null,
                'hora' => $pData['hora'] ?? null,
                'goles_local' => isset($pData['score_local']) ? $pData['score_local'] : null,
                'goles_visitante' => isset($pData['score_visitante']) ? $pData['score_visitante'] : null,
                'stats' => $pData['stats'] ?? null,
            ]);
            $this->syncManualStats($partido);
            $saved[] = $partido;
        }

        Cache::forget('competencia_ut_show_' . $competenciaUt->id);

        return response()->json([
            'message' => 'Fixture persistido exitosamente en la base de datos.',
            'count' => count($saved)
        ]);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $partido = PartidoUt::findOrFail($id);
        $user = auth()->user();
        $partido->load(['local', 'visitante']);

        $isOrganizerOrAdmin = in_array($user->role, ['administrador', 'organizador']);
        $isHomeCaptain = $partido->local && $partido->local->id_capitan == $user->id;
        $isAwayCaptain = $partido->visitante && $partido->visitante->id_capitan == $user->id;

        if (!$isOrganizerOrAdmin && !$isHomeCaptain && !$isAwayCaptain) {
            return response()->json(['message' => 'No tienes permiso para actualizar este partido.'], 403);
        }

        if (!$isOrganizerOrAdmin && $partido->goles_local !== null && $partido->goles_visitante !== null) {
            return response()->json(['message' => 'Este partido ya ha sido reportado y cerrado.'], 422);
        }

        $partido->update($request->only([
            'goles_local',
            'goles_visitante',
            'fecha',
            'hora',
            'stats'
        ]));

        $this->syncManualStats($partido);

        // Invalidar caché de competencia y equipos involucrados
        Cache::forget('competencia_ut_show_' . $partido->competencia_ut_id);

        return response()->json([
            'message' => 'Partido actualizado con éxito.',
            'partido' => $partido
        ]);
    }

    public function show($id): JsonResponse
    {
        $partido = PartidoUt::with([
            'local:id,nombre,logo,id_capitan,id_companero,club_id_ea',
            'local.capitan:id,name,gamertag',
            'local.companero:id,name,gamertag',
            'visitante:id,nombre,logo,id_capitan,id_companero,club_id_ea',
            'visitante.capitan:id,name,gamertag',
            'visitante.companero:id,name,gamertag',
            'competencia.temporada.organizacion'
        ])->findOrFail($id);

        $statsEquipos = EstadisticaEquipoUt::where('partido_ut_id', $partido->id)->get();

        $statsJugadores = EstadisticaJugadorUt::with('jugador:id,name,foto,gamertag')
            ->where('partido_ut_id', $partido->id)
            ->get();

        $statsLogs = EstadisticaJugadorUtLog::with([
            'jugador:id,name,foto,gamertag',
            'equipo:id,nombre,logo'
        ])
        ->where('partido_ut_id', $partido->id)
        ->get();

        return response()->json([
            'partido' => $partido,
            'stats_equipos' => $statsEquipos,
            'stats_jugadores' => $statsJugadores,
            'stats_logs' => $statsLogs
        ]);
    }

    public function counts(Request $request): JsonResponse
    {
        $today = $request->input('today', date('Y-m-d'));
        $queryBase = PartidoUt::query();

        $user = auth('sanctum')->user();
        if ($request->boolean('for_organizer') && $user) {
            $organizacion = Organizacion::where('owner_id', $user->id)->first();
            if ($organizacion) {
                $queryBase->whereHas('competencia.temporada', function ($q) use ($organizacion) {
                    $q->where('organizacion_id', $organizacion->id);
                });
            } else {
                if ($user->role !== 'administrador') {
                    return response()->json([
                        'all' => 0,
                        'live' => 0,
                        'finished' => 0,
                        'upcoming' => 0,
                        'pending_report' => 0
                    ]);
                }
            }
        }

        if ($request->filled('organizacion_id')) {
            $queryBase->whereHas('competencia.temporada', function ($q) use ($request) {
                $q->where('organizacion_id', $request->organizacion_id);
            });
        }

        if ($request->filled('competencia_ut_id')) {
            $queryBase->where('competencia_ut_id', $request->competencia_ut_id);
        }

        if ($request->filled('equipo_ut_id')) {
            $queryBase->where(function ($q) use ($request) {
                $q->where('equipo_ut_local_id', $request->equipo_ut_id)
                  ->orWhere('equipo_ut_visitante_id', $request->equipo_ut_id);
            });
        }

        if ($request->filled('jugador_id')) {
            $jugadorId = $request->jugador_id;
            $queryBase->where(function ($q) use ($jugadorId) {
                $q->whereHas('local', function ($sq) use ($jugadorId) {
                    $sq->where('id_capitan', $jugadorId)
                      ->orWhere('id_companero', $jugadorId);
                })->orWhereHas('visitante', function ($sq) use ($jugadorId) {
                    $sq->where('id_capitan', $jugadorId)
                      ->orWhere('id_companero', $jugadorId);
                });
            });
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $queryBase->where(function($q) use ($search) {
                $q->whereHas('local', function($sq) use ($search) {
                    $sq->where('nombre', 'like', "%{$search}%");
                })->orWhereHas('visitante', function($sq) use ($search) {
                    $sq->where('nombre', 'like', "%{$search}%");
                })->orWhereHas('competencia', function($sq) use ($search) {
                    $sq->where('nombre', 'like', "%{$search}%");
                });
            });
        }

        $all = (clone $queryBase)->where('fecha', $request->input('fecha'))->count();
        $live = (clone $queryBase)->where('fecha', $today)->count();
        $finished = (clone $queryBase)->whereNotNull('goles_local')->whereNotNull('goles_visitante')->count();
        $upcoming = (clone $queryBase)->whereNull('goles_local')->whereNull('goles_visitante')->where('fecha', '!=', $today)->count();
        $pending_report = (clone $queryBase)->whereNull('goles_local')->whereNull('goles_visitante')->where('fecha', '<', $today)->count();

        return response()->json([
            'all' => $all,
            'live' => $live,
            'finished' => $finished,
            'upcoming' => $upcoming,
            'pending_report' => $pending_report
        ]);
    }

    private function syncManualStats(PartidoUt $partido)
    {
        $stats = $partido->stats;
        if (is_string($stats)) {
            $stats = json_decode($stats, true);
        }

        if (!$stats || !isset($stats['players'])) {
            return;
        }

        // Limpiar estadísticas anteriores para este partido
        EstadisticaJugadorUt::where('partido_ut_id', $partido->id)->delete();
        EstadisticaEquipoUt::where('partido_ut_id', $partido->id)->delete();

        // 1. Guardar estadísticas de jugadores
        foreach ($stats['players'] as $pData) {
            $jugadorId = $pData['id'] ?? null;
            if (!$jugadorId) continue;

            $partido->load(['local', 'visitante']);

            $equipoId = null;
            if ($partido->local && ($partido->local->id_capitan == $jugadorId || $partido->local->id_companero == $jugadorId)) {
                $equipoId = $partido->local->id;
            } elseif ($partido->visitante && ($partido->visitante->id_capitan == $jugadorId || $partido->visitante->id_companero == $jugadorId)) {
                $equipoId = $partido->visitante->id;
            }

            if (!$equipoId) continue;

            EstadisticaJugadorUt::create([
                'jugador_id' => $jugadorId,
                'equipo_ut_id' => $equipoId,
                'partido_ut_id' => $partido->id,
                'competencia_ut_id' => $partido->competencia_ut_id,
                'posicion' => $pData['posicion'] ?? 'DEL',
                'valoracion' => $pData['valoracion'] ?? 6.00,
                'goles' => $pData['goals'] ?? 0,
                'asistencias' => $pData['assists'] ?? 0,
                'tiros' => $pData['shots'] ?? 0,
                'tarjetas_rojas' => ($pData['redCard'] ?? false) ? 1 : 0,
                'jugador_partido' => false,
                'pases_intentados' => 0,
                'pases_completados' => 0,
                'precision_pases' => 0,
                'entradas_intentadas' => 0,
                'entradas_exitosas' => 0,
                'tasa_exito_entradas' => 0,
                'segundos_jugados' => 5400
            ]);
        }

        // 2. Guardar estadísticas de equipos
        if ($partido->equipo_ut_local_id || $partido->equipo_ut_visitante_id) {
            $localId = $partido->equipo_ut_local_id;
            $visitanteId = $partido->equipo_ut_visitante_id;

            if ($localId) {
                EstadisticaEquipoUt::create([
                    'equipo_ut_id' => $localId,
                    'partido_ut_id' => $partido->id,
                    'competencia_ut_id' => $partido->competencia_ut_id,
                    'goles_favor' => $partido->goles_local ?? 0,
                    'goles_en_contra' => $partido->goles_visitante ?? 0,
                    'asistencias' => 0,
                    'tiros' => 0,
                    'pases_intentados' => 0,
                    'pases_completados' => 0,
                    'precision_pases' => 0,
                    'entradas_intentadas' => 0,
                    'entradas_exitosas' => 0,
                    'tasa_exito_entradas' => 0,
                    'tarjetas_rojas' => 0,
                    'valla_invicta_global' => ($partido->goles_visitante == 0),
                    'valoracion_agregada' => 6.0,
                    'segundos_jugados_agregado' => 5400,
                    'tiempo_juego_motor' => 90,
                    'procesado' => true
                ]);
            }

            if ($visitanteId) {
                EstadisticaEquipoUt::create([
                    'equipo_ut_id' => $visitanteId,
                    'partido_ut_id' => $partido->id,
                    'competencia_ut_id' => $partido->competencia_ut_id,
                    'goles_favor' => $partido->goles_visitante ?? 0,
                    'goles_en_contra' => $partido->goles_local ?? 0,
                    'asistencias' => 0,
                    'tiros' => 0,
                    'pases_intentados' => 0,
                    'pases_completados' => 0,
                    'precision_pases' => 0,
                    'entradas_intentadas' => 0,
                    'entradas_exitosas' => 0,
                    'tasa_exito_entradas' => 0,
                    'tarjetas_rojas' => 0,
                    'valla_invicta_global' => ($partido->goles_local == 0),
                    'valoracion_agregada' => 6.0,
                    'segundos_jugados_agregado' => 5400,
                    'tiempo_juego_motor' => 90,
                    'procesado' => true
                ]);
            }
        }
    }
}
