<?php

namespace App\Http\Controllers\Api;

use App\Models\Equipo;
use Illuminate\Http\Request;
use App\Http\Requests\EquipoRequest;
use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\EquipoResource;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;

class EquipoController extends Controller
{
    protected function clearEquipoCache(Equipo $equipo): void
    {
        \Illuminate\Support\Facades\Cache::forget('equipo_show_' . $equipo->id);
        try {
            $orgIds = \App\Models\Organizacion::pluck('id');
            foreach ($orgIds as $orgId) {
                \Illuminate\Support\Facades\Cache::forget('equipo_show_' . $equipo->id . '_org_' . $orgId);
            }
        } catch (\Throwable $e) {
            // ignore
        }
    }
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Equipo::query()
            ->with(['capitan', 'competencias:id,nombre,logo'])
            ->withCount(['rosterOrganizacion', 'campeonatos', 'subcampeonatos', 'terceros']);

        // Búsqueda por nombre o abreviatura
        $query->when($request->filled('search'), function ($q) use ($request) {
            $searchTerm = $request->search;
            $q->where(function ($sub) use ($searchTerm) {
                $sub->where('nombre', 'like', "%{$searchTerm}%")
                    ->orWhere('abreviatura', 'like', "%{$searchTerm}%");
            });
        });

        // Filtro por plataforma (ej. PS4, PS5, PC, etc.)
        $query->when($request->filled('plataforma'), function ($q) use ($request) {
            $q->where('plataforma', $request->plataforma);
        });

        $perPage = $request->get('per_page', 9);
        $equipos = $query->paginate($perPage);

        return EquipoResource::collection($equipos);
    }

    /**
     * Obtener el equipo gestionado por el usuario autenticado junto con su roster y torneos.
     */
    public function miEquipo(Request $request)
    {
        $equipo = Equipo::where('id_capitan', auth()->id())->first();

        if (!$equipo) {
            return response()->json([
                'message' => 'No tienes club registrado.',
                'data' => null
            ], 200);
        }

        // Obtener todas las organizaciones disponibles
        $organizaciones = \App\Models\Organizacion::select('id', 'nombre', 'logo', 'slug')->get();

        // Autodetectar o usar la organización seleccionada
        $organizacionId = $request->query('organizacion_id');

        if (!$organizacionId) {
            // 1. Intentar autodetectar a partir de alguna competencia donde el equipo esté inscrito
            $organizacionId = \DB::table('competencia_equipo')
                ->join('competencias', 'competencia_equipo.competencia_id', '=', 'competencias.id')
                ->join('temporadas', 'competencias.temporada_id', '=', 'temporadas.id')
                ->where('competencia_equipo.equipo_id', $equipo->id)
                ->value('temporadas.organizacion_id');
        }

        if (!$organizacionId) {
            // 2. Intentar autodetectar a partir del roster
            $organizacionId = \App\Models\OrganizacionEquipoUsuario::where('equipo_id', $equipo->id)->value('organizacion_id');
        }

        if (!$organizacionId) {
            // 3. Fallback a organización del capitan o primera organización
            $organizacionId = \App\Models\Organizacion::where('owner_id', auth()->id())->value('id')
                ?? \App\Models\Organizacion::value('id')
                ?? 1; // Fallback
        }

        // Cargar el roster de la organización detectada
        $roster = \App\Models\OrganizacionEquipoUsuario::with('jugador')
            ->where('equipo_id', $equipo->id)
            ->where('organizacion_id', $organizacionId)
            ->get()
            ->map(function ($row) {
                if (!$row->jugador) {
                    return null;
                }
                return [
                    'id' => $row->jugador->id,
                    'name' => $row->jugador->name,
                    'foto' => $row->jugador->foto,
                    'gamertag' => $row->jugador->gamertag ?? 'N/A',
                    'dorsal' => $row->dorsal ?? null,
                    'posicion' => $row->posicion_bloque ?? 'Sin asignar',
                    'estado_fichaje' => $row->estado_fichaje ?? 'activo',
                ];
            })->filter()->values();

        // Obtener competencias de la organización y verificar si está inscrito
        $competencias = \App\Models\Competencia::whereHas('temporada', function ($query) use ($organizacionId) {
            $query->where('organizacion_id', $organizacionId);
        })->get()->map(function ($comp) use ($equipo) {
            $inscrito = \DB::table('competencia_equipo')
                ->where('competencia_id', $comp->id)
                ->where('equipo_id', $equipo->id)
                ->first();

            return [
                'id' => $comp->id,
                'nombre' => $comp->nombre,
                'slug' => $comp->slug,
                'formato' => $comp->formato,
                'plataforma' => $comp->plataforma,
                'max_participantes' => $comp->max_participantes,
                'estado_inscripcion' => $inscrito ? ($inscrito->estado_inscripcion ?? 'aprobado') : null,
                'config' => $comp->config,
            ];
        });

        // Obtener todos los partidos en los que participa este equipo filtrados por organización
        $partidos = \App\Models\Partido::with([
            'local:id,nombre,logo,abreviatura',
            'visitante:id,nombre,logo,abreviatura',
            'competencia:id,nombre'
        ])
        ->whereHas('competencia.temporada', function ($q) use ($organizacionId) {
            $q->where('organizacion_id', $organizacionId);
        })
        ->where(function($q) use ($equipo) {
            $q->where('equipo_local_id', $equipo->id)
              ->orWhere('equipo_visitante_id', $equipo->id);
        })
        ->orderBy('fecha', 'desc')
        ->orderBy('hora', 'desc')
        ->get();

        // Calcular Estadísticas de partidos finalizados o con goles reportados
        $stats = [
            'jugados' => 0,
            'victorias' => 0,
            'empates' => 0,
            'derrotas' => 0,
            'goles_favor' => 0,
            'goles_contra' => 0,
        ];

        foreach ($partidos as $partido) {
            $hasResult = $partido->goles_local !== null && $partido->goles_visitante !== null;
            if ($partido->estado === 'finalizado' || $hasResult) {
                $stats['jugados']++;
                $isLocal = $partido->equipo_local_id === $equipo->id;
                $golesFavor = $isLocal ? (int)$partido->goles_local : (int)$partido->goles_visitante;
                $golesContra = $isLocal ? (int)$partido->goles_visitante : (int)$partido->goles_local;
                
                $stats['goles_favor'] += $golesFavor;
                $stats['goles_contra'] += $golesContra;

                if ($golesFavor > $golesContra) {
                    $stats['victorias']++;
                } elseif ($golesFavor < $golesContra) {
                    $stats['derrotas']++;
                } else {
                    $stats['empates']++;
                }
            }
        }

        // Obtener estadísticas avanzadas (IA) del equipo
        $statsAvanzadasQuery = \DB::table('estadisticas_equipos')
            ->join('competencias', 'estadisticas_equipos.competencia_id', '=', 'competencias.id')
            ->join('temporadas', 'competencias.temporada_id', '=', 'temporadas.id')
            ->where('estadisticas_equipos.equipo_id', $equipo->id)
            ->whereIn('competencias.estado', ['en_progreso', 'finalizado', 'borrador']);

        if ($organizacionId) {
            $statsAvanzadasQuery->where('temporadas.organizacion_id', $organizacionId);
        }

        $advancedStats = $statsAvanzadasQuery->select(
            \DB::raw('AVG(estadisticas_equipos.posesion) as avg_posesion'),
            \DB::raw('SUM(estadisticas_equipos.tiros) as total_tiros'),
            \DB::raw('SUM(estadisticas_equipos.pases_intentados) as total_pases'),
            \DB::raw('AVG(estadisticas_equipos.precision_pases) as avg_precision_pases'),
            \DB::raw('SUM(estadisticas_equipos.entradas_exitosas) as total_entradas_exitosas'),
            \DB::raw('SUM(estadisticas_equipos.atajadas) as total_atajadas')
        )->first();

        $stats['avg_posesion'] = $advancedStats->avg_posesion ? round($advancedStats->avg_posesion, 1) : 0;
        $stats['total_tiros'] = $advancedStats->total_tiros ?? 0;
        $stats['total_pases'] = $advancedStats->total_pases ?? 0;
        $stats['avg_precision_pases'] = $advancedStats->avg_precision_pases ? round($advancedStats->avg_precision_pases, 1) : 0;
        $stats['total_entradas_exitosas'] = $advancedStats->total_entradas_exitosas ?? 0;
        $stats['total_atajadas'] = $advancedStats->total_atajadas ?? 0;

        // Obtener el próximo partido programado filtrado por organización
        $proximoPartido = \App\Models\Partido::with([
            'local:id,nombre,logo,abreviatura',
            'visitante:id,nombre,logo,abreviatura',
            'competencia:id,nombre'
        ])
        ->whereHas('competencia.temporada', function ($q) use ($organizacionId) {
            $q->where('organizacion_id', $organizacionId);
        })
        ->where(function($q) use ($equipo) {
            $q->where('equipo_local_id', $equipo->id)
              ->orWhere('equipo_visitante_id', $equipo->id);
        })
        ->where(function($q) {
            $q->whereNull('goles_local')
              ->whereNull('goles_visitante');
        })
        ->orderBy('fecha', 'asc')
        ->orderBy('hora', 'asc')
        ->first();

        return response()->json([
            'id' => $equipo->id,
            'nombre' => $equipo->nombre,
            'abreviatura' => $equipo->abreviatura,
            'slug' => $equipo->slug,
            'descripcion' => $equipo->descripcion,
            'logo' => $equipo->logo,
            'banner' => $equipo->banner,
            'plataforma' => $equipo->plataforma,
            'redes_sociales' => $equipo->redes_sociales,
            'estado' => $equipo->estado,
            'roster' => $roster,
            'competencias' => $competencias,
            'organizaciones' => $organizaciones,
            'organizacion_activa_id' => (int)$organizacionId,
            'estadisticas' => $stats,
            'proximo_partido' => $proximoPartido ? [
                'id' => $proximoPartido->id,
                'fecha' => $proximoPartido->fecha,
                'hora' => $proximoPartido->hora,
                'estado' => $proximoPartido->estado,
                'competencia' => $proximoPartido->competencia ? [
                    'id' => $proximoPartido->competencia->id,
                    'nombre' => $proximoPartido->competencia->nombre,
                ] : null,
                'local' => [
                    'id' => $proximoPartido->local->id,
                    'nombre' => $proximoPartido->local->nombre,
                    'logo' => $proximoPartido->local->logo,
                    'abreviatura' => $proximoPartido->local->abreviatura,
                ],
                'visitante' => [
                    'id' => $proximoPartido->visitante->id,
                    'nombre' => $proximoPartido->visitante->nombre,
                    'logo' => $proximoPartido->visitante->logo,
                    'abreviatura' => $proximoPartido->visitante->abreviatura,
                ]
            ] : null,
        ], 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(EquipoRequest $request)
    {
        // 1. Obtenemos solo los datos validados del request
        $datos = $request->validated();

        // 2. Asignamos el capitán automáticamente con el usuario logueado
        $datos['id_capitan'] = auth()->id();

        // 3. Generamos el slug a partir del nombre (Ej: "Team SoloMid" -> "team-solomid")
        $datos['slug'] = Str::slug($datos['nombre']);

        // 4. Evitamos que 'logo' sea null para que se use el valor default
        if (empty($datos['logo'])) {
            $datos['logo'] = 'default.png';
        }

        // 5. Guardamos en la base de datos
        $equipo = Equipo::create($datos);

        return response()->json($equipo, 201);
    }

    public function show(Request $request, Equipo $equipo): JsonResponse
    {
        $organizacionId = $request->query('organizacion_id');
        $cacheKey = 'equipo_show_' . $equipo->id . ($organizacionId ? '_org_' . $organizacionId : '');
        $data = Cache::remember($cacheKey, now()->addMinutes(5), function () use ($equipo, $organizacionId) {
            $equipo->load(['capitan', 'competencias.temporada.organizacion']);

        $roster = \App\Models\OrganizacionEquipoUsuario::with(['jugador', 'organizacion'])
            ->where('equipo_id', $equipo->id)
            ->get()
            ->map(function ($row) {
                if (!$row->jugador) return null;
                return [
                    'id' => $row->jugador->id,
                    'name' => $row->jugador->name,
                    'foto' => $row->jugador->foto,
                    'gamertag' => $row->jugador->gamertag ?? 'N/A',
                    'dorsal' => $row->dorsal,
                    'posicion' => $row->posicion_bloque ?? 'Sin asignar',
                    'estado_fichaje' => $row->estado_fichaje,
                    'organizacion' => $row->organizacion ? [
                        'id' => $row->organizacion->id,
                        'nombre' => $row->organizacion->nombre
                    ] : null,
                ];
            })->filter()->values();

        $competencias = \App\Models\Competencia::with(['temporada.organizacion'])
            ->whereHas('equipos', function ($q) use ($equipo) {
                $q->where('equipos.id', $equipo->id);
            })->get()->map(function ($comp) {
                return [
                    'id' => $comp->id,
                    'nombre' => $comp->nombre,
                    'formato' => $comp->formato,
                    'plataforma' => $comp->plataforma,
                    'logo' => $comp->banner ?? $comp->logo,
                    'temporada' => $comp->temporada ? [
                        'id' => $comp->temporada->id,
                        'organizacion_id' => $comp->temporada->organizacion_id,
                        'organizacion' => $comp->temporada->organizacion ? [
                            'id' => $comp->temporada->organizacion->id,
                            'nombre' => $comp->temporada->organizacion->nombre,
                            'logo' => $comp->temporada->organizacion->logo,
                        ] : null,
                    ] : null,
                ];
            });

        $traspasos = \App\Models\SolicitudFichaje::with([
            'jugador:id,name,foto,gamertag',
            'equipo:id,nombre,logo,abreviatura',
            'equipoOrigen:id,nombre,logo,abreviatura',
            'organizacion:id,nombre,logo'
        ])
        ->where('estado', 'aprobado')
        ->where(function($q) use ($equipo) {
            $q->where('equipo_id', $equipo->id)
              ->orWhere('equipo_origen_id', $equipo->id);
        })
        ->orderBy('updated_at', 'desc')
        ->get();

        $partidos = \App\Models\Partido::with([
            'local:id,nombre,logo,abreviatura',
            'visitante:id,nombre,logo,abreviatura',
            'competencia:id,nombre'
        ])
        ->where(function($q) use ($equipo) {
            $q->where('equipo_local_id', $equipo->id)
              ->orWhere('equipo_visitante_id', $equipo->id);
        })
        ->orderBy('fecha', 'desc')
        ->orderBy('hora', 'desc')
        ->get();

        // Calcular Estadísticas Tácticas de los partidos finalizados filtrados por organizacion y que estén en progreso
        $stats = [
            'jugados' => 0,
            'victorias' => 0,
            'empates' => 0,
            'derrotas' => 0,
            'goles_favor' => 0,
            'goles_contra' => 0,
        ];

        $statsPartidosQuery = \App\Models\Partido::query()
            ->where(function($q) use ($equipo) {
                $q->where('equipo_local_id', $equipo->id)
                  ->orWhere('equipo_visitante_id', $equipo->id);
            });

        if ($organizacionId) {
            $statsPartidosQuery->whereHas('competencia.temporada', function($q) use ($organizacionId) {
                $q->where('organizacion_id', $organizacionId);
            });
        }
        
        $statsPartidosQuery->whereHas('competencia', function($q) {
            $q->whereIn('estado', ['en_progreso', 'finalizado', 'borrador']);
        });

        $statsPartidos = $statsPartidosQuery->get();

        foreach ($statsPartidos as $partido) {
            $hasResult = $partido->goles_local !== null && $partido->goles_visitante !== null;
            if ($partido->estado === 'finalizado' || $hasResult) {
                $stats['jugados']++;
                $isLocal = $partido->equipo_local_id === $equipo->id;
                $golesFavor = $isLocal ? (int)$partido->goles_local : (int)$partido->goles_visitante;
                $golesContra = $isLocal ? (int)$partido->goles_visitante : (int)$partido->goles_local;
                
                $stats['goles_favor'] += $golesFavor;
                $stats['goles_contra'] += $golesContra;

                if ($golesFavor > $golesContra) {
                    $stats['victorias']++;
                } elseif ($golesFavor < $golesContra) {
                    $stats['derrotas']++;
                } else {
                    $stats['empates']++;
                }
            }
        }

        // Obtener estadísticas avanzadas (IA) del equipo
        $statsAvanzadasQuery = \DB::table('estadisticas_equipos')
            ->join('competencias', 'estadisticas_equipos.competencia_id', '=', 'competencias.id')
            ->join('temporadas', 'competencias.temporada_id', '=', 'temporadas.id')
            ->where('estadisticas_equipos.equipo_id', $equipo->id)
            ->whereIn('competencias.estado', ['en_progreso', 'finalizado', 'borrador']);

        if ($organizacionId) {
            $statsAvanzadasQuery->where('temporadas.organizacion_id', $organizacionId);
        }

        $advancedStats = $statsAvanzadasQuery->select(
            \DB::raw('AVG(estadisticas_equipos.posesion) as avg_posesion'),
            \DB::raw('SUM(estadisticas_equipos.tiros) as total_tiros'),
            \DB::raw('SUM(estadisticas_equipos.pases_intentados) as total_pases'),
            \DB::raw('AVG(estadisticas_equipos.precision_pases) as avg_precision_pases'),
            \DB::raw('SUM(estadisticas_equipos.entradas_exitosas) as total_entradas_exitosas'),
            \DB::raw('SUM(estadisticas_equipos.atajadas) as total_atajadas')
        )->first();

        $stats['avg_posesion'] = $advancedStats->avg_posesion ? round($advancedStats->avg_posesion, 1) : 0;
        $stats['total_tiros'] = $advancedStats->total_tiros ?? 0;
        $stats['total_pases'] = $advancedStats->total_pases ?? 0;
        $stats['avg_precision_pases'] = $advancedStats->avg_precision_pases ? round($advancedStats->avg_precision_pases, 1) : 0;
        $stats['total_entradas_exitosas'] = $advancedStats->total_entradas_exitosas ?? 0;
        $stats['total_atajadas'] = $advancedStats->total_atajadas ?? 0;

        // Top goleadores de la escuadra en el sistema (filtrado por organizacion y competencias en_progreso)
        $goleadoresQuery = \DB::table('estadisticas_jugadores')
            ->join('users', 'estadisticas_jugadores.jugador_id', '=', 'users.id')
            ->join('competencias', 'estadisticas_jugadores.competencia_id', '=', 'competencias.id')
            ->join('temporadas', 'competencias.temporada_id', '=', 'temporadas.id')
            ->where('estadisticas_jugadores.equipo_id', $equipo->id)
            ->whereIn('competencias.estado', ['en_progreso', 'finalizado', 'borrador']);

        if ($organizacionId) {
            $goleadoresQuery->where('temporadas.organizacion_id', $organizacionId);
        }

        $goleadoresClub = $goleadoresQuery
            ->select(
                'users.id',
                'users.name',
                'users.foto',
                'users.gamertag',
                'estadisticas_jugadores.posicion',
                \DB::raw('SUM(estadisticas_jugadores.goles) as total_goles')
            )
            ->groupBy('users.id', 'users.name', 'users.foto', 'users.gamertag', 'estadisticas_jugadores.posicion')
            ->orderByDesc('total_goles')
            ->take(5)
            ->get()
            ->map(function ($row) {
                return [
                    'id' => $row->id,
                    'name' => $row->name,
                    'foto' => $row->foto,
                    'gamertag' => $row->gamertag,
                    'posicion' => $row->posicion,
                    'total_goles' => (int)$row->total_goles
                ];
            });

        // Top asistentes de la escuadra en el sistema
        $asistentesQuery = \DB::table('estadisticas_jugadores')
            ->join('users', 'estadisticas_jugadores.jugador_id', '=', 'users.id')
            ->join('competencias', 'estadisticas_jugadores.competencia_id', '=', 'competencias.id')
            ->join('temporadas', 'competencias.temporada_id', '=', 'temporadas.id')
            ->where('estadisticas_jugadores.equipo_id', $equipo->id)
            ->whereIn('competencias.estado', ['en_progreso', 'finalizado', 'borrador']);

        if ($organizacionId) {
            $asistentesQuery->where('temporadas.organizacion_id', $organizacionId);
        }

        $asistentesClub = $asistentesQuery
            ->select(
                'users.id',
                'users.name',
                'users.foto',
                'users.gamertag',
                'estadisticas_jugadores.posicion',
                \DB::raw('SUM(estadisticas_jugadores.asistencias) as total_asistencias')
            )
            ->groupBy('users.id', 'users.name', 'users.foto', 'users.gamertag', 'estadisticas_jugadores.posicion')
            ->orderByDesc('total_asistencias')
            ->take(5)
            ->get()
            ->map(function ($row) {
                return [
                    'id' => $row->id,
                    'name' => $row->name,
                    'foto' => $row->foto,
                    'gamertag' => $row->gamertag,
                    'posicion' => $row->posicion,
                    'total_asistencias' => (int)$row->total_asistencias
                ];
            });

        // Mejores Arqueros (Top 5 en base a su valoración promedio)
        $arquerosQuery = \DB::table('estadisticas_jugadores')
            ->join('users', 'estadisticas_jugadores.jugador_id', '=', 'users.id')
            ->join('competencias', 'estadisticas_jugadores.competencia_id', '=', 'competencias.id')
            ->join('temporadas', 'competencias.temporada_id', '=', 'temporadas.id')
            ->where('estadisticas_jugadores.equipo_id', $equipo->id)
            ->whereIn('estadisticas_jugadores.posicion', ['POR', 'GK', 'PO', 'por', 'gk', 'po', 'goalkeeper', 'GOALKEEPER'])
            ->whereIn('competencias.estado', ['en_progreso', 'finalizado', 'borrador']);

        if ($organizacionId) {
            $arquerosQuery->where('temporadas.organizacion_id', $organizacionId);
        }

        $mejoresArqueros = $arquerosQuery
            ->select(
                'users.id',
                'users.name',
                'users.foto',
                'users.gamertag',
                'estadisticas_jugadores.posicion',
                \DB::raw('COUNT(estadisticas_jugadores.id) as partidos'),
                \DB::raw('AVG(estadisticas_jugadores.valoracion) as avg_valoracion'),
                \DB::raw('SUM(estadisticas_jugadores.atajadas) as total_atajadas')
            )
            ->groupBy('users.id', 'users.name', 'users.foto', 'users.gamertag', 'estadisticas_jugadores.posicion')
            ->orderByDesc('avg_valoracion')
            ->take(5)
            ->get()
            ->map(function ($row) {
                return [
                    'id' => $row->id,
                    'name' => $row->name,
                    'foto' => $row->foto,
                    'gamertag' => $row->gamertag,
                    'posicion' => $row->posicion,
                    'partidos' => (int)$row->partidos,
                    'avg_valoracion' => round((float)$row->avg_valoracion, 2),
                    'total_atajadas' => (int)$row->total_atajadas
                ];
            });

        // Mejores Defensores (Top 5 en base a su valoración promedio)
        $defensoresQuery = \DB::table('estadisticas_jugadores')
            ->join('users', 'estadisticas_jugadores.jugador_id', '=', 'users.id')
            ->join('competencias', 'estadisticas_jugadores.competencia_id', '=', 'competencias.id')
            ->join('temporadas', 'competencias.temporada_id', '=', 'temporadas.id')
            ->where('estadisticas_jugadores.equipo_id', $equipo->id)
            ->whereIn('estadisticas_jugadores.posicion', ['DFC', 'DFI', 'DFD', 'CB', 'LB', 'RB', 'DF', 'DEF', 'dfc', 'dfi', 'dfd', 'cb', 'lb', 'rb', 'df', 'def', 'defender', 'DEFENDER'])
            ->whereIn('competencias.estado', ['en_progreso', 'finalizado', 'borrador']);

        if ($organizacionId) {
            $defensoresQuery->where('temporadas.organizacion_id', $organizacionId);
        }

        $mejoresDefensores = $defensoresQuery
            ->select(
                'users.id',
                'users.name',
                'users.foto',
                'users.gamertag',
                'estadisticas_jugadores.posicion',
                \DB::raw('COUNT(estadisticas_jugadores.id) as partidos'),
                \DB::raw('AVG(estadisticas_jugadores.valoracion) as avg_valoracion'),
                \DB::raw('SUM(estadisticas_jugadores.entradas_exitosas) as total_entradas')
            )
            ->groupBy('users.id', 'users.name', 'users.foto', 'users.gamertag', 'estadisticas_jugadores.posicion')
            ->orderByDesc('avg_valoracion')
            ->take(5)
            ->get()
            ->map(function ($row) {
                return [
                    'id' => $row->id,
                    'name' => $row->name,
                    'foto' => $row->foto,
                    'gamertag' => $row->gamertag,
                    'posicion' => $row->posicion,
                    'partidos' => (int)$row->partidos,
                    'avg_valoracion' => round((float)$row->avg_valoracion, 2),
                    'total_entradas' => (int)$row->total_entradas
                ];
            });

        // Mejores Mediocentros (Top 5 en base a su valoración promedio)
        $mediosQuery = \DB::table('estadisticas_jugadores')
            ->join('users', 'estadisticas_jugadores.jugador_id', '=', 'users.id')
            ->join('competencias', 'estadisticas_jugadores.competencia_id', '=', 'competencias.id')
            ->join('temporadas', 'competencias.temporada_id', '=', 'temporadas.id')
            ->where('estadisticas_jugadores.equipo_id', $equipo->id)
            ->whereIn('estadisticas_jugadores.posicion', ['MC', 'MCO', 'MCD', 'MD', 'MI', 'CM', 'CAM', 'CDM', 'LM', 'RM', 'MED', 'mc', 'mco', 'mcd', 'md', 'mi', 'cm', 'cam', 'cdm', 'lm', 'rm', 'med', 'midfielder', 'MIDFIELDER'])
            ->whereIn('competencias.estado', ['en_progreso', 'finalizado', 'borrador']);

        if ($organizacionId) {
            $mediosQuery->where('temporadas.organizacion_id', $organizacionId);
        }

        $mejoresMedios = $mediosQuery
            ->select(
                'users.id',
                'users.name',
                'users.foto',
                'users.gamertag',
                'estadisticas_jugadores.posicion',
                \DB::raw('COUNT(estadisticas_jugadores.id) as partidos'),
                \DB::raw('AVG(estadisticas_jugadores.valoracion) as avg_valoracion'),
                \DB::raw('SUM(estadisticas_jugadores.asistencias) as total_asistencias'),
                \DB::raw('AVG(estadisticas_jugadores.precision_pases) as avg_precision_pases')
            )
            ->groupBy('users.id', 'users.name', 'users.foto', 'users.gamertag', 'estadisticas_jugadores.posicion')
            ->orderByDesc('avg_valoracion')
            ->take(5)
            ->get()
            ->map(function ($row) {
                return [
                    'id' => $row->id,
                    'name' => $row->name,
                    'foto' => $row->foto,
                    'gamertag' => $row->gamertag,
                    'posicion' => $row->posicion,
                    'partidos' => (int)$row->partidos,
                    'avg_valoracion' => round((float)$row->avg_valoracion, 2),
                    'total_asistencias' => (int)$row->total_asistencias,
                    'avg_precision_pases' => round((float)$row->avg_precision_pases, 1)
                ];
            });

        // Historial completo de torneos disputados por el club agrupados por competencia y temporada
        $historialClub = \DB::table('estadisticas_equipos')
            ->join('competencias', 'estadisticas_equipos.competencia_id', '=', 'competencias.id')
            ->join('temporadas', 'competencias.temporada_id', '=', 'temporadas.id')
            ->join('organizaciones', 'temporadas.organizacion_id', '=', 'organizaciones.id')
            ->where('estadisticas_equipos.equipo_id', $equipo->id)
            ->select(
                'organizaciones.id as organizacion_id',
                'organizaciones.nombre as organizacion_nombre',
                'temporadas.id as temporada_id',
                'temporadas.nombre as temporada_nombre',
                'competencias.nombre as competencia_nombre',
                'competencias.banner as competencia_logo',
                \DB::raw('COUNT(estadisticas_equipos.id) as jugados'),
                \DB::raw('SUM(CASE WHEN estadisticas_equipos.goles_favor > estadisticas_equipos.goles_en_contra THEN 1 ELSE 0 END) as victorias'),
                \DB::raw('SUM(CASE WHEN estadisticas_equipos.goles_favor = estadisticas_equipos.goles_en_contra THEN 1 ELSE 0 END) as empates'),
                \DB::raw('SUM(CASE WHEN estadisticas_equipos.goles_favor < estadisticas_equipos.goles_en_contra THEN 1 ELSE 0 END) as derrotas'),
                \DB::raw('SUM(estadisticas_equipos.goles_favor) as goles_favor'),
                \DB::raw('SUM(estadisticas_equipos.goles_en_contra) as goles_contra')
            )
            ->groupBy(
                'organizaciones.id',
                'organizaciones.nombre',
                'temporadas.id',
                'temporadas.nombre',
                'competencias.nombre',
                'competencias.banner'
            )
            ->get()
            ->map(function ($row) {
                return [
                    'organizacion_id' => $row->organizacion_id,
                    'organizacion_nombre' => $row->organizacion_nombre,
                    'temporada_id' => $row->temporada_id,
                    'temporada_nombre' => $row->temporada_nombre,
                    'competencia_nombre' => $row->competencia_nombre,
                    'competencia_logo' => $row->competencia_logo,
                    'jugados' => (int)$row->jugados,
                    'victorias' => (int)$row->victorias,
                    'empates' => (int)$row->empates,
                    'derrotas' => (int)$row->derrotas,
                    'goles_favor' => (int)$row->goles_favor,
                    'goles_contra' => (int)$row->goles_contra
                ];
            });

            return [
                'id' => $equipo->id,
                'nombre' => $equipo->nombre,
                'abreviatura' => $equipo->abreviatura,
                'descripcion' => $equipo->descripcion,
                'logo' => $equipo->logo,
                'banner' => $equipo->banner,
                'plataforma' => $equipo->plataforma,
                'redes_sociales' => $equipo->redes_sociales,
                'capitan' => $equipo->capitan ? [
                    'name' => $equipo->capitan->name,
                    'gamertag' => $equipo->capitan->gamertag ?? 'N/A',
                    'email' => $equipo->capitan->email,
                ] : null,
                'roster' => $roster,
                'competencias' => $competencias,
                'traspasos' => $traspasos,
                'partidos' => $partidos,
                'goleadores' => $goleadoresClub,
                'asistentes' => $asistentesClub,
                'mejores_arqueros' => $mejoresArqueros,
                'mejores_defensores' => $mejoresDefensores,
                'mejores_medios' => $mejoresMedios,
                'historial_club' => $historialClub,
                'estadisticas' => $stats
            ];
        });

        return response()->json($data);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(EquipoRequest $request, Equipo $equipo): JsonResponse
    {
        $datos = $request->validated();
        if (empty($datos['logo'])) {
            $datos['logo'] = 'default.png';
        }

        // Delete old logo if updated
        if (array_key_exists('logo', $datos) && $datos['logo'] !== $equipo->logo) {
            $oldLogo = $equipo->logo;
            if ($oldLogo && str_contains($oldLogo, 'uploads/') && !str_starts_with($oldLogo, 'http')) {
                $fullPath = public_path(ltrim($oldLogo, '/'));
                if (file_exists($fullPath) && is_file($fullPath)) {
                    @unlink($fullPath);
                }
            }
        }
        
        // Delete old banner if updated
        if (array_key_exists('banner', $datos) && $datos['banner'] !== $equipo->banner) {
            $oldBanner = $equipo->banner;
            if ($oldBanner && str_contains($oldBanner, 'uploads/') && !str_starts_with($oldBanner, 'http')) {
                $fullPath = public_path(ltrim($oldBanner, '/'));
                if (file_exists($fullPath) && is_file($fullPath)) {
                    @unlink($fullPath);
                }
            }
        }

        $equipo->update($datos);
        $this->clearEquipoCache($equipo);

        return response()->json(new EquipoResource($equipo));
    }

    /**
     * Delete the specified resource.
     */
    public function destroy(Equipo $equipo): Response|JsonResponse
    {
        $partidosCount = \App\Models\Partido::where('equipo_local_id', $equipo->id)
            ->orWhere('equipo_visitante_id', $equipo->id)
            ->count();

        if ($partidosCount > 0) {
            return response()->json([
                'message' => 'No es posible eliminar este equipo porque tiene partidos registrados (ya disputados o pendientes). Debes reasignar o eliminar los partidos asociados antes de borrar el club.'
            ], 422);
        }

        // Delete logo and banner files if they exist
        $oldLogo = $equipo->logo;
        if ($oldLogo && str_contains($oldLogo, 'uploads/') && !str_starts_with($oldLogo, 'http')) {
            $fullPath = public_path(ltrim($oldLogo, '/'));
            if (file_exists($fullPath) && is_file($fullPath)) {
                @unlink($fullPath);
            }
        }
        $oldBanner = $equipo->banner;
        if ($oldBanner && str_contains($oldBanner, 'uploads/') && !str_starts_with($oldBanner, 'http')) {
            $fullPath = public_path(ltrim($oldBanner, '/'));
            if (file_exists($fullPath) && is_file($fullPath)) {
                @unlink($fullPath);
            }
        }

        $this->clearEquipoCache($equipo);
        $equipo->delete();

        return response()->noContent();
    }

    /**
     * Fichar o agregar un jugador al roster de la organización para este equipo.
     */
    public function addRosterJugador(Request $request, Equipo $equipo): JsonResponse
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'posicion' => 'nullable|string',
            'dorsal' => 'nullable|string',
        ]);

        try {
            $service = app(\App\Services\SolicitudFichajeService::class);
            $datosFichaje = [
                'organizacion_id' => $request->input('organizacion_id'),
                'dorsal' => $request->dorsal,
                'posicion' => $request->posicion,
            ];

            $resultado = $service->ficharDirectoAdministrativo(auth()->user(), $equipo->id, $request->user_id, $datosFichaje);

            $this->clearEquipoCache($equipo);

            return response()->json(['message' => $resultado['message']], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function removeRosterJugador(Request $request, Equipo $equipo, $userId): JsonResponse
    {
        // Autodetectar o usar la organización recibida
        $organizacionId = $request->input('organizacion_id')
            ?? $request->query('organizacion_id')
            ?? \App\Models\OrganizacionEquipoUsuario::where('equipo_id', $equipo->id)->value('organizacion_id');

        if (!$organizacionId) {
            $organizacionId = \App\Models\Organizacion::where('owner_id', auth()->id())->value('id')
                ?? \App\Models\Organizacion::value('id')
                ?? 1;
        }

        $rosterMember = \App\Models\OrganizacionEquipoUsuario::where('organizacion_id', $organizacionId)
            ->where('equipo_id', $equipo->id)
            ->where('user_id', $userId)
            ->first();

        if ($rosterMember) {
            $temporada = \App\Models\Temporada::where('organizacion_id', $organizacionId)
                ->where('activa', true)
                ->first();

            // Generar una ficha de traspaso del tipo despido / jugador libre
            \App\Models\SolicitudFichaje::create([
                'organizacion_id' => $organizacionId,
                'temporada_id' => $temporada ? $temporada->id : null,
                'equipo_id' => null, // Destino nulo (Jugador Libre)
                'equipo_origen_id' => $equipo->id,
                'user_id' => $userId,
                'estado' => 'aprobado', // Completado
                'dorsal' => $rosterMember->dorsal,
                'posicion' => $rosterMember->posicion_bloque,
                'observaciones_admin' => 'Despido / Jugador desvinculado del club de forma oficial.'
            ]);

            $rosterMember->delete();

            $this->clearEquipoCache($equipo);

            return response()->json(['message' => 'Jugador desvinculado del roster de la organización y registrado como libre.'], 200);
        }

        return response()->json(['message' => 'Jugador no encontrado en el roster.'], 404);
    }

    /**
     * Actualizar los datos tácticos (dorsal y posición) de un jugador en el roster.
     */
    public function updateRosterJugador(Request $request, Equipo $equipo, $userId): JsonResponse
    {
        $request->validate([
            'posicion' => 'nullable|string',
            'dorsal' => 'nullable|string',
        ]);

        // Autodetectar o usar la organización recibida
        $organizacionId = $request->input('organizacion_id')
            ?? \App\Models\OrganizacionEquipoUsuario::where('equipo_id', $equipo->id)->value('organizacion_id');

        if (!$organizacionId) {
            $organizacionId = \App\Models\Organizacion::where('owner_id', auth()->id())->value('id')
                ?? \App\Models\Organizacion::value('id')
                ?? 1;
        }

        $rosterMember = \App\Models\OrganizacionEquipoUsuario::where('organizacion_id', $organizacionId)
            ->where('equipo_id', $equipo->id)
            ->where('user_id', $userId)
            ->first();

        if (!$rosterMember) {
            return response()->json(['message' => 'Jugador no encontrado en el roster de este club.'], 404);
        }

        $rosterMember->update([
            'dorsal' => $request->dorsal,
            'posicion_bloque' => $request->posicion,
        ]);

        $this->clearEquipoCache($equipo);

        return response()->json(['message' => 'Ficha táctica actualizada con éxito.'], 200);
    }

    /**
     * Obtener todos los equipos en los que está inscrito el jugador logueado.
     */
    public function misEquiposInscritos(Request $request): JsonResponse
    {
        $user = auth()->user();

        $contratos = \App\Models\OrganizacionEquipoUsuario::with(['equipo.capitan', 'organizacion'])
            ->where('user_id', $user->id)
            ->get()
            ->map(function ($row) {
                if (!$row->equipo || !$row->organizacion) {
                    return null;
                }

                // Obtener torneos inscritos de esta organización para este equipo
                $torneos = \App\Models\Competencia::whereHas('temporada', function ($query) use ($row) {
                    $query->where('organizacion_id', $row->organizacion_id);
                })->whereHas('equipos', function ($q) use ($row) {
                    $q->where('equipos.id', $row->equipo_id);
                })->get()->map(function ($comp) {
                    return [
                        'id' => $comp->id,
                        'nombre' => $comp->nombre,
                        'formato' => $comp->formato,
                    ];
                });

                return [
                    'id' => $row->id,
                    'organizacion' => [
                        'id' => $row->organizacion->id,
                        'nombre' => $row->organizacion->nombre,
                        'logo' => $row->organizacion->logo,
                    ],
                    'equipo' => [
                        'id' => $row->equipo->id,
                        'nombre' => $row->equipo->nombre,
                        'abreviatura' => $row->equipo->abreviatura,
                        'logo' => $row->equipo->logo,
                        'plataforma' => $row->equipo->plataforma,
                        'capitan' => $row->equipo->capitan ? [
                            'name' => $row->equipo->capitan->name,
                            'gamertag' => $row->equipo->capitan->gamertag ?? 'N/A',
                            'email' => $row->equipo->capitan->email,
                        ] : null,
                    ],
                    'dorsal' => $row->dorsal,
                    'posicion' => $row->posicion_bloque ?? 'Sin asignar',
                    'estado_fichaje' => $row->estado_fichaje,
                    'fecha_vinculacion' => $row->fecha_vinculacion ? $row->fecha_vinculacion->toDateString() : null,
                    'torneos' => $torneos,
                ];
            })->filter()->values();

        return response()->json($contratos);
    }
}
