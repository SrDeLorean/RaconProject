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

class EquipoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $equipos = Equipo::paginate();

        return EquipoResource::collection($equipos);
    }

    /**
     * Obtener el equipo gestionado por el usuario autenticado junto con su roster y torneos.
     */
    public function miEquipo(Request $request)
    {
        $equipo = Equipo::where('id_capitan', auth()->id())->first();

        if (!$equipo) {
            return response()->json(['message' => 'No tienes club registrado.'], 404);
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

        // 4. Guardamos en la base de datos
        $equipo = Equipo::create($datos);

        return response()->json($equipo, 201);
    }

    public function show(Equipo $equipo): JsonResponse
    {
        $equipo->load('capitan');

        $roster = \App\Models\OrganizacionEquipoUsuario::with(['jugador', 'organizacion'])
            ->where('equipo_id', $equipo->id)
            ->get()
            ->map(function ($row) {
                if (!$row->jugador) return null;
                return [
                    'id' => $row->jugador->id,
                    'name' => $row->jugador->name,
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

        return response()->json([
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
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(EquipoRequest $request, Equipo $equipo): JsonResponse
    {
        $equipo->update($request->validated());

        return response()->json(new EquipoResource($equipo));
    }

    /**
     * Delete the specified resource.
     */
    public function destroy(Equipo $equipo): Response
    {
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

        return response()->json(['message' => 'Jugador incorporado exitosamente al roster de la organización.'], 200);
    }

    /**
     * Remover o desvincular un jugador del roster de la organización para este equipo.
     */
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

        $deleted = \App\Models\OrganizacionEquipoUsuario::where('organizacion_id', $organizacionId)
            ->where('equipo_id', $equipo->id)
            ->where('user_id', $userId)
            ->delete();

        if ($deleted) {
            return response()->json(['message' => 'Jugador desvinculado del roster de la organización.'], 200);
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
