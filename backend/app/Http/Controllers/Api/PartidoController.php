<?php

namespace App\Http\Controllers\Api;

use App\Models\Partido;
use App\Models\Competencia;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;

class PartidoController extends Controller
{
    /**
     * Listar partidos con soporte de filtros: competencia_id, organizacion_id.
     * Incluye la cadena competencia→temporada→organizacion para que el front
     * pueda construir los filtros sin llamadas extra.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Partido::with([
            'local:id,nombre,logo,abreviatura,club_id_ea',
            'visitante:id,nombre,logo,abreviatura,club_id_ea',
            'competencia.temporada.organizacion:id,nombre,logo',
        ]);

        $user = auth('sanctum')->user();
        if ($request->boolean('for_organizer') && $user) {
            $organizacion = \App\Models\Organizacion::where('owner_id', $user->id)->first();
            if ($organizacion) {
                $query->whereHas('competencia.temporada', function ($q) use ($organizacion) {
                    $q->where('organizacion_id', $organizacion->id);
                });
            } else {
                $role = $user->role;
                if ($role !== 'admin' && $role !== 'administrador') {
                    return response()->json([]);
                }
            }
        }

        if ($request->filled('competencia_id')) {
            $query->where('competencia_id', $request->competencia_id);
        }

        if ($request->filled('organizacion_id')) {
            $query->whereHas('competencia.temporada', function ($q) use ($request) {
                $q->where('organizacion_id', $request->organizacion_id);
            });
        }

        if ($request->filled('equipo_id')) {
            $query->where(function ($q) use ($request) {
                $q->where('equipo_local_id', $request->equipo_id)
                  ->orWhere('equipo_visitante_id', $request->equipo_id);
            });
        }

        // --- OPTIMIZATION FILTERS ---
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

        // Limit results if loading all upcoming or finished to prevent huge payload (maximum 100)
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

    /**
     * Retornar el listado de fechas con partidos programados que cumplen con los filtros.
     */
    public function dates(Request $request): JsonResponse
    {
        $query = Partido::select('fecha', \DB::raw('count(*) as count'))
            ->groupBy('fecha');

        $user = auth('sanctum')->user();
        if ($request->boolean('for_organizer') && $user) {
            $organizacion = \App\Models\Organizacion::where('owner_id', $user->id)->first();
            if ($organizacion) {
                $query->whereHas('competencia.temporada', function ($q) use ($organizacion) {
                    $q->where('organizacion_id', $organizacion->id);
                });
            } else {
                $role = $user->role;
                if ($role !== 'admin' && $role !== 'administrador') {
                    return response()->json([]);
                }
            }
        }

        if ($request->filled('organizacion_id')) {
            $query->whereHas('competencia.temporada', function ($q) use ($request) {
                $q->where('organizacion_id', $request->organizacion_id);
            });
        }

        if ($request->filled('competencia_id')) {
            $query->where('competencia_id', $request->competencia_id);
        }

        if ($request->filled('equipo_id')) {
            $query->where(function ($q) use ($request) {
                $q->where('equipo_local_id', $request->equipo_id)
                  ->orWhere('equipo_visitante_id', $request->equipo_id);
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

    /**
     * Guardar o actualizar de forma masiva los partidos oficiales desde el Matchmaker.
     */
    public function bulkStore(Request $request, Competencia $competencia): JsonResponse
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
        Partido::where('competencia_id', $competencia->id)->delete();

        $saved = [];
        foreach ($request->input('partidos') as $pData) {
            // Ignorar descansos "BYE"
            if ($pData['local']['id'] === 'bye' || $pData['visitante']['id'] === 'bye') {
                continue;
            }

            $localId = is_numeric($pData['local']['id']) ? $pData['local']['id'] : null;
            $visitanteId = is_numeric($pData['visitante']['id']) ? $pData['visitante']['id'] : null;

            $partido = Partido::create([
                'competencia_id' => $competencia->id,
                'equipo_local_id' => $localId,
                'equipo_visitante_id' => $visitanteId,
                'jornada' => $pData['jornada'],
                'grupo' => $pData['grupo'] ?? null,
                'fecha' => $pData['fecha'] ?? null,
                'hora' => $pData['hora'] ?? null,
                'goles_local' => isset($pData['score_local']) ? $pData['score_local'] : null,
                'goles_visitante' => isset($pData['score_visitante']) ? $pData['score_visitante'] : null,
                'stats' => $pData['stats'] ?? null,
            ]);
            $saved[] = $partido;
        }

        return response()->json([
            'message' => 'Fixture persistido exitosamente en la base de datos.',
            'count' => count($saved)
        ]);
    }

    /**
     * Actualizar una ficha/marcador particular.
     */
    public function update(Request $request, Partido $partido): JsonResponse
    {
        $user = auth()->user();
        $partido->load(['local', 'visitante']);

        $isOrganizerOrAdmin = in_array($user->role, ['administrador', 'organizador']);
        $isHomeCaptain = $partido->local && $partido->local->id_capitan == $user->id;
        $isAwayCaptain = $partido->visitante && $partido->visitante->id_capitan == $user->id;

        if (!$isOrganizerOrAdmin && !$isHomeCaptain && !$isAwayCaptain) {
            return response()->json(['message' => 'No tienes permiso para actualizar este partido.'], 403);
        }

        if (!$isOrganizerOrAdmin && $partido->goles_local !== null && $partido->goles_visitante !== null) {
            return response()->json(['message' => 'Este partido ya ha sido reportado y cerrado por el capitán correspondiente.'], 422);
        }

        $partido->update($request->only([
            'goles_local',
            'goles_visitante',
            'fecha',
            'hora',
            'stats'
        ]));

        // Invalidar caché de competencia y equipos involucrados
        \Illuminate\Support\Facades\Cache::forget('competencia_show_' . $partido->competencia_id);
        if ($partido->equipo_local_id) {
            \Illuminate\Support\Facades\Cache::forget('equipo_show_' . $partido->equipo_local_id);
        }
        if ($partido->equipo_visitante_id) {
            \Illuminate\Support\Facades\Cache::forget('equipo_show_' . $partido->equipo_visitante_id);
        }

        return response()->json([
            'message' => 'Partido actualizado con éxito.',
            'partido' => $partido
        ]);
    }

    /**
     * Mostrar detalles de un partido, sus estadísticas de equipo e individuales.
     */
    public function show($id): JsonResponse
    {
        $partido = Partido::with([
            'local:id,nombre,logo,abreviatura,id_capitan,club_id_ea',
            'visitante:id,nombre,logo,abreviatura,id_capitan,club_id_ea',
            'competencia.temporada.organizacion'
        ])->findOrFail($id);

        $statsEquipos = \App\Models\EstadisticaEquipo::where('partido_id', $partido->id)->get();

        $statsJugadores = \App\Models\EstadisticaJugador::with('jugador:id,name,foto,gamertag')
            ->where('partido_id', $partido->id)
            ->get();

        $statsLogs = \App\Models\EstadisticaJugadorLog::with([
            'jugador:id,name,foto,gamertag',
            'equipo:id,nombre,logo,abreviatura'
        ])
        ->where('partido_id', $partido->id)
        ->get();

        return response()->json([
            'partido' => $partido,
            'stats_equipos' => $statsEquipos,
            'stats_jugadores' => $statsJugadores,
            'stats_logs' => $statsLogs
        ]);
    }

    /**
     * Contar partidos por estado y fecha con soporte de filtros.
     */
    public function counts(Request $request): JsonResponse
    {
        $today = $request->input('today', date('Y-m-d'));
        
        $queryBase = Partido::query();

        $user = auth('sanctum')->user();
        if ($request->boolean('for_organizer') && $user) {
            $organizacion = \App\Models\Organizacion::where('owner_id', $user->id)->first();
            if ($organizacion) {
                $queryBase->whereHas('competencia.temporada', function ($q) use ($organizacion) {
                    $q->where('organizacion_id', $organizacion->id);
                });
            } else {
                $role = $user->role;
                if ($role !== 'admin' && $role !== 'administrador') {
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

        if ($request->filled('competencia_id')) {
            $queryBase->where('competencia_id', $request->competencia_id);
        }

        if ($request->filled('equipo_id')) {
            $queryBase->where(function ($q) use ($request) {
                $q->where('equipo_local_id', $request->equipo_id)
                  ->orWhere('equipo_visitante_id', $request->equipo_id);
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
}
