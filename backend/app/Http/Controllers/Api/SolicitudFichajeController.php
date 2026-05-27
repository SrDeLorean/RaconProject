<?php

namespace App\Http\Controllers\Api;

use App\Models\SolicitudFichaje;
use Illuminate\Http\Request;
use App\Http\Requests\SolicitudFichajeRequest;
use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\SolicitudFichajeResource;

class SolicitudFichajeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $solicitudesFichajes = SolicitudFichaje::paginate();

        return SolicitudFichajeResource::collection($solicitudesFichajes);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(SolicitudFichajeRequest $request): JsonResponse
    {
        $solicitudesFichaje = SolicitudFichaje::create($request->validated());

        return response()->json(new SolicitudFichajeResource($solicitudesFichaje));
    }

    /**
     * Display the specified resource.
     */
    public function show(SolicitudFichaje $solicitudesFichaje): JsonResponse
    {
        return response()->json(new SolicitudFichajeResource($solicitudesFichaje));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(SolicitudFichajeRequest $request, SolicitudFichaje $solicitudesFichaje): JsonResponse
    {
        $solicitudesFichaje->update($request->validated());

        return response()->json(new SolicitudFichajeResource($solicitudesFichaje));
    }

    /**
     * Delete the specified resource.
     */
    public function destroy(SolicitudFichaje $solicitudesFichaje): Response
    {
        $solicitudesFichaje->delete();

        return response()->noContent();
    }
}
