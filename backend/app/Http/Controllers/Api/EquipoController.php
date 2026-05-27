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
        $equipo = Equipo::with(['roster'])
            ->where('id_capitan', auth()->id())
            ->first();

        if (!$equipo) {
            return response()->json(['message' => 'No tienes club registrado.'], 404);
        }

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

            'roster' => $equipo->roster->map(function ($jugador) {
                return [
                    'id' => $jugador->id,
                    'name' => $jugador->name,
                    'gamertag' => $jugador->gamertag ?? 'N/A',

                    // BLINDAJE: Si 'pivot' es nulo o la propiedad no existe, devuelve null
                    'dorsal' => $jugador->pivot->dorsal ?? null,
                    'posicion' => $jugador->pivot->posicion_bloque ?? 'Sin asignar',
                    'estado_fichaje' => $jugador->pivot->estado_fichaje ?? 'pendiente',
                ];
            }),
            'competencias' => [],
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

    /**
     * Display the specified resource.
     */
    public function show(Equipo $equipo): JsonResponse
    {
        return response()->json(new EquipoResource($equipo));
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
}
