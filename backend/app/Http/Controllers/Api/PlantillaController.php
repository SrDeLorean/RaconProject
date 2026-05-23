<?php

namespace App\Http\Controllers\Api;

use App\Models\Plantilla;
use Illuminate\Http\Request;
use App\Http\Requests\PlantillaRequest;
use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\PlantillaResource;

class PlantillaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $plantillas = Plantilla::paginate();

        return PlantillaResource::collection($plantillas);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(PlantillaRequest $request)
    {
        // 1. Obtener la inscripción destino para saber a qué torneo (Instancia) pertenece
        $inscripcionDestino = \App\Models\InscripcionEquipo::findOrFail($request->id_inscripcion_equipo);
        $idTemporadaDivision = $inscripcionDestino->id_temporada_division;

        // 2. Aplicar la Regla Maestra: ¿El jugador ya está en este torneo?
        // Buscamos si "Juan" ya existe en alguna plantilla que pertenezca a
        // otra inscripción vinculada al MISMO torneo.
        $jugadorExistente = \App\Models\Plantilla::join('inscripciones_equipos', 'plantillas.id_inscripcion_equipo', '=', 'inscripciones_equipos.id')
            ->where('plantillas.id_usuario', $request->id_usuario)
            ->where('inscripciones_equipos.id_temporada_division', $idTemporadaDivision)
            ->first();

        if ($jugadorExistente) {
            // El Muro: Si la consulta encuentra algo, la API rechaza la solicitud[cite: 110].
            return response()->json([
                'success' => false,
                'message' => 'Error: Este jugador ya está inscrito con otro equipo en esta competición.',
            ], 403);
        }

        // 3. Luz Verde: Guardamos al jugador en la plantilla usando los datos validados
        $plantilla = \App\Models\Plantilla::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Jugador inscrito exitosamente en la plantilla.',
            'data' => $plantilla
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Plantilla $plantilla): JsonResponse
    {
        return response()->json(new PlantillaResource($plantilla));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(PlantillaRequest $request, Plantilla $plantilla): JsonResponse
    {
        $plantilla->update($request->validated());

        return response()->json(new PlantillaResource($plantilla));
    }

    /**
     * Delete the specified resource.
     */
    public function destroy(Plantilla $plantilla): Response
    {
        $plantilla->delete();

        return response()->noContent();
    }

    public function inscribirUsuario(Request $request)
    {
        $usuario = auth()->user();

        // Validamos que el usuario sea exclusivamente 'jugador'
        if ($usuario->role !== 'jugador') {
            return response()->json([
                'message' => 'Acceso denegado: Solo los jugadores pueden inscribirse en torneos.'
            ], 403);
        }

        // Lógica para continuar con la inscripción...
    }
}
