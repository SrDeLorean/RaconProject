<?php

namespace App\Http\Controllers\Api;

use App\Models\EquipoJugador;
use Illuminate\Http\Request;
use App\Http\Requests\EquipoJugadorRequest;
use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\EquipoJugadorResource;

class EquipoJugadorController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $equipoJugadors = EquipoJugador::paginate();

        return EquipoJugadorResource::collection($equipoJugadors);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(EquipoJugadorRequest $request): JsonResponse
    {
        $equipoJugador = EquipoJugador::create($request->validated());

        return response()->json(new EquipoJugadorResource($equipoJugador));
    }

    /**
     * Display the specified resource.
     */
    public function show(EquipoJugador $equipoJugador): JsonResponse
    {
        return response()->json(new EquipoJugadorResource($equipoJugador));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(EquipoJugadorRequest $request, EquipoJugador $equipoJugador): JsonResponse
    {
        $equipoJugador->update($request->validated());

        return response()->json(new EquipoJugadorResource($equipoJugador));
    }

    /**
     * Delete the specified resource.
     */
    public function destroy(EquipoJugador $equipoJugador): Response
    {
        $equipoJugador->delete();

        return response()->noContent();
    }
}
