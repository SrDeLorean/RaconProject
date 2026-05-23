<?php

namespace App\Http\Controllers\Api;

use App\Models\Temporada;
use Illuminate\Http\Request;
use App\Http\Requests\TemporadaRequest;
use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\TemporadaResource;

class TemporadaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $temporadas = Temporada::paginate();

        return TemporadaResource::collection($temporadas);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(TemporadaRequest $request): JsonResponse
    {
        $temporada = Temporada::create($request->validated());

        return response()->json(new TemporadaResource($temporada));
    }

    /**
     * Display the specified resource.
     */
    public function show(Temporada $temporada): JsonResponse
    {
        return response()->json(new TemporadaResource($temporada));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(TemporadaRequest $request, Temporada $temporada): JsonResponse
    {
        $temporada->update($request->validated());

        return response()->json(new TemporadaResource($temporada));
    }

    /**
     * Delete the specified resource.
     */
    public function destroy(Temporada $temporada): Response
    {
        $temporada->delete();

        return response()->noContent();
    }
}
