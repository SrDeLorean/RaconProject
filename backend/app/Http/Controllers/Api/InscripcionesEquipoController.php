<?php

namespace App\Http\Controllers\Api;

use App\Models\InscripcionesEquipo;
use Illuminate\Http\Request;
use App\Http\Requests\InscripcionesEquipoRequest;
use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\InscripcionesEquipoResource;

class InscripcionesEquipoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $inscripcionesEquipos = InscripcionesEquipo::paginate();

        return InscripcionesEquipoResource::collection($inscripcionesEquipos);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(InscripcionesEquipoRequest $request): JsonResponse
    {
        $inscripcionesEquipo = InscripcionesEquipo::create($request->validated());

        return response()->json(new InscripcionesEquipoResource($inscripcionesEquipo));
    }

    /**
     * Display the specified resource.
     */
    public function show(InscripcionesEquipo $inscripcionesEquipo): JsonResponse
    {
        return response()->json(new InscripcionesEquipoResource($inscripcionesEquipo));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(InscripcionesEquipoRequest $request, InscripcionesEquipo $inscripcionesEquipo): JsonResponse
    {
        $inscripcionesEquipo->update($request->validated());

        return response()->json(new InscripcionesEquipoResource($inscripcionesEquipo));
    }

    /**
     * Delete the specified resource.
     */
    public function destroy(InscripcionesEquipo $inscripcionesEquipo): Response
    {
        $inscripcionesEquipo->delete();

        return response()->noContent();
    }
}
