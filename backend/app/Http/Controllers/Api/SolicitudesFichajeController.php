<?php

namespace App\Http\Controllers\Api;

use App\Models\SolicitudesFichaje;
use Illuminate\Http\Request;
use App\Http\Requests\SolicitudesFichajeRequest;
use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\SolicitudesFichajeResource;

class SolicitudesFichajeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $solicitudesFichajes = SolicitudesFichaje::paginate();

        return SolicitudesFichajeResource::collection($solicitudesFichajes);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(SolicitudesFichajeRequest $request): JsonResponse
    {
        $solicitudesFichaje = SolicitudesFichaje::create($request->validated());

        return response()->json(new SolicitudesFichajeResource($solicitudesFichaje));
    }

    /**
     * Display the specified resource.
     */
    public function show(SolicitudesFichaje $solicitudesFichaje): JsonResponse
    {
        return response()->json(new SolicitudesFichajeResource($solicitudesFichaje));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(SolicitudesFichajeRequest $request, SolicitudesFichaje $solicitudesFichaje): JsonResponse
    {
        $solicitudesFichaje->update($request->validated());

        return response()->json(new SolicitudesFichajeResource($solicitudesFichaje));
    }

    /**
     * Delete the specified resource.
     */
    public function destroy(SolicitudesFichaje $solicitudesFichaje): Response
    {
        $solicitudesFichaje->delete();

        return response()->noContent();
    }
}
