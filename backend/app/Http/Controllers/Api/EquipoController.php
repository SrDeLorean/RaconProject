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
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Equipo::query()->with('capitan')->withCount('rosterOrganizacion');

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
        $organizacionId = $request->query('organizacion_id')
            ?? \App\Models\OrganizacionEquipoUsuario::where('equipo_id', $equipo->id)->value('organizacion_id');

        if (!$organizacionId) {
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
            ];
        });

        // Obtener todos los partidos en los que participa este equipo
        $partidos = \App\Models\Partido::with([
            'local:id,nombre,logo,abreviatura',
            'visitante:id,nombre,logo,abreviatura',
            'competencia:id,nombre'
        ])
        ->where('equipo_local_id', $equipo->id)
        ->orWhere('equipo_visitante_id', $equipo->id)
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

        // Obtener el próximo partido programado
        $proximoPartido = \App\Models\Partido::with([
            'local:id,nombre,logo,abreviatura',
            'visitante:id,nombre,logo,abreviatura',
            'competencia:id,nombre'
        ])
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

    public function show(Equipo $equipo): JsonResponse
    {
        $cacheKey = 'equipo_show_' . $equipo->id;
        $data = Cache::remember($cacheKey, now()->addMinutes(5), function () use ($equipo) {
            $equipo->load('capitan');

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

        $competencias = \App\Models\Competencia::whereHas('equipos', function ($q) use ($equipo) {
            $q->where('equipos.id', $equipo->id);
        })->get()->map(function ($comp) {
            return [
                'id' => $comp->id,
                'nombre' => $comp->nombre,
                'formato' => $comp->formato,
                'plataforma' => $comp->plataforma,
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
        ->where('equipo_local_id', $equipo->id)
        ->orWhere('equipo_visitante_id', $equipo->id)
        ->orderBy('fecha', 'desc')
        ->orderBy('hora', 'desc')
        ->get();

        // Calcular Estadísticas Tácticas de los partidos finalizados
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

        // Top goleadores de la escuadra en el sistema
        $goleadoresClub = \DB::table('estadisticas_jugadores')
            ->join('users', 'estadisticas_jugadores.jugador_id', '=', 'users.id')
            ->where('estadisticas_jugadores.equipo_id', $equipo->id)
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
        $asistentesClub = \DB::table('estadisticas_jugadores')
            ->join('users', 'estadisticas_jugadores.jugador_id', '=', 'users.id')
            ->where('estadisticas_jugadores.equipo_id', $equipo->id)
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
        $mejoresArqueros = \DB::table('estadisticas_jugadores')
            ->join('users', 'estadisticas_jugadores.jugador_id', '=', 'users.id')
            ->where('estadisticas_jugadores.equipo_id', $equipo->id)
            ->whereIn('estadisticas_jugadores.posicion', ['POR', 'GK', 'PO', 'por', 'gk', 'po', 'goalkeeper', 'GOALKEEPER'])
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
        $mejoresDefensores = \DB::table('estadisticas_jugadores')
            ->join('users', 'estadisticas_jugadores.jugador_id', '=', 'users.id')
            ->where('estadisticas_jugadores.equipo_id', $equipo->id)
            ->whereIn('estadisticas_jugadores.posicion', ['DFC', 'DFI', 'DFD', 'CB', 'LB', 'RB', 'DF', 'DEF', 'dfc', 'dfi', 'dfd', 'cb', 'lb', 'rb', 'df', 'def', 'defender', 'DEFENDER'])
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
        $mejoresMedios = \DB::table('estadisticas_jugadores')
            ->join('users', 'estadisticas_jugadores.jugador_id', '=', 'users.id')
            ->where('estadisticas_jugadores.equipo_id', $equipo->id)
            ->whereIn('estadisticas_jugadores.posicion', ['MC', 'MCO', 'MCD', 'MD', 'MI', 'CM', 'CAM', 'CDM', 'LM', 'RM', 'MED', 'mc', 'mco', 'mcd', 'md', 'mi', 'cm', 'cam', 'cdm', 'lm', 'rm', 'med', 'midfielder', 'MIDFIELDER'])
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
                'organizaciones.nombre as organizacion_nombre',
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
                'organizaciones.nombre',
                'temporadas.nombre',
                'competencias.nombre',
                'competencias.banner'
            )
            ->get()
            ->map(function ($row) {
                return [
                    'organizacion_nombre' => $row->organizacion_nombre,
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

        $equipo->update($datos);
        Cache::forget('equipo_show_' . $equipo->id);

        return response()->json(new EquipoResource($equipo));
    }

    /**
     * Delete the specified resource.
     */
    public function destroy(Equipo $equipo): Response
    {
        Cache::forget('equipo_show_' . $equipo->id);
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

        // Autodetectar o usar la organización recibida
        $organizacionId = $request->input('organizacion_id')
            ?? \App\Models\OrganizacionEquipoUsuario::where('equipo_id', $equipo->id)->value('organizacion_id');

        if (!$organizacionId) {
            $organizacionId = \App\Models\Organizacion::where('owner_id', auth()->id())->value('id')
                ?? \App\Models\Organizacion::value('id')
                ?? 1;
        }

        // Verificar si ya está en el roster de este equipo en esta organización
        $existe = \App\Models\OrganizacionEquipoUsuario::where('organizacion_id', $organizacionId)
            ->where('user_id', $request->user_id)
            ->first();

        if ($existe) {
            if ($existe->equipo_id == $equipo->id) {
                return response()->json(['message' => 'El jugador ya está en tu roster.'], 400);
            } else {
                return response()->json(['message' => 'El competidor ya pertenece a otro club dentro de esta organización.'], 400);
            }
        }

        // Crear registro en organizacion_equipo_usuario
        \App\Models\OrganizacionEquipoUsuario::create([
            'organizacion_id' => $organizacionId,
            'equipo_id' => $equipo->id,
            'user_id' => $request->user_id,
            'dorsal' => $request->dorsal,
            'posicion_bloque' => $request->posicion,
            'estado_fichaje' => 'activo',
            'fecha_vinculacion' => now(),
        ]);

        Cache::forget('equipo_show_' . $equipo->id);

        return response()->json(['message' => 'Jugador incorporado exitosamente al roster de la organización.'], 200);
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

            Cache::forget('equipo_show_' . $equipo->id);

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

        Cache::forget('equipo_show_' . $equipo->id);

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
