<?php

namespace App\Http\Controllers\Api;

use App\Models\Divisione;
use Illuminate\Http\Request;
use App\Http\Requests\DivisioneRequest;
use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\DivisioneResource;

class DivisioneController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $divisiones = Divisione::paginate();

        return DivisioneResource::collection($divisiones);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(DivisioneRequest $request): JsonResponse
    {
        $divisione = Divisione::create($request->validated());

        return response()->json(new DivisioneResource($divisione));
    }

    /**
     * Display the specified resource.
     */
    public function show(Divisione $divisione): JsonResponse
    {
        return response()->json(new DivisioneResource($divisione));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(DivisioneRequest $request, Divisione $divisione): JsonResponse
    {
        $divisione->update($request->validated());

        return response()->json(new DivisioneResource($divisione));
    }

    /**
     * Delete the specified resource.
     */
    public function destroy(Divisione $divisione): Response
    {
        $divisione->delete();

        return response()->noContent();
    }
}
