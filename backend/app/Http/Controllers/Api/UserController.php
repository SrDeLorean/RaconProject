<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Requests\UserRequest;
use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Equipo;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query()->with('equipos');

        // 1. Filtro de Búsqueda Ampliado (Ahora busca también por Gamertag y EA ID)
        $query->when($request->filled('search'), function ($q) use ($request) {
            $searchTerm = $request->search;
            $q->where(function ($query) use ($searchTerm) {
                $query->where('name', 'like', "%{$searchTerm}%")
                      ->orWhere('email', 'like', "%{$searchTerm}%")
                      ->orWhere('gamertag', 'like', "%{$searchTerm}%") // Búsqueda gamer
                      ->orWhere('id_ea', 'like', "%{$searchTerm}%");
            });
        });

        // 2. Filtro por Rol (Dashboard General)
        $query->when($request->filled('role'), function ($q) use ($request) {
            $q->where('role', $request->role);
        });

        // 3. 🔥 NUEVO: Filtro por Estado (Para las pestañas del Organizador: Activo, Inactivo...)
        $query->when($request->filled('status'), function ($q) use ($request) {
            $q->where('status', $request->status);
        });

        // 4. 🔥 NUEVO: Filtro por Posición
        $query->when($request->filled('posicion'), function ($q) use ($request) {
            $pos = strtoupper($request->posicion);
            if ($pos === 'GK' || $pos === 'POR') {
                $q->whereIn('posicion', ['POR', 'GK']);
            } elseif ($pos === 'DEF') {
                $q->whereIn('posicion', ['DFC', 'DFI', 'DFD', 'CB', 'LB', 'RB']);
            } elseif ($pos === 'MED') {
                $q->whereIn('posicion', ['MC', 'MCO', 'MCD', 'MD', 'MI', 'CM', 'CAM', 'CDM', 'LM', 'RM']);
            } elseif ($pos === 'DEL') {
                $q->whereIn('posicion', ['DEL', 'DC', 'EI', 'ED', 'ST', 'LW', 'RW', 'CF']);
            } else {
                $q->where('posicion', $request->posicion);
            }
        });

        // 5. Filtro por tipo de participación UT (1vs1 o 2vs2 o all/any)
        $query->when($request->filled('tipo_ut'), function ($q) use ($request) {
            $tipoUt = $request->tipo_ut; // '1vs1', '2vs2', 'all', or 'any'
            $q->where(function ($subQ) use ($tipoUt) {
                if ($tipoUt === 'all' || $tipoUt === 'any') {
                    $subQ->whereHas('equiposUtCapitan.competencias')
                         ->orWhereHas('equiposUtCompanero.competencias');
                } else {
                    $subQ->whereHas('equiposUtCapitan.competencias', function ($compQ) use ($tipoUt) {
                        $compQ->where('competencias_ut.tipo', $tipoUt);
                    })->orWhereHas('equiposUtCompanero.competencias', function ($compQ) use ($tipoUt) {
                        $compQ->where('competencias_ut.tipo', $tipoUt);
                    });
                }
            });
        });

        $perPage = $request->get('per_page', 10);
        $users = $query->paginate($perPage);

        return UserResource::collection($users);
    }

    public function disponibles(Request $request)
    {
        // 🔥 CORRECCIÓN CRÍTICA: Si no hay búsqueda, devolvemos vacío inmediatamente.
        // Esto evita que se listen todos los usuarios del sistema por error.
        if (!$request->filled('search')) {
            return response()->json([]);
        }

        $query = User::query();

        // 1. OBLIGATORIO: Solo se pueden fichar jugadores (role = 'jugador') y no suspendidos
        $query->where('role', 'jugador')
              ->where('status', '!=', 'suspendido');

        // 2. Búsqueda por texto
        $searchTerm = $request->search;
        $query->where(function ($q) use ($searchTerm) {
            $q->where('name', 'LIKE', '%' . $searchTerm . '%')
            ->orWhere('gamertag', 'LIKE', '%' . $searchTerm . '%')
            ->orWhere('email', 'LIKE', '%' . $searchTerm . '%');
        });

        // 3. Excluir únicamente a los que ya están en NUESTRO equipo en esta misma organización
        $organizacionId = $request->input('organizacion_id')
            ?? DB::table('organizaciones')->where('owner_id', auth()->id())->value('id')
            ?? DB::table('organizaciones')->value('id')
            ?? 1;

        $miEquipo = Equipo::where('id_capitan', auth()->id())->first();

        if ($miEquipo) {
            if (auth()->user()->role === 'jugador') {
                $totalOrgsCount = DB::table('organizaciones')->count();
                $inscritosIds = DB::table('organizacion_equipo_usuario')
                    ->where('equipo_id', $miEquipo->id)
                    ->groupBy('user_id')
                    ->having(DB::raw('COUNT(DISTINCT organizacion_id)'), '>=', $totalOrgsCount)
                    ->pluck('user_id')
                    ->toArray();
            } else {
                $inscritosIds = DB::table('organizacion_equipo_usuario')
                    ->where('organizacion_id', $organizacionId)
                    ->where('equipo_id', $miEquipo->id) // Solo excluir del propio equipo
                    ->pluck('user_id')
                    ->toArray();
            }

            if (!empty($inscritosIds)) {
                $query->whereNotIn('id', $inscritosIds);
            }
        }

        // 4. Seleccionamos los campos necesarios y mapeamos sus contratos activos por organización
        $jugadoresLibres = $query->select('id', 'name', 'email', 'gamertag', 'posicion', 'role')
                                ->take(10)
                                ->get()
                                ->map(function ($jugador) {
                                    $contratos = DB::table('organizacion_equipo_usuario')
                                        ->join('equipos', 'organizacion_equipo_usuario.equipo_id', '=', 'equipos.id')
                                        ->join('organizaciones', 'organizacion_equipo_usuario.organizacion_id', '=', 'organizaciones.id')
                                        ->where('organizacion_equipo_usuario.user_id', $jugador->id)
                                        ->select('equipos.nombre as club', 'organizaciones.nombre as organizacion')
                                        ->get();

                                    return [
                                        'id' => $jugador->id,
                                        'name' => $jugador->name,
                                        'email' => $jugador->email,
                                        'gamertag' => $jugador->gamertag,
                                        'posicion' => $jugador->posicion,
                                        'role' => $jugador->role,
                                        'contratos' => $contratos
                                    ];
                                });

        return response()->json($jugadoresLibres);
    }

    public function store(UserRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // 🔥 Fallback preventivo si no suben foto al crearlo
        if (empty($validated['foto'])) {
            $validated['foto'] = 'images/users/default-user.png';
        }

        // Si no tienes configurado 'password' => 'hashed' en tu modelo, actívalo aquí:
        // $validated['password'] = bcrypt($validated['password']);

        $user = User::create($validated);

        // 🔥 Activar la verificación del correo por defecto cuando es creado por Admin/Organizador
        $user->email_verified_at = now();
        $user->save();

        return response()->json(new UserResource($user));
    }

    public function show($user): JsonResponse
    {
        if (!$user instanceof User || !$user->exists) {
            $userId = request()->route('usuario') ?? request()->route('user');
            $user = User::findOrFail($userId);
        }

        if ($user->role === 'organizador') {
            $user->load('organizacion');
        }

        // 1. Contratos Activos actual
        $contratosActivos = DB::table('organizacion_equipo_usuario')
            ->join('equipos', 'organizacion_equipo_usuario.equipo_id', '=', 'equipos.id')
            ->join('organizaciones', 'organizacion_equipo_usuario.organizacion_id', '=', 'organizaciones.id')
            ->where('organizacion_equipo_usuario.user_id', $user->id)
            ->where('organizacion_equipo_usuario.estado_fichaje', 'activo')
            ->select('equipos.id as equipo_id', 'equipos.nombre as equipo_nombre', 'equipos.logo as equipo_logo', 'equipos.banner as equipo_banner', 'organizaciones.id as organizacion_id', 'organizaciones.nombre as organizacion_nombre', 'organizacion_equipo_usuario.dorsal', 'organizacion_equipo_usuario.posicion_bloque')
            ->get();

        $contratoActivo = $contratosActivos->first();

        // 2. Historial de Traspasos Aprobados
        $traspasos = \App\Models\SolicitudFichaje::with([
            'equipo:id,nombre,logo,abreviatura',
            'equipoOrigen:id,nombre,logo,abreviatura',
            'organizaciones:id,nombre,logo' // Note: change relation name back to organization if needed, wait, let's keep original
        ]);
        // Wait, let's check what the original relation was. Original was:
        // 'equipo:id,nombre,logo,abreviatura', 'equipoOrigen:id,nombre,logo,abreviatura', 'organizacion:id,nombre,logo'
        // Let's keep it exact:
        $traspasos = \App\Models\SolicitudFichaje::with([
            'equipo:id,nombre,logo,abreviatura',
            'equipoOrigen:id,nombre,logo,abreviatura',
            'organizacion:id,nombre,logo'
        ])
        ->where('user_id', $user->id)
        ->where('estado', 'aprobado')
        ->orderBy('updated_at', 'desc')
        ->get();

        $orgId = request()->query('organizacion_id', 'todas');
        $compId = request()->query('competencia_id', 'todas');

        // 3. Estadísticas Acumuladas
        $queryStats = DB::table('estadisticas_jugadores')
            ->where('estadisticas_jugadores.jugador_id', $user->id);

        if ($orgId && $orgId !== 'todas') {
            $queryStats->join('competencias as c_stats', 'estadisticas_jugadores.competencia_id', '=', 'c_stats.id')
                ->join('temporadas as t_stats', 'c_stats.temporada_id', '=', 't_stats.id')
                ->where('t_stats.organizacion_id', $orgId);
        }
        if ($compId && $compId !== 'todas') {
            $queryStats->where('estadisticas_jugadores.competencia_id', $compId);
        }

        $statsAcumuladas = $queryStats->select(
            DB::raw('COUNT(estadisticas_jugadores.id) as partidos_jugados'),
            DB::raw('SUM(estadisticas_jugadores.goles) as total_goles'),
            DB::raw('SUM(estadisticas_jugadores.asistencias) as total_asistencias'),
            DB::raw('AVG(estadisticas_jugadores.valoracion) as promedio_valoracion'),
            DB::raw('SUM(estadisticas_jugadores.tarjetas_rojas) as total_rojas'),
            DB::raw('SUM(estadisticas_jugadores.jugador_partido) as total_mvp'),
            DB::raw('SUM(estadisticas_jugadores.entradas_exitosas) as total_entradas'),
            DB::raw('AVG(estadisticas_jugadores.tasa_exito_entradas) as avg_exito_entradas'),
            DB::raw('AVG(estadisticas_jugadores.precision_pases) as avg_precision_pases'),
            DB::raw('AVG(estadisticas_jugadores.precision_tiro) as avg_precision_tiro'),
            DB::raw('SUM(estadisticas_jugadores.atajadas) as total_atajadas'),
            DB::raw('SUM(estadisticas_jugadores.goles_recibidos) as total_goles_recibidos'),
            DB::raw('SUM(estadisticas_jugadores.tiros) as total_tiros'),
            DB::raw('SUM(estadisticas_jugadores.pases_intentados) as total_pases_intentados'),
            DB::raw('SUM(estadisticas_jugadores.pases_completados) as total_pases_completados'),
            DB::raw('SUM(estadisticas_jugadores.entradas_intentadas) as total_entradas_intentadas'),
            DB::raw('SUM(estadisticas_jugadores.atajadas_buena_colocacion) as total_atajadas_buena_colocacion'),
            DB::raw('SUM(estadisticas_jugadores.atajadas_volada) as total_atajadas_volada'),
            DB::raw('SUM(estadisticas_jugadores.atajadas_reflejos) as total_atajadas_reflejos'),
            DB::raw('SUM(estadisticas_jugadores.centros_cortados) as total_centros_cortados'),
            DB::raw('SUM(estadisticas_jugadores.despejes_punos) as total_despejes_punos'),
            DB::raw('SUM(estadisticas_jugadores.desvios) as total_desvios'),
            DB::raw('SUM(estadisticas_jugadores.segundos_jugados) as total_segundos_jugados'),
            DB::raw('SUM(estadisticas_jugadores.tiempo_juego_motor) as total_tiempo_juego_motor'),
            DB::raw('SUM(estadisticas_jugadores.tiempo_inactivo) as total_tiempo_inactivo'),
            DB::raw('SUM(estadisticas_jugadores.tiempo_real_lag) as total_tiempo_real_lag')
        )->first();

        // Calcular comparativas y rankings posicionales
        $pos = strtoupper($user->posicion ?: ($contratoActivo ? $contratoActivo->posicion_bloque : 'MC'));
        if (in_array($pos, ['POR', 'GK', 'PO', 'GOALKEEPER'])) {
            $posGroup = 'POR';
            $posLabels = ['POR', 'GK', 'PO', 'goalkeeper', 'por', 'gk', 'po'];
        } elseif (in_array($pos, ['DFC', 'DFI', 'DFD', 'CB', 'LB', 'RB', 'DF', 'DEF', 'LI', 'LD', 'DD', 'DI', 'DEFENDER'])) {
            $posGroup = 'DEF';
            $posLabels = ['DFC', 'DFI', 'DFD', 'CB', 'LB', 'RB', 'DF', 'DEF', 'LI', 'LD', 'DD', 'DI', 'defender', 'dfc', 'dfi', 'dfd', 'cb', 'lb', 'rb', 'df', 'def', 'li', 'ld', 'dd', 'di'];
        } elseif (in_array($pos, ['MC', 'MCO', 'MCD', 'MD', 'MI', 'CM', 'CAM', 'CDM', 'LM', 'RM', 'MED', 'MCI', 'MCR', 'MDD', 'MDI', 'MOD', 'MOI', 'MIDFIELDER'])) {
            $posGroup = 'MED';
            $posLabels = ['MC', 'MCO', 'MCD', 'MD', 'MI', 'CM', 'CAM', 'CDM', 'LM', 'RM', 'MED', 'MCI', 'MCR', 'MDD', 'MDI', 'MOD', 'MOI', 'midfielder', 'mc', 'mco', 'mcd', 'md', 'mi', 'cm', 'cam', 'cdm', 'lm', 'rm', 'med', 'mci', 'mcr', 'mdd', 'mdi', 'mod', 'moi'];
        } else {
            $posGroup = 'DEL';
            $posLabels = ['DEL', 'DC', 'EI', 'ED', 'ST', 'LW', 'RW', 'CF', 'forward', 'del', 'dc', 'ei', 'ed', 'st', 'lw', 'rw', 'cf'];
        }

        // 1. Ranking Global (Todos los competidores en la misma posición)
        $queryGlobal = DB::table('estadisticas_jugadores')
            ->whereIn('estadisticas_jugadores.posicion', $posLabels);

        if ($orgId && $orgId !== 'todas') {
            $queryGlobal->join('competencias as c_global', 'estadisticas_jugadores.competencia_id', '=', 'c_global.id')
                ->join('temporadas as t_global', 'c_global.temporada_id', '=', 't_global.id')
                ->where('t_global.organizacion_id', $orgId);
        }
        if ($compId && $compId !== 'todas') {
            $queryGlobal->where('estadisticas_jugadores.competencia_id', $compId);
        }

        $rankingGlobal = $queryGlobal->select('estadisticas_jugadores.jugador_id', DB::raw('AVG(estadisticas_jugadores.valoracion) as avg_val'))
            ->groupBy('estadisticas_jugadores.jugador_id')
            ->orderByDesc('avg_val')
            ->get();

        $rankGlobal = null;
        $totalGlobal = $rankingGlobal->count();
        foreach ($rankingGlobal as $index => $row) {
            if ($row->jugador_id == $user->id) {
                $rankGlobal = $index + 1;
                break;
            }
        }

        // 2. Ranking por Liga
        $rankLiga = null;
        $totalLiga = 0;
        $ligaFilterId = ($orgId && $orgId !== 'todas') ? $orgId : ($contratoActivo ? $contratoActivo->organizacion_id : null);

        if ($ligaFilterId) {
            $queryLiga = DB::table('estadisticas_jugadores')
                ->join('competencias as c_liga', 'estadisticas_jugadores.competencia_id', '=', 'c_liga.id')
                ->join('temporadas as t_liga', 'c_liga.temporada_id', '=', 't_liga.id')
                ->where('t_liga.organizacion_id', $ligaFilterId)
                ->whereIn('estadisticas_jugadores.posicion', $posLabels);

            if ($compId && $compId !== 'todas') {
                $queryLiga->where('estadisticas_jugadores.competencia_id', $compId);
            }

            $rankingLiga = $queryLiga->select('estadisticas_jugadores.jugador_id', DB::raw('AVG(estadisticas_jugadores.valoracion) as avg_val'))
                ->groupBy('estadisticas_jugadores.jugador_id')
                ->orderByDesc('avg_val')
                ->get();

            $totalLiga = $rankingLiga->count();
            foreach ($rankingLiga as $index => $row) {
                if ($row->jugador_id == $user->id) {
                    $rankLiga = $index + 1;
                    break;
                }
            }
        }

        // 3. Promedio global de la posición
        $queryAvg = DB::table('estadisticas_jugadores')
            ->whereIn('estadisticas_jugadores.posicion', $posLabels);

        if ($orgId && $orgId !== 'todas') {
            $queryAvg->join('competencias as c_avg', 'estadisticas_jugadores.competencia_id', '=', 'c_avg.id')
                ->join('temporadas as t_avg', 'c_avg.temporada_id', '=', 't_avg.id')
                ->where('t_avg.organizacion_id', $orgId);
        }
        if ($compId && $compId !== 'todas') {
            $queryAvg->where('estadisticas_jugadores.competencia_id', $compId);
        }

        $avgPosicion = $queryAvg->select(
            DB::raw('AVG(estadisticas_jugadores.valoracion) as avg_valoracion'),
            DB::raw('AVG(estadisticas_jugadores.goles) as avg_goles'),
            DB::raw('AVG(estadisticas_jugadores.asistencias) as avg_asistencias'),
            DB::raw('AVG(estadisticas_jugadores.entradas_exitosas) as avg_entradas'),
            DB::raw('AVG(estadisticas_jugadores.tasa_exito_entradas) as avg_exito_entradas'),
            DB::raw('AVG(estadisticas_jugadores.precision_pases) as avg_precision_pases'),
            DB::raw('AVG(estadisticas_jugadores.precision_tiro) as avg_precision_tiro'),
            DB::raw('AVG(estadisticas_jugadores.atajadas) as avg_atajadas'),
            DB::raw('AVG(estadisticas_jugadores.goles_recibidos) as avg_goles_recibidos')
        )->first();

        // 4. Líder de la posición
        $liderPosicionStats = null;
        if ($rankingGlobal->isNotEmpty()) {
            $liderId = $rankingGlobal->first()->jugador_id;
            $liderUser = DB::table('users')->where('id', $liderId)->select('name', 'foto')->first();

            $queryLider = DB::table('estadisticas_jugadores')
                ->where('estadisticas_jugadores.jugador_id', $liderId);

            if ($orgId && $orgId !== 'todas') {
                $queryLider->join('competencias as c_lider', 'estadisticas_jugadores.competencia_id', '=', 'c_lider.id')
                    ->join('temporadas as t_lider', 'c_lider.temporada_id', '=', 't_lider.id')
                    ->where('t_lider.organizacion_id', $orgId);
            }
            if ($compId && $compId !== 'todas') {
                $queryLider->where('estadisticas_jugadores.competencia_id', $compId);
            }

            $liderStats = $queryLider->select(
                DB::raw('AVG(estadisticas_jugadores.valoracion) as avg_valoracion'),
                DB::raw('SUM(estadisticas_jugadores.goles) as total_goles'),
                DB::raw('AVG(estadisticas_jugadores.goles) as avg_goles'),
                DB::raw('SUM(estadisticas_jugadores.asistencias) as total_asistencias'),
                DB::raw('AVG(estadisticas_jugadores.asistencias) as avg_asistencias'),
                DB::raw('SUM(estadisticas_jugadores.entradas_exitosas) as total_entradas'),
                DB::raw('AVG(estadisticas_jugadores.entradas_exitosas) as avg_entradas'),
                DB::raw('AVG(estadisticas_jugadores.tasa_exito_entradas) as avg_exito_entradas'),
                DB::raw('AVG(estadisticas_jugadores.precision_pases) as avg_precision_pases'),
                DB::raw('AVG(estadisticas_jugadores.precision_tiro) as avg_precision_tiro'),
                DB::raw('SUM(estadisticas_jugadores.atajadas) as total_atajadas'),
                DB::raw('AVG(estadisticas_jugadores.atajadas) as avg_atajadas'),
                DB::raw('SUM(estadisticas_jugadores.goles_recibidos) as total_goles_recibidos'),
                DB::raw('AVG(estadisticas_jugadores.goles_recibidos) as avg_goles_recibidos')
            )->first();

            $liderPosicionStats = [
                'name' => $liderUser->name ?? 'Líder',
                'foto' => $liderUser->foto ?? null,
                'avg_valoracion' => round($liderStats->avg_valoracion ?? 0, 2),
                'total_goles' => round($liderStats->total_goles ?? 0, 1),
                'avg_goles' => round($liderStats->avg_goles ?? 0, 2),
                'total_asistencias' => round($liderStats->total_asistencias ?? 0, 1),
                'avg_asistencias' => round($liderStats->avg_asistencias ?? 0, 2),
                'total_entradas' => round($liderStats->total_entradas ?? 0, 1),
                'avg_entradas' => round($liderStats->avg_entradas ?? 0, 2),
                'avg_exito_entradas' => round($liderStats->avg_exito_entradas ?? 0, 1),
                'avg_precision_pases' => round($liderStats->avg_precision_pases ?? 0, 1),
                'avg_precision_tiro' => round($liderStats->avg_precision_tiro ?? 0, 1),
                'total_atajadas' => round($liderStats->total_atajadas ?? 0, 1),
                'avg_atajadas' => round($liderStats->avg_atajadas ?? 0, 2),
                'total_goles_recibidos' => round($liderStats->total_goles_recibidos ?? 0, 1),
                'avg_goles_recibidos' => round($liderStats->avg_goles_recibidos ?? 0, 2),
            ];
        }

        // 5. Filtros Disponibles (Organizaciones y Competencias con estadísticas del jugador)
        $orgsConStats = DB::table('estadisticas_jugadores')
            ->join('competencias', 'estadisticas_jugadores.competencia_id', '=', 'competencias.id')
            ->join('temporadas', 'competencias.temporada_id', '=', 'temporadas.id')
            ->join('organizaciones', 'temporadas.organizacion_id', '=', 'organizaciones.id')
            ->where('estadisticas_jugadores.jugador_id', $user->id)
            ->select('organizaciones.id', 'organizaciones.nombre')
            ->distinct()
            ->get();

        $compsConStats = DB::table('estadisticas_jugadores')
            ->join('competencias', 'estadisticas_jugadores.competencia_id', '=', 'competencias.id')
            ->join('temporadas', 'competencias.temporada_id', '=', 'temporadas.id')
            ->where('estadisticas_jugadores.jugador_id', $user->id)
            ->select('competencias.id', 'competencias.nombre', 'temporadas.organizacion_id')
            ->distinct()
            ->get();

        // Competencias del jugador (Inscripciones de su equipo actual)
        $competencias = [];
        if ($contratoActivo) {
            $competencias = DB::table('competencias')
                ->join('competencia_equipo', 'competencias.id', '=', 'competencia_equipo.competencia_id')
                ->join('temporadas', 'competencias.temporada_id', '=', 'temporadas.id')
                ->join('organizaciones', 'temporadas.organizacion_id', '=', 'organizaciones.id')
                ->where('competencia_equipo.equipo_id', $contratoActivo->equipo_id)
                ->where('competencia_equipo.estado_inscripcion', 'aprobado')
                ->select(
                    'competencias.id', 
                    'competencias.nombre', 
                    'competencias.banner as logo', 
                    'competencias.formato', 
                    'competencias.plataforma', 
                    'organizaciones.nombre as organizacion_nombre'
                )
                ->get();
        }

        // Historial completo de torneos/competencias disputados con estadísticas detalladas por temporada
        $historialTorneos = DB::table('estadisticas_jugadores')
            ->join('competencias', 'estadisticas_jugadores.competencia_id', '=', 'competencias.id')
            ->join('temporadas', 'competencias.temporada_id', '=', 'temporadas.id')
            ->join('organizaciones', 'temporadas.organizacion_id', '=', 'organizaciones.id')
            ->join('equipos', 'estadisticas_jugadores.equipo_id', '=', 'equipos.id')
            ->where('estadisticas_jugadores.jugador_id', $user->id)
            ->select(
                'organizaciones.id as organizacion_id',
                'organizaciones.nombre as organizacion_nombre',
                'temporadas.id as temporada_id',
                'temporadas.nombre as temporada_nombre',
                'competencias.nombre as competencia_nombre',
                'competencias.banner as competencia_logo',
                'equipos.nombre as equipo_nombre',
                'equipos.logo as equipo_logo',
                DB::raw('COUNT(estadisticas_jugadores.id) as partidos_jugados'),
                DB::raw('SUM(estadisticas_jugadores.goles) as total_goles'),
                DB::raw('SUM(estadisticas_jugadores.asistencias) as total_asistencias'),
                DB::raw('AVG(estadisticas_jugadores.valoracion) as promedio_valoracion'),
                DB::raw('SUM(estadisticas_jugadores.jugador_partido) as total_mvp')
            )
            ->groupBy(
                'organizaciones.id',
                'organizaciones.nombre',
                'temporadas.id',
                'temporadas.nombre',
                'competencias.nombre',
                'competencias.banner',
                'equipos.nombre',
                'equipos.logo'
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
                    'equipo_nombre' => $row->equipo_nombre,
                    'equipo_logo' => $row->equipo_logo,
                    'partidos_jugados' => (int)$row->partidos_jugados,
                    'total_goles' => (int)$row->total_goles,
                    'total_asistencias' => (int)$row->total_asistencias,
                    'promedio_valoracion' => round((float)$row->promedio_valoracion, 2),
                    'total_mvp' => (int)$row->total_mvp
                ];
            });

        return response()->json([
            'user' => $user,
            'contrato_activo' => $contratoActivo,
            'contratos_activos' => $contratosActivos,
            'traspasos' => $traspasos,
            'competencias' => $competencias,
            'historial_torneos' => $historialTorneos,
            'filtros_disponibles' => [
                'organizaciones' => $orgsConStats,
                'competencias' => $compsConStats,
            ],
            'estadisticas' => [
                'partidos_jugados' => (int)($statsAcumuladas->partidos_jugados ?? 0),
                'total_goles' => (int)($statsAcumuladas->total_goles ?? 0),
                'total_asistencias' => (int)($statsAcumuladas->total_asistencias ?? 0),
                'promedio_valoracion' => round($statsAcumuladas->promedio_valoracion ?? 0, 2),
                'total_rojas' => (int)($statsAcumuladas->total_rojas ?? 0),
                'total_mvp' => (int)($statsAcumuladas->total_mvp ?? 0),
                // Estadísticas detalladas avanzadas:
                'total_entradas' => (int)($statsAcumuladas->total_entradas ?? 0),
                'avg_exito_entradas' => round($statsAcumuladas->avg_exito_entradas ?? 0, 1),
                'avg_precision_pases' => round($statsAcumuladas->avg_precision_pases ?? 0, 1),
                'avg_precision_tiro' => round($statsAcumuladas->avg_precision_tiro ?? 0, 1),
                'total_atajadas' => (int)($statsAcumuladas->total_atajadas ?? 0),
                'total_goles_recibidos' => (int)($statsAcumuladas->total_goles_recibidos ?? 0),
                'total_tiros' => (int)($statsAcumuladas->total_tiros ?? 0),
                'total_pases_intentados' => (int)($statsAcumuladas->total_pases_intentados ?? 0),
                'total_pases_completados' => (int)($statsAcumuladas->total_pases_completados ?? 0),
                'total_entradas_intentadas' => (int)($statsAcumuladas->total_entradas_intentadas ?? 0),
                'total_atajadas_buena_colocacion' => (int)($statsAcumuladas->total_atajadas_buena_colocacion ?? 0),
                'total_atajadas_volada' => (int)($statsAcumuladas->total_atajadas_volada ?? 0),
                'total_atajadas_reflejos' => (int)($statsAcumuladas->total_atajadas_reflejos ?? 0),
                'total_centros_cortados' => (int)($statsAcumuladas->total_centros_cortados ?? 0),
                'total_despejes_punos' => (int)($statsAcumuladas->total_despejes_punos ?? 0),
                'total_desvios' => (int)($statsAcumuladas->total_desvios ?? 0),
                'total_segundos_jugados' => (int)($statsAcumuladas->total_segundos_jugados ?? 0),
                'total_tiempo_juego_motor' => (int)($statsAcumuladas->total_tiempo_juego_motor ?? 0),
                'total_tiempo_inactivo' => (int)($statsAcumuladas->total_tiempo_inactivo ?? 0),
                'total_tiempo_real_lag' => (int)($statsAcumuladas->total_tiempo_real_lag ?? 0),
            ],
            'comparativas' => [
                'posicion_grupo' => $posGroup,
                'rank_global' => $rankGlobal,
                'total_global' => $totalGlobal,
                'rank_liga' => $rankLiga,
                'total_liga' => $totalLiga,
                'promedio_posicion' => [
                    'avg_valoracion' => round($avgPosicion->avg_valoracion ?? 0, 2),
                    'avg_goles' => round($avgPosicion->avg_goles ?? 0, 2),
                    'avg_asistencias' => round($avgPosicion->avg_asistencias ?? 0, 2),
                    'avg_entradas' => round($avgPosicion->avg_entradas ?? 0, 2),
                    'avg_exito_entradas' => round($avgPosicion->avg_exito_entradas ?? 0, 1),
                    'avg_precision_pases' => round($avgPosicion->avg_precision_pases ?? 0, 1),
                    'avg_precision_tiro' => round($avgPosicion->avg_precision_tiro ?? 0, 1),
                    'avg_atajadas' => round($avgPosicion->avg_atajadas ?? 0, 2),
                    'avg_goles_recibidos' => round($avgPosicion->avg_goles_recibidos ?? 0, 2),
                ],
                'lider_posicion' => $liderPosicionStats
            ]
        ]);
    }

    public function update(UserRequest $request, $user): JsonResponse
    {
        if (!$user instanceof User || !$user->exists) {
            $userId = $request->route('usuario') ?? $request->route('user');
            $user = User::findOrFail($userId);
        }

        $validated = $request->validated();

        // Conservar únicamente los campos que realmente se enviaron en la petición
        $validated = array_intersect_key($validated, $request->all());

        // 🔥 Fallbacks preventivos para campos que no admiten NULL en base de datos
        if (array_key_exists('foto', $validated) && empty($validated['foto'])) {
            $validated['foto'] = 'images/users/default-user.png';
        }
        if (array_key_exists('plataforma', $validated) && empty($validated['plataforma'])) {
            $validated['plataforma'] = 'crossplay';
        }

        // Delete old photo file if updated
        if (array_key_exists('foto', $validated) && $validated['foto'] !== $user->foto) {
            $oldFoto = $user->foto;
            if ($oldFoto && str_contains($oldFoto, 'uploads/') && !str_starts_with($oldFoto, 'http')) {
                $fullPath = public_path(ltrim($oldFoto, '/'));
                if (file_exists($fullPath) && is_file($fullPath)) {
                    @unlink($fullPath);
                }
            }
        }

        // 🔥 CRÍTICO: Si el frontend manda la contraseña vacía (significa que no quiere cambiarla)
        // La removemos del array para no sobrescribir el password con NULL.
        if (empty($validated['password'])) {
            unset($validated['password']);
        }
        // else { $validated['password'] = bcrypt($validated['password']); } // Si no usas casts en el modelo.

        $user->update($validated);

        if ($user->role === 'organizador') {
            $user->load('organizacion');
        }

        return response()->json($user);
    }

    public function destroy($user): Response|JsonResponse
    {
        if (!$user instanceof User || !$user->exists) {
            $userId = request()->route('usuario') ?? request()->route('user');
            $user = User::findOrFail($userId);
        }

        // Verificar si el usuario es dueño de una organización activa
        if ($user->organizacion()->exists()) {
            return response()->json([
                'message' => 'No es posible eliminar a este usuario porque es propietario de una organización activa. Debes reasignar o eliminar la organización primero.'
            ], 422);
        }

        // Verificar si el usuario es capitán de algún equipo UT
        if ($user->equiposUtCapitan()->exists()) {
            return response()->json([
                'message' => 'No es posible eliminar a este usuario porque es capitán de un equipo de Ultimate Team. Debes reasignar la capitanía del equipo antes de proceder.'
            ], 422);
        }

        // Esto ejecutará un Soft Delete automático si configuraste el trait SoftDeletes en el modelo User
        $user->delete();

        return response()->noContent();
    }

    /**
     * Obtener listado dinámico matemático del Team of the Week (TOTW) y del Season (TOTS)
     */
    public function totwTots(Request $request): JsonResponse
    {
        $orgId  = $request->query('organizacion_id', 'todas');
        $tempId = $request->query('temporada_id', 'todas');
        $compId = $request->query('competencia_id', 'todas');
        $tab    = $request->query('active_tab', 'totw');

        // Cache por 5 minutos — el TOTW cambia por jornada, raramente más rápido que eso
        $cacheKey = "totw_tots_{$tab}_org{$orgId}_temp{$tempId}_comp{$compId}";
        $selected = Cache::remember($cacheKey, now()->addMinutes(5), function () use ($orgId, $tempId, $compId, $tab) {

        $query = DB::table('estadisticas_jugadores')
            ->join('users', 'estadisticas_jugadores.jugador_id', '=', 'users.id')
            ->join('equipos', 'estadisticas_jugadores.equipo_id', '=', 'equipos.id')
            ->join('competencias', 'estadisticas_jugadores.competencia_id', '=', 'competencias.id')
            ->join('temporadas', 'competencias.temporada_id', '=', 'temporadas.id');

        if ($orgId && $orgId !== 'todas') {
            $query->where('temporadas.organizacion_id', $orgId);
        }
        if ($tempId && $tempId !== 'todas') {
            $query->where('competencias.temporada_id', $tempId);
        }
        if ($compId && $compId !== 'todas') {
            $query->where('estadisticas_jugadores.competencia_id', $compId);
        }

        // Si es TOTW (Team of the Week), filtramos por los partidos de la última jornada
        if ($tab === 'totw') {
            $ultimaJornada = DB::table('partidos')
                ->whereNotNull('goles_local')
                ->max('jornada');
            if ($ultimaJornada) {
                $partidosIds = DB::table('partidos')
                    ->where('jornada', $ultimaJornada)
                    ->pluck('id');
                $query->whereIn('estadisticas_jugadores.partido_id', $partidosIds);
            }
        }

        // Hacemos el agregado por jugador
        $players = $query->select(
            'users.id',
            'users.name',
            'users.foto',
            'users.nacionalidad',
            'users.gamertag',
            'estadisticas_jugadores.posicion',
            'equipos.nombre as equipo_nombre',
            'equipos.logo as clubBadge',
            DB::raw('AVG(estadisticas_jugadores.valoracion) as promedio_valoracion'),
            DB::raw('SUM(estadisticas_jugadores.goles) as total_goles'),
            DB::raw('SUM(estadisticas_jugadores.asistencias) as total_asistencias'),
            DB::raw('SUM(estadisticas_jugadores.entradas_exitosas) as total_entradas'),
            DB::raw('AVG(estadisticas_jugadores.tasa_exito_entradas) as avg_exito_entradas'),
            DB::raw('AVG(estadisticas_jugadores.precision_pases) as avg_precision_pases'),
            DB::raw('AVG(estadisticas_jugadores.precision_tiro) as avg_precision_tiro'),
            DB::raw('SUM(estadisticas_jugadores.atajadas) as total_atajadas'),
            DB::raw('SUM(estadisticas_jugadores.goles_recibidos) as total_goles_recibidos'),
            DB::raw('SUM(estadisticas_jugadores.tiros) as total_tiros'),
            DB::raw('SUM(estadisticas_jugadores.pases_completados) as total_pases_completados'),
            DB::raw('SUM(estadisticas_jugadores.pases_intentados) as total_pases_intentados'),
            DB::raw('SUM(CASE WHEN estadisticas_jugadores.goles_recibidos = 0 THEN 1 ELSE 0 END) as arcos_imbatidos'),
            DB::raw('SUM(estadisticas_jugadores.tarjetas_rojas) as total_rojas')
        )
        ->groupBy('users.id', 'users.name', 'users.foto', 'users.nacionalidad', 'users.gamertag', 'estadisticas_jugadores.posicion', 'equipos.nombre', 'equipos.logo')
        ->get();

        // Agrupar por grandes posiciones (4-3-3): POR (1), DEF (4), MED (3), DEL (3)
        $porList = [];
        $defList = [];
        $medList = [];
        $delList = [];

        foreach ($players as $p) {
            $pos = strtoupper($p->posicion);
            $prom = (float)$p->promedio_valoracion;
            $goles = (int)$p->total_goles;
            $asist = (int)$p->total_asistencias;
            $entradas = (int)$p->total_entradas;
            $exitoEntradas = (float)$p->avg_exito_entradas;
            $precPases = (float)$p->avg_precision_pases;
            $precTiro = (float)$p->avg_precision_tiro;
            $atajadas = (int)$p->total_atajadas;
            $recibidos = (int)$p->total_goles_recibidos;
            $rojas = (int)$p->total_rojas;

            if ($pos === 'POR' || $pos === 'GK' || $pos === 'GOALKEEPER') {
                $p->score = ($prom * 10) + ($atajadas * 4) - ($recibidos * 3);
                $porList[] = $p;
            } elseif (in_array($pos, ['DFC', 'DFI', 'DFD', 'CB', 'LB', 'RB', 'DEFENDER'])) {
                $p->score = ($prom * 8) + ($entradas * 5) + ($exitoEntradas * 0.15) - ($rojas * 5);
                $defList[] = $p;
            } elseif (in_array($pos, ['MC', 'MCO', 'MCD', 'MD', 'MI', 'CM', 'CAM', 'CDM', 'LM', 'RM', 'MIDFIELDER'])) {
                $p->score = ($prom * 6) + ($asist * 8) + ($precPases * 0.2);
                $medList[] = $p;
            } else {
                // Delanteros y otros atacantes
                $p->score = ($prom * 5) + ($goles * 7) + ($asist * 4);
                $delList[] = $p;
            }
        }

        // Ordenar cada lista por score descendente
        usort($porList, function($a, $b) { return $b->score <=> $a->score; });
        usort($defList, function($a, $b) { return $b->score <=> $a->score; });
        usort($medList, function($a, $b) { return $b->score <=> $a->score; });
        usort($delList, function($a, $b) { return $b->score <=> $a->score; });

        // Selección final de 11 jugadores
        $selected = [];

        // 1. Portero (1)
        if (!empty($porList)) {
            $selected[] = array_merge((array)$porList[0], ['positionGrid' => 'top-[90%] left-[50%]', 'pos' => 'POR', 'lineGroup' => 'gk']);
        } else {
            $selected[] = ['id' => 999, 'name' => 'Portero Ideal', 'foto' => null, 'gamertag' => 'GK', 'pos' => 'POR', 'equipo_nombre' => 'Torneos Pro FC', 'promedio_valoracion' => 8.5, 'positionGrid' => 'top-[90%] left-[50%]', 'lineGroup' => 'gk'];
        }

        // 2. Defensores (4)
        $defCoords = [
            'top-[75%] left-[20%]',
            'top-[75%] left-[40%]',
            'top-[75%] left-[60%]',
            'top-[75%] left-[80%]'
        ];
        for ($i = 0; $i < 4; $i++) {
            if (isset($defList[$i])) {
                $dbPos = strtoupper($defList[$i]->posicion);
                $finalPos = in_array($dbPos, ['DFC', 'CB', 'LI', 'LB', 'LD', 'RB', 'DFI', 'DFD', 'DF']) ? $dbPos : 'DFC';
                $selected[] = array_merge((array)$defList[$i], ['positionGrid' => $defCoords[$i], 'pos' => $finalPos, 'lineGroup' => 'def']);
            } else {
                $selected[] = ['id' => 900 + $i, 'name' => 'Defensa Ideal', 'foto' => null, 'gamertag' => 'DF', 'pos' => 'DFC', 'equipo_nombre' => 'Torneos Pro FC', 'promedio_valoracion' => 8.2, 'positionGrid' => $defCoords[$i], 'lineGroup' => 'def'];
            }
        }

        // 3. Mediocampistas (3)
        $medCoords = [
            'top-[50%] left-[25%]',
            'top-[57%] left-[50%]',
            'top-[50%] left-[75%]'
        ];
        for ($i = 0; $i < 3; $i++) {
            if (isset($medList[$i])) {
                $dbPos = strtoupper($medList[$i]->posicion);
                $finalPos = in_array($dbPos, ['MC', 'CM', 'MCD', 'CDM', 'MCO', 'CAM', 'MD', 'RM', 'MI', 'LM']) ? $dbPos : 'MC';
                $selected[] = array_merge((array)$medList[$i], ['positionGrid' => $medCoords[$i], 'pos' => $finalPos, 'lineGroup' => 'mid']);
            } else {
                $selected[] = ['id' => 800 + $i, 'name' => 'Medio Ideal', 'foto' => null, 'gamertag' => 'MC', 'pos' => 'MC', 'equipo_nombre' => 'Torneos Pro FC', 'promedio_valoracion' => 8.4, 'positionGrid' => $medCoords[$i], 'lineGroup' => 'mid'];
            }
        }

        // 4. Delanteros (3)
        $delCoords = [
            'top-[20%] left-[25%]',
            'top-[15%] left-[50%]',
            'top-[20%] left-[75%]'
        ];
        for ($i = 0; $i < 3; $i++) {
            if (isset($delList[$i])) {
                $dbPos = strtoupper($delList[$i]->posicion);
                $finalPos = in_array($dbPos, ['DEL', 'DC', 'ST', 'EI', 'LW', 'ED', 'RW', 'CF']) ? $dbPos : 'DC';
                $selected[] = array_merge((array)$delList[$i], ['positionGrid' => $delCoords[$i], 'pos' => $finalPos, 'lineGroup' => 'del']);
            } else {
                $selected[] = ['id' => 700 + $i, 'name' => 'Delantero Ideal', 'foto' => null, 'gamertag' => 'DEL', 'pos' => 'DC', 'equipo_nombre' => 'Torneos Pro FC', 'promedio_valoracion' => 8.6, 'positionGrid' => $delCoords[$i], 'lineGroup' => 'del'];
            }
        }

        // Mapear los ratings a un número entero simulado entre 85 y 95 basados en el score
        $selected = array_map(function($p) {
            $promedio = (float)($p['promedio_valoracion'] ?? 8.0);
            $p['rating'] = (int)round(80 + ($promedio * 1.8));
            return $p;
        }, $selected);

        return $selected;
        }); // fin Cache::remember

        return response()->json($selected);
    }

    /**
     * Obtener estadísticas matemáticas acumuladas del sistema para infografía
     */
    public function infografia(Request $request): JsonResponse
    {
        $orgId = $request->query('organizacion_id');
        $tempId = $request->query('temporada_id');
        $compId = $request->query('competencia_id');
        $isUt = $request->query('is_ut') === 'true';
        $tipoUt = $request->query('tipo_ut');

        if ($isUt) {
            $queryPartidos = DB::table('partidos_ut')
                ->join('competencias_ut', 'partidos_ut.competencia_ut_id', '=', 'competencias_ut.id')
                ->join('temporadas', 'competencias_ut.temporada_id', '=', 'temporadas.id');
            if ($tipoUt && $tipoUt !== 'todas') {
                $queryPartidos->where('competencias_ut.tipo', $tipoUt);
            }
        } else {
            $queryPartidos = DB::table('partidos')
                ->join('competencias', 'partidos.competencia_id', '=', 'competencias.id')
                ->join('temporadas', 'competencias.temporada_id', '=', 'temporadas.id');
        }

        if ($orgId && $orgId !== 'todas') {
            $queryPartidos->where('temporadas.organizacion_id', $orgId);
        }
        if ($tempId && $tempId !== 'todas') {
            $queryPartidos->where(($isUt ? 'competencias_ut' : 'competencias') . '.temporada_id', $tempId);
        }
        if ($compId && $compId !== 'todas') {
            $queryPartidos->where('partidos' . ($isUt ? '_ut' : '') . '.' . ($isUt ? 'competencia_ut_id' : 'competencia_id'), $compId);
        }

        // Clonamos para diferentes consultas
        $partidosFinalizados = (clone $queryPartidos)->whereNotNull('goles_local')->whereNotNull('goles_visitante')->get();
        $totalPartidos = $partidosFinalizados->count();

        $golesTotales = 0;
        $victoriasLocal = 0;
        $empates = 0;
        $victoriasVisitante = 0;

        foreach ($partidosFinalizados as $p) {
            $golesLocal = (int)$p->goles_local;
            $golesVisitante = (int)$p->goles_visitante;
            $golesTotales += ($golesLocal + $golesVisitante);

            if ($golesLocal > $golesVisitante) {
                $victoriasLocal++;
            } elseif ($golesLocal < $golesVisitante) {
                $victoriasVisitante++;
            } else {
                $empates++;
            }
        }

        $promedioGoles = $totalPartidos > 0 ? round($golesTotales / $totalPartidos, 2) : 0;

        $porcentajeLocal = $totalPartidos > 0 ? round(($victoriasLocal / $totalPartidos) * 100, 1) : 0;
        $porcentajeEmpate = $totalPartidos > 0 ? round(($empates / $totalPartidos) * 100, 1) : 0;
        $porcentajeVisita = $totalPartidos > 0 ? round(($victoriasVisitante / $totalPartidos) * 100, 1) : 0;

        // Base query para estadísticas de jugadores con alias
        if ($isUt) {
            $queryJugadoresBase = DB::table('estadisticas_jugadores_ut as ej')
                ->join('users as u', 'ej.jugador_id', '=', 'u.id')
                ->join('equipos_ut as eq', 'ej.equipo_ut_id', '=', 'eq.id')
                ->join('competencias_ut as comp', 'ej.competencia_ut_id', '=', 'comp.id')
                ->join('temporadas as temp', 'comp.temporada_id', '=', 'temp.id');
            if ($tipoUt && $tipoUt !== 'todas') {
                $queryJugadoresBase->where('comp.tipo', $tipoUt);
            }
        } else {
            $queryJugadoresBase = DB::table('estadisticas_jugadores as ej')
                ->join('users as u', 'ej.jugador_id', '=', 'u.id')
                ->join('equipos as eq', 'ej.equipo_id', '=', 'eq.id')
                ->join('competencias as comp', 'ej.competencia_id', '=', 'comp.id')
                ->join('temporadas as temp', 'comp.temporada_id', '=', 'temp.id');
        }

        if ($orgId && $orgId !== 'todas') {
            $queryJugadoresBase->where('temp.organizacion_id', $orgId);
        }
        if ($tempId && $tempId !== 'todas') {
            $queryJugadoresBase->where('comp.temporada_id', $tempId);
        }
        if ($compId && $compId !== 'todas') {
            $queryJugadoresBase->where('ej.' . ($isUt ? 'competencia_ut_id' : 'competencia_id'), $compId);
        }

        // 1. Goleadores
        $goleadores = (clone $queryJugadoresBase)->select(
            'u.id',
            'u.name',
            'u.foto',
            'eq.nombre as equipo_nombre',
            DB::raw('SUM(ej.goles) as total_goles'),
            DB::raw('SUM(ej.asistencias) as total_asistencias'),
            DB::raw('AVG(ej.valoracion) as avg_valoracion'),
            DB::raw('COUNT(ej.id) as partidos_jugados'),
            DB::raw('SUM(ej.jugador_partido) as total_mvp'),
            DB::raw($isUt ? '0 as avg_precision_tiro' : 'AVG(ej.precision_tiro) as avg_precision_tiro')
        )
        ->groupBy('u.id', 'u.name', 'u.foto', 'eq.nombre')
        ->orderByDesc('total_goles')
        ->take(25)
        ->get();

        // 2. Asistentes
        $asistentes = (clone $queryJugadoresBase)->select(
            'u.id',
            'u.name',
            'u.foto',
            'eq.nombre as equipo_nombre',
            DB::raw('SUM(ej.asistencias) as total_asistencias')
        )
        ->groupBy('u.id', 'u.name', 'u.foto', 'eq.nombre')
        ->orderByDesc('total_asistencias')
        ->take(25)
        ->get();

        // 3. Prestigio de Delanteros
        $prestigioDelanteros = (clone $queryJugadoresBase)
            ->whereIn(DB::raw('UPPER(ej.posicion)'), ['DEL', 'DC', 'EI', 'ED', 'ST', 'LW', 'RW', 'CF', 'FORWARD'])
            ->select(
                'u.id',
                'u.name',
                'u.foto',
                'eq.nombre as equipo_nombre',
                DB::raw('SUM(ej.goles) as total_goles'),
                DB::raw('SUM(ej.asistencias) as total_asistencias'),
                DB::raw($isUt ? '0 as avg_precision_tiro' : 'AVG(ej.precision_tiro) as avg_precision_tiro'),
                DB::raw('AVG(ej.precision_pases) as avg_precision_pases'),
                DB::raw('AVG(ej.valoracion) as avg_valoracion'),
                DB::raw('COUNT(ej.id) as partidos_jugados'),
                DB::raw('SUM(ej.jugador_partido) as total_mvp'),
                DB::raw('ROUND(AVG(ej.valoracion) * 5 + SUM(ej.goles) * 7 + SUM(ej.asistencias) * 4, 1) as score')
            )
            ->groupBy('u.id', 'u.name', 'u.foto', 'eq.nombre')
            ->orderByDesc('score')
            ->take(25)
            ->get();

        // 4. Prestigio de Mediocampistas
        $prestigioMedios = (clone $queryJugadoresBase)
            ->whereIn(DB::raw('UPPER(ej.posicion)'), ['MC', 'MCO', 'MCD', 'MD', 'MI', 'CM', 'CAM', 'CDM', 'LM', 'RM', 'MIDFIELDER'])
            ->select(
                'u.id',
                'u.name',
                'u.foto',
                'eq.nombre as equipo_nombre',
                DB::raw('SUM(ej.goles) as total_goles'),
                DB::raw('SUM(ej.asistencias) as total_asistencias'),
                DB::raw('AVG(ej.precision_pases) as avg_precision_pases'),
                DB::raw($isUt ? '0 as avg_precision_tiro' : 'AVG(ej.precision_tiro) as avg_precision_tiro'),
                DB::raw('AVG(ej.valoracion) as avg_valoracion'),
                DB::raw('COUNT(ej.id) as partidos_jugados'),
                DB::raw('SUM(ej.jugador_partido) as total_mvp'),
                DB::raw('ROUND(AVG(ej.valoracion) * 6 + SUM(ej.asistencias) * 8 + AVG(ej.precision_pases) * 0.2, 1) as score')
            )
            ->groupBy('u.id', 'u.name', 'u.foto', 'eq.nombre')
            ->orderByDesc('score')
            ->take(25)
            ->get();

        // 5. Prestigio de Defensores
        $prestigioDefensas = (clone $queryJugadoresBase)
            ->whereIn(DB::raw('UPPER(ej.posicion)'), ['DFC', 'DFI', 'DFD', 'CB', 'LB', 'RB', 'DEFENDER'])
            ->select(
                'u.id',
                'u.name',
                'u.foto',
                'eq.nombre as equipo_nombre',
                DB::raw('SUM(ej.goles) as total_goles'),
                DB::raw('SUM(ej.asistencias) as total_asistencias'),
                DB::raw('SUM(ej.entradas_exitosas) as total_entradas'),
                DB::raw('AVG(ej.tasa_exito_entradas) as avg_exito_entradas'),
                DB::raw('AVG(ej.precision_pases) as avg_precision_pases'),
                DB::raw('AVG(ej.valoracion) as avg_valoracion'),
                DB::raw('COUNT(ej.id) as partidos_jugados'),
                DB::raw('SUM(ej.jugador_partido) as total_mvp'),
                DB::raw('ROUND(AVG(ej.valoracion) * 8 + SUM(ej.entradas_exitosas) * 5 + AVG(ej.tasa_exito_entradas) * 0.15 - SUM(ej.tarjetas_rojas) * 5, 1) as score')
            )
            ->groupBy('u.id', 'u.name', 'u.foto', 'eq.nombre')
            ->orderByDesc('score')
            ->take(25)
            ->get();

        // 6. Prestigio de Arqueros
        $atajadasSum = $isUt ? '0' : 'SUM(ej.atajadas)';
        $golesRecibidosSum = $isUt ? '0' : 'SUM(ej.goles_recibidos)';
        $prestigioPorteros = (clone $queryJugadoresBase)
            ->whereIn(DB::raw('UPPER(ej.posicion)'), ['POR', 'GK', 'GOALKEEPER'])
            ->select(
                'u.id',
                'u.name',
                'u.foto',
                'eq.nombre as equipo_nombre',
                DB::raw('SUM(ej.goles) as total_goles'),
                DB::raw('SUM(ej.asistencias) as total_asistencias'),
                DB::raw($isUt ? '0 as total_atajadas' : 'SUM(ej.atajadas) as total_atajadas'),
                DB::raw($isUt ? '0 as total_goles_recibidos' : 'SUM(ej.goles_recibidos) as total_goles_recibidos'),
                DB::raw('AVG(ej.precision_pases) as avg_precision_pases'),
                DB::raw('AVG(ej.valoracion) as avg_valoracion'),
                DB::raw('COUNT(ej.id) as partidos_jugados'),
                DB::raw('SUM(ej.jugador_partido) as total_mvp'),
                DB::raw("ROUND(AVG(ej.valoracion) * 10 + ({$atajadasSum}) * 4 - ({$golesRecibidosSum}) * 3, 1) as score")
            )
            ->groupBy('u.id', 'u.name', 'u.foto', 'eq.nombre')
            ->orderByDesc('score')
            ->take(25)
            ->get();

        // Base query para estadísticas de equipos con alias
        if ($isUt) {
            $queryEquiposBase = DB::table('estadisticas_equipos_ut as eeq')
                ->join('equipos_ut as eq', 'eeq.equipo_ut_id', '=', 'eq.id')
                ->join('competencias_ut as comp', 'eeq.competencia_ut_id', '=', 'comp.id')
                ->join('temporadas as temp', 'comp.temporada_id', '=', 'temp.id');
            if ($tipoUt && $tipoUt !== 'todas') {
                $queryEquiposBase->where('comp.tipo', $tipoUt);
            }
        } else {
            $queryEquiposBase = DB::table('estadisticas_equipos as eeq')
                ->join('equipos as eq', 'eeq.equipo_id', '=', 'eq.id')
                ->join('competencias as comp', 'eeq.competencia_id', '=', 'comp.id')
                ->join('temporadas as temp', 'comp.temporada_id', '=', 'temp.id');
        }

        if ($orgId && $orgId !== 'todas') {
            $queryEquiposBase->where('temp.organizacion_id', $orgId);
        }
        if ($tempId && $tempId !== 'todas') {
            $queryEquiposBase->where('comp.temporada_id', $tempId);
        }
        if ($compId && $compId !== 'todas') {
            $queryEquiposBase->where('eeq.' . ($isUt ? 'competencia_ut_id' : 'competencia_id'), $compId);
        }

        // Promedio global de pases y entradas de equipo
        $promediosEquipo = (clone $queryEquiposBase)->select(
            DB::raw('AVG(eeq.precision_pases) as avg_pases'),
            DB::raw('AVG(eeq.tasa_exito_entradas) as avg_entradas')
        )->first();

        // 1. Equipos con Más Goles Favor
        $equiposGoleadores = (clone $queryEquiposBase)->select(
            'eq.id',
            'eq.nombre',
            'eq.logo',
            DB::raw('SUM(eeq.goles_favor) as total_goles_favor')
        )
        ->groupBy('eq.id', 'eq.nombre', 'eq.logo')
        ->orderByDesc('total_goles_favor')
        ->take(25)
        ->get();

        // 2. Equipos con Mayor Precisión de Pases
        $equiposPases = (clone $queryEquiposBase)->select(
            'eq.id',
            'eq.nombre',
            'eq.logo',
            DB::raw('ROUND(AVG(eeq.precision_pases), 1) as avg_precision_pases')
        )
        ->groupBy('eq.id', 'eq.nombre', 'eq.logo')
        ->orderByDesc('avg_precision_pases')
        ->take(25)
        ->get();

        // 3. Equipos con Mejor Defensa
        $equiposDefensa = (clone $queryEquiposBase)->select(
            'eq.id',
            'eq.nombre',
            'eq.logo',
            DB::raw('SUM(eeq.goles_en_contra) as total_goles_recibidos')
        )
        ->groupBy('eq.id', 'eq.nombre', 'eq.logo')
        ->orderBy('total_goles_recibidos', 'asc')
        ->take(25)
        ->get();

        // Jornada con más goles
        $jornadaGoles = (clone $queryPartidos)
            ->whereNotNull('goles_local')
            ->select('jornada', DB::raw('SUM(goles_local + goles_visitante) as total_goles'))
            ->groupBy('jornada')
            ->orderByDesc('total_goles')
            ->first();

        $todosJugadores = null;
        $todosEquipos = null;

        if ($request->query('all') === 'true') {
            $todosJugadores = (clone $queryJugadoresBase)->select(
                'u.id',
                'u.name',
                'u.foto',
                'eq.nombre as equipo_nombre',
                'ej.posicion',
                DB::raw('SUM(ej.goles) as total_goles'),
                DB::raw('SUM(ej.asistencias) as total_asistencias'),
                DB::raw('AVG(ej.valoracion) as avg_valoracion'),
                DB::raw('COUNT(ej.id) as partidos_jugados'),
                DB::raw('SUM(ej.jugador_partido) as total_mvp'),
                DB::raw('AVG(ej.precision_pases) as avg_precision_pases'),
                DB::raw($isUt ? '0 as avg_precision_tiro' : 'AVG(ej.precision_tiro) as avg_precision_tiro'),
                DB::raw('SUM(ej.entradas_exitosas) as total_entradas'),
                DB::raw('AVG(ej.tasa_exito_entradas) as avg_exito_entradas'),
                DB::raw($isUt ? '0 as total_atajadas' : 'SUM(ej.atajadas) as total_atajadas'),
                DB::raw($isUt ? '0 as total_goles_recibidos' : 'SUM(ej.goles_recibidos) as total_goles_recibidos'),
                
                DB::raw('SUM(ej.tiros) as total_tiros'),
                DB::raw('SUM(ej.tarjetas_rojas) as total_tarjetas_rojas'),
                DB::raw('SUM(ej.pases_intentados) as total_pases_intentados'),
                DB::raw('SUM(ej.pases_completados) as total_pases_completados'),
                DB::raw('SUM(ej.entradas_intentadas) as total_entradas_intentadas'),
                DB::raw($isUt ? '0 as total_atajadas_buena_colocacion' : 'SUM(ej.atajadas_buena_colocacion) as total_atajadas_buena_colocacion'),
                DB::raw($isUt ? '0 as total_atajadas_volada' : 'SUM(ej.atajadas_volada) as total_atajadas_volada'),
                DB::raw($isUt ? '0 as total_atajadas_reflejos' : 'SUM(ej.atajadas_reflejos) as total_atajadas_reflejos'),
                DB::raw($isUt ? '0 as total_centros_cortados' : 'SUM(ej.centros_cortados) as total_centros_cortados'),
                DB::raw($isUt ? '0 as total_despejes_punos' : 'SUM(ej.despejes_punos) as total_despejes_punos'),
                DB::raw($isUt ? '0 as total_desvios' : 'SUM(ej.desvios) as total_desvios'),
                DB::raw('SUM(ej.segundos_jugados) as total_segundos_jugados')
            )
            ->groupBy('u.id', 'u.name', 'u.foto', 'eq.nombre', 'ej.posicion')
            ->orderByDesc('avg_valoracion')
            ->get();

            $todosEquipos = (clone $queryEquiposBase)->select(
                'eq.id',
                'eq.nombre',
                'eq.logo',
                DB::raw('SUM(eeq.goles_favor) as total_goles_favor'),
                DB::raw('SUM(eeq.goles_en_contra) as total_goles_recibidos'),
                DB::raw('ROUND(AVG(eeq.precision_pases), 1) as avg_precision_pases'),
                DB::raw('ROUND(AVG(eeq.tasa_exito_entradas), 1) as avg_tasa_exito_entradas'),
                DB::raw('COUNT(eeq.id) as partidos_jugados')
            )
            ->groupBy('eq.id', 'eq.nombre', 'eq.logo')
            ->orderByDesc('total_goles_favor')
            ->get();
        }

        return response()->json([
            'total_partidos' => $totalPartidos,
            'goles_totales' => $golesTotales,
            'promedio_goles' => $promedioGoles,
            'porcentaje_local' => $porcentajeLocal,
            'porcentaje_empate' => $porcentajeEmpate,
            'porcentaje_visita' => $porcentajeVisita,
            
            // Jugadores
            'top_goleadores' => $goleadores,
            'top_asistentes' => $asistentes,
            'prestigio_delanteros' => $prestigioDelanteros,
            'prestigio_medios' => $prestigioMedios,
            'prestigio_defensas' => $prestigioDefensas,
            'prestigio_porteros' => $prestigioPorteros,
            'todos_jugadores' => $todosJugadores,

            // Equipos
            'equipos_goleadores' => $equiposGoleadores,
            'equipos_pases' => $equiposPases,
            'equipos_defensa' => $equiposDefensa,
            'todos_equipos' => $todosEquipos,
            
            'precision_pases' => round($promediosEquipo->avg_pases ?? 78.5, 1),
            'precision_tackles' => round($promediosEquipo->avg_entradas ?? 62.4, 1),
            'jornada_max_goles' => $jornadaGoles ? [
                'jornada' => $jornadaGoles->jornada,
            ] : null
        ]);
    }

    /**
     * Obtener estadísticas en tiempo real para los dashboards de Administrador y Organizador
     */
    public function dashboardStats(Request $request): JsonResponse
    {
        $user = auth()->user();

        // 1. Obtener conteo de usuarios por rol
        $totalJugadores = \App\Models\User::where('role', 'jugador')->count();
        $totalOrganizadores = \App\Models\User::where('role', 'organizador')->count();

        // 2. Obtener conteo de clubes
        $totalEquipos = \App\Models\Equipo::count();

        // 3. Obtener conteo de organizaciones
        $totalOrganizaciones = \App\Models\Organizacion::count();

        // 4. Obtener competencias y temporadas
        $totalCompetencias = \App\Models\Competencia::count();
        $totalTemporadas = \App\Models\Temporada::count();

        // 5. Partidos e-sports
        $totalPartidos = \App\Models\Partido::count();
        $partidosFinalizados = \App\Models\Partido::whereNotNull('goles_local')->count();
        $partidosPendientes = $totalPartidos - $partidosFinalizados;

        // Si el rol es Organizador, filtramos sus estadísticas propias:
        $misOrganizacionesIds = \App\Models\Organizacion::where('owner_id', $user->id)->pluck('id');
        $misTemporadasCount = \App\Models\Temporada::whereIn('organizacion_id', $misOrganizacionesIds)->count();
        $misCompetenciasCount = \App\Models\Competencia::whereHas('temporada', function($q) use ($misOrganizacionesIds) {
            $q->whereIn('organizacion_id', $misOrganizacionesIds);
        })->count();
        $misEquiposCount = \App\Models\OrganizacionEquipoUsuario::whereIn('organizacion_id', $misOrganizacionesIds)
            ->distinct('equipo_id')
            ->count('equipo_id');

        $misTraspasosPendientesCount = \App\Models\SolicitudFichaje::whereIn('organizacion_id', $misOrganizacionesIds)
            ->where('estado', 'pendiente_admin')
            ->count();

        // AUDIT 1: Rosters / Equipos (Plantillas vacías o sin capitán) - OPTIMIZED: NO MORE N+1 QUERIES
        $teamsInOrgs = \App\Models\OrganizacionEquipoUsuario::whereIn('organizacion_id', $misOrganizacionesIds)
            ->pluck('equipo_id')
            ->unique()
            ->toArray();

        $teamsInCompetencias = \DB::table('competencia_equipo')
            ->whereIn('competencia_id', \App\Models\Competencia::whereHas('temporada', function($q) use ($misOrganizacionesIds) {
                $q->whereIn('organizacion_id', $misOrganizacionesIds);
            })->pluck('id'))
            ->pluck('equipo_id')
            ->unique()
            ->toArray();

        $allEquiposIds = array_unique(array_merge($teamsInOrgs, $teamsInCompetencias));
        $equipos = \App\Models\Equipo::whereIn('id', $allEquiposIds)->get();

        // Pre-fetch all roster counts grouped by equipo and organizacion in a single query
        $rosterCounts = \App\Models\OrganizacionEquipoUsuario::whereIn('equipo_id', $allEquiposIds)
            ->whereIn('organizacion_id', $misOrganizacionesIds)
            ->select('equipo_id', 'organizacion_id', \DB::raw('count(*) as count'))
            ->groupBy('equipo_id', 'organizacion_id')
            ->get()
            ->groupBy('equipo_id');

        // Pre-fetch fallback organization associations from competition rosters in a single query
        $compTeamOrgs = \DB::table('competencia_equipo')
            ->join('competencias', 'competencia_equipo.competencia_id', '=', 'competencias.id')
            ->join('temporadas', 'competencias.temporada_id', '=', 'temporadas.id')
            ->whereIn('competencia_equipo.equipo_id', $allEquiposIds)
            ->whereIn('temporadas.organizacion_id', $misOrganizacionesIds)
            ->select('competencia_equipo.equipo_id', 'temporadas.organizacion_id')
            ->distinct()
            ->get()
            ->groupBy('equipo_id');

        // Pre-fetch all organization names in a single query
        $organizacionesNames = \App\Models\Organizacion::whereIn('id', $misOrganizacionesIds)
            ->pluck('nombre', 'id')
            ->toArray();

        $equiposWarnings = [];
        foreach ($equipos as $equipo) {
            $teamRosters = $rosterCounts->get($equipo->id) ?: collect();
            $orgsOfTeam = $teamRosters->pluck('organizacion_id')->toArray();
            
            if (empty($orgsOfTeam)) {
                $teamCompOrgs = $compTeamOrgs->get($equipo->id) ?: collect();
                $orgsOfTeam = $teamCompOrgs->pluck('organizacion_id')->toArray();
            }

            foreach ($orgsOfTeam as $orgId) {
                $rosterRecord = $teamRosters->firstWhere('organizacion_id', $orgId);
                $rosterCount = $rosterRecord ? $rosterRecord->count : 0;
                $orgName = $organizacionesNames[$orgId] ?? 'Organización';
                
                if ($rosterCount == 0) {
                    $equiposWarnings[] = [
                        'equipo_id' => $equipo->id,
                        'nombre' => $equipo->nombre,
                        'organizacion' => $orgName,
                        'tipo' => 'plantilla_vacia',
                        'mensaje' => "El equipo {$equipo->nombre} no tiene jugadores registrados en la organización {$orgName}."
                    ];
                }

                if (!$equipo->id_capitan) {
                    $equiposWarnings[] = [
                        'equipo_id' => $equipo->id,
                        'nombre' => $equipo->nombre,
                        'organizacion' => $orgName,
                        'tipo' => 'sin_capitan',
                        'mensaje' => "El equipo {$equipo->nombre} no cuenta con un capitán asignado."
                    ];
                }

                if (empty($equipo->club_id_ea)) {
                    $equiposWarnings[] = [
                        'equipo_id' => $equipo->id,
                        'nombre' => $equipo->nombre,
                        'organizacion' => $orgName,
                        'tipo' => 'sin_club_id_ea',
                        'mensaje' => "El equipo {$equipo->nombre} no tiene registrado su EA Club ID."
                    ];
                }
            }
        }

        // AUDIT 2: Traspasos / Fichajes (Pendientes de firma)
        $traspasosPendientes = \App\Models\SolicitudFichaje::with(['jugador', 'equipo', 'equipoOrigen', 'organizacion'])
            ->whereIn('organizacion_id', $misOrganizacionesIds)
            ->where('estado', 'pendiente_admin')
            ->get()
            ->map(function($sf) {
                return [
                    'id' => $sf->id,
                    'jugador' => $sf->jugador?->name ?? 'Jugador Desconocido',
                    'equipo_destino' => $sf->equipo?->nombre ?? 'Agente Libre / Despido',
                    'equipo_origen' => $sf->equipoOrigen?->nombre ?? 'Agente Libre',
                    'organizacion' => $sf->organizacion?->nombre ?? 'N/A',
                    'tipo' => ($sf->equipo_id === null) ? 'despido' : 'fichaje',
                    'fecha' => $sf->created_at->toIso8601String(),
                ];
            });

        // AUDIT 3: Partidos (Falta de Reporte)
        $partidosFaltaReporte = \App\Models\Partido::with(['local', 'visitante', 'competencia.temporada.organizacion'])
            ->whereHas('competencia.temporada', function($q) use ($misOrganizacionesIds) {
                $q->whereIn('organizacion_id', $misOrganizacionesIds);
            })
            ->whereNull('goles_local')
            ->where('fecha', '<', date('Y-m-d'))
            ->orderBy('fecha', 'asc')
            ->get()
            ->map(function($partido) {
                return [
                    'id' => $partido->id,
                    'local' => $partido->local?->nombre ?? 'Por definir',
                    'visitante' => $partido->visitante?->nombre ?? 'Por definir',
                    'fecha' => $partido->fecha,
                    'hora' => $partido->hora,
                    'competencia' => $partido->competencia?->nombre ?? 'Competencia',
                    'organizacion' => $partido->competencia?->temporada?->organizacion?->nombre ?? 'Organización',
                ];
            });

        // AUDIT 4: Perfil / Organizaciones (Datos faltantes)
        $perfilFaltante = [];
        if (empty($user->gamertag)) $perfilFaltante[] = 'Gamertag / ID Deportivo';
        if (empty($user->id_ea)) $perfilFaltante[] = 'EA ID';
        if (empty($user->plataforma)) $perfilFaltante[] = 'Plataforma de Juego';
        if (empty($user->foto)) $perfilFaltante[] = 'Foto de Perfil';
        if (empty($user->nacionalidad)) $perfilFaltante[] = 'Nacionalidad';
        if (empty($user->telefono)) $perfilFaltante[] = 'Teléfono de Contacto';
        if (empty($user->biografia)) $perfilFaltante[] = 'Biografía / Resumen';

        $organizacionFaltante = [];
        $misOrganizaciones = \App\Models\Organizacion::where('owner_id', $user->id)->get();
        foreach ($misOrganizaciones as $org) {
            $missing = [];
            if (empty($org->logo)) $missing[] = 'Logo corporativo';
            if (empty($org->banner)) $missing[] = 'Banner de presentación';
            if (empty($org->descripcion)) $missing[] = 'Descripción general';
            if (empty($org->color_hex)) $missing[] = 'Color de Tema (HEX)';
            if (empty($org->email_contacto)) $missing[] = 'Correo electrónico de contacto';
            
            if (!empty($missing)) {
                $organizacionFaltante[] = [
                    'id' => $org->id,
                    'nombre' => $org->nombre,
                    'campos_faltantes' => $missing
                ];
            }
        }

        // AUDIT 5: Temporadas (Mercados y Plazos de vigencia)
        $temporadasPlazos = \App\Models\Temporada::with('organizacion')
            ->whereIn('organizacion_id', $misOrganizacionesIds)
            ->get()
            ->map(function($temp) {
                return [
                    'id' => $temp->id,
                    'nombre' => $temp->nombre,
                    'organizacion' => $temp->organizacion?->nombre ?? 'N/A',
                    'estado_mercado' => $temp->estado_mercado,
                    'activa' => $temp->activa,
                    'fecha_inicio' => $temp->fecha_inicio,
                    'fecha_fin' => $temp->fecha_fin,
                ];
            });

        // AUDIT 6: Competencias (Configuración de divisiones) - OPTIMIZED: NO MORE N+1 QUERIES
        $competenciasWarn = \App\Models\Competencia::with('temporada.organizacion')
            ->withCount(['equipos', 'partidos'])
            ->whereHas('temporada', function($q) use ($misOrganizacionesIds) {
                $q->whereIn('organizacion_id', $misOrganizacionesIds);
            })
            ->get()
            ->map(function($comp) {
                $equiposCount = $comp->equipos_count;
                $partidosCount = $comp->partidos_count;
                $warnings = [];

                if ($equiposCount === 0) {
                    $warnings[] = 'No hay equipos inscritos en esta competencia.';
                }
                if ($partidosCount === 0 && $comp->estado === 'en_curso') {
                    $warnings[] = 'La competencia está activa pero no se han generado los encuentros/partidos.';
                }
                if (empty($comp->color_tema)) {
                    $warnings[] = 'Falta definir un color de marca para la competencia.';
                }
                if (empty($comp->logo)) {
                    $warnings[] = 'Falta subir el logotipo oficial de la división.';
                }

                if (!empty($warnings)) {
                    return [
                        'id' => $comp->id,
                        'nombre' => $comp->nombre,
                        'organizacion' => $comp->temporada?->organizacion?->nombre ?? 'N/A',
                        'estado' => $comp->estado,
                        'warnings' => $warnings
                    ];
                }
                return null;
            })->filter()->values();

        return response()->json([
            'global' => [
                'jugadores' => $totalJugadores,
                'organizadores' => $totalOrganizadores,
                'equipos' => $totalEquipos,
                'organizaciones' => $totalOrganizaciones,
                'competencias' => $totalCompetencias,
                'temporadas' => $totalTemporadas,
                'partidos' => $totalPartidos,
                'partidos_finalizados' => $partidosFinalizados,
                'partidos_pendientes' => $partidosPendientes,
            ],
            'organizador' => [
                'mis_organizaciones' => $misOrganizacionesIds->count(),
                'mis_temporadas' => $misTemporadasCount,
                'mis_competencias' => $misCompetenciasCount,
                'mis_equipos' => $misEquiposCount,
                'mis_partidos_pendientes' => \App\Models\Partido::whereHas('competencia.temporada', function($q) use ($misOrganizacionesIds) {
                    $q->whereIn('organizacion_id', $misOrganizacionesIds);
                })->whereNull('goles_local')->count(),
                'mis_traspasos_pendientes' => $misTraspasosPendientesCount,
                'audits' => [
                    'equipos' => $equiposWarnings,
                    'traspasos' => $traspasosPendientes,
                    'partidos' => $partidosFaltaReporte,
                    'perfil' => [
                        'usuario' => $perfilFaltante,
                        'organizaciones' => $organizacionFaltante
                    ],
                    'temporadas' => $temporadasPlazos,
                    'competencias' => $competenciasWarn
                ]
            ]
        ]);
    }

    /**
     * Obtener estadísticas globales públicas (usadas en la landing page / Home).
     */
    public function publicStats(Request $request): JsonResponse
    {
        // Cache por 15 minutos — estos conteos cambian rara vez y se consultan en cada carga de la landing page
        $stats = Cache::remember('public_stats_global', now()->addMinutes(15), function () {
            return [
                'jugadores'    => \App\Models\User::where('role', 'jugador')->count(),
                'equipos'      => \App\Models\Equipo::count(),
                'competencias' => \App\Models\Competencia::count(),
                'partidos'     => \App\Models\Partido::count(),
            ];
        });

        return response()->json($stats);
    }

    /**
     * Procesar mensajes tácticos de contacto con validaciones de élite.
     */
    public function contacto(Request $request): JsonResponse
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'asunto' => 'required|string|max:255',
            'mensaje' => 'required|string|min:10',
        ], [
            'nombre.required' => 'El nombre es obligatorio.',
            'email.required' => 'El correo electrónico es requerido para contactarte.',
            'email.email' => 'El formato del correo ingresado no es válido.',
            'asunto.required' => 'Debes especificar un asunto oficial.',
            'mensaje.required' => 'El mensaje no puede estar vacío.',
            'mensaje.min' => 'El mensaje táctico debe contener al menos 10 caracteres explicativos.'
        ]);

        // Simular almacenamiento o envío
        return response()->json([
            'success' => true,
            'message' => '¡Mensaje recibido con éxito! Nuestro comité administrativo revisará tu requerimiento y te responderá en un plazo máximo de 24 horas.'
        ]);
    }

    public function auditoriaGamerTAGs(Request $request): JsonResponse
    {
        $cacheKey = 'gamertag_audit_results';
        $audit = \Illuminate\Support\Facades\Cache::remember($cacheKey, now()->addMinutes(5), function () {
            $players = User::where('role', 'jugador')->get();

            // Identificar fichas incompletas
            $missingData = [];
            foreach ($players as $p) {
                $missingEa = empty($p->id_ea);
                $missingGt = empty($p->gamertag);
                if ($missingEa || $missingGt) {
                    $missingData[] = [
                        'id' => $p->id,
                        'name' => $p->name,
                        'email' => $p->email,
                        'missingEa' => $missingEa,
                        'missingGt' => $missingGt,
                    ];
                }
            }

            // Identificar similitudes Levenshtein
            $playersWithGt = $players->filter(fn($p) => !empty($p->gamertag))->values();
            $visited = [];
            $similarGroups = [];

            $clean = function($str) {
                $str = strtolower($str);
                $str = preg_replace('/[\s\._\-]/', '', $str);
                $str = str_replace(['0', '1', '3', '4', '5', '7', '8'], ['o', 'i', 'e', 'a', 's', 't', 'b'], $str);
                return $str;
            };

            $count = count($playersWithGt);
            for ($i = 0; $i < $count; $i++) {
                $p1 = $playersWithGt[$i];
                if (in_array($p1->id, $visited)) continue;

                $currentGroup = [$p1];
                $c1 = $clean($p1->gamertag);

                for ($j = $i + 1; $j < $count; $j++) {
                    $p2 = $playersWithGt[$j];
                    if (in_array($p2->id, $visited)) continue;

                    $c2 = $clean($p2->gamertag);
                    if ($c1 === $c2) {
                        $currentGroup[] = $p2;
                    } else {
                        $dist = levenshtein($c1, $c2);
                        if ($dist <= 2 && min(strlen($c1), strlen($c2)) >= 4) {
                            $currentGroup[] = $p2;
                        }
                    }
                }

                if (count($currentGroup) > 1) {
                    foreach ($currentGroup as $p) {
                        $visited[] = $p->id;
                    }
                    $similarGroups[] = array_map(fn($p) => [
                        'id' => $p['id'],
                        'name' => $p['name'],
                        'email' => $p['email'],
                        'gamertag' => $p['gamertag'],
                    ], $currentGroup);
                }
            }

            return [
                'missingData' => $missingData,
                'similarGroups' => $similarGroups,
            ];
        });

        $type = $request->get('type', 'similar'); // 'missing' o 'similar'
        $perPage = (int)$request->get('per_page', 5);
        $page = (int)$request->get('page', 1);

        $items = $type === 'missing' ? $audit['missingData'] : $audit['similarGroups'];
        $total = count($items);

        $offset = ($page - 1) * $perPage;
        $paginatedItems = array_slice($items, $offset, $perPage);

        return response()->json([
            'data' => $paginatedItems,
            'current_page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'last_page' => (int)ceil($total / $perPage),
        ]);
    }
}
