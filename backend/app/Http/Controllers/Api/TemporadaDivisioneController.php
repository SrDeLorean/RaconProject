<?php

namespace App\Http\Controllers\Api;

use App\Models\TemporadaDivisione;
use Illuminate\Http\Request;
use App\Http\Requests\TemporadaDivisioneRequest;
use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\TemporadaDivisioneResource;

class TemporadaDivisioneController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $temporadaDivisiones = TemporadaDivisione::paginate();

        return TemporadaDivisioneResource::collection($temporadaDivisiones);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(TemporadaDivisioneRequest $request): JsonResponse
    {
        $temporadaDivisione = TemporadaDivisione::create($request->validated());

        return response()->json(new TemporadaDivisioneResource($temporadaDivisione));
    }

    /**
     * Display the specified resource.
     */
    public function show(TemporadaDivisione $temporadaDivisione): JsonResponse
    {
        return response()->json(new TemporadaDivisioneResource($temporadaDivisione));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(TemporadaDivisioneRequest $request, TemporadaDivisione $temporadaDivisione): JsonResponse
    {
        $temporadaDivisione->update($request->validated());

        return response()->json(new TemporadaDivisioneResource($temporadaDivisione));
    }

    /**
     * Delete the specified resource.
     */
    public function destroy(TemporadaDivisione $temporadaDivisione): Response
    {
        $temporadaDivisione->delete();

        return response()->noContent();
    }
}
