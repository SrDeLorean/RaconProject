<?php

namespace App\Http\Controllers\Api;

use App\Models\Partido;
use Illuminate\Http\Request;
use App\Http\Requests\PartidoRequest;
use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\PartidoResource;

class PartidoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $partidos = Partido::paginate();

        return PartidoResource::collection($partidos);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(PartidoRequest $request): JsonResponse
    {
        $partido = Partido::create($request->validated());

        return response()->json(new PartidoResource($partido));
    }

    /**
     * Display the specified resource.
     */
    public function show(Partido $partido): JsonResponse
    {
        return response()->json(new PartidoResource($partido));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(PartidoRequest $request, Partido $partido): JsonResponse
    {
        $partido->update($request->validated());

        return response()->json(new PartidoResource($partido));
    }

    /**
     * Delete the specified resource.
     */
    public function destroy(Partido $partido): Response
    {
        $partido->delete();

        return response()->noContent();
    }
}
