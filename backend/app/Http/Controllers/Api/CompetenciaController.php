<?php

namespace App\Http\Controllers\Api;

use App\Models\Competencia;
use Illuminate\Http\Request;
use App\Http\Requests\CompetenciaRequest;
use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\CompetenciaResource;

class CompetenciaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Competencia::query()->with('organizacion');

        if ($request->filled('search')) {
            $query->where('nombre', 'LIKE', "%{$request->search}%");
        }

        // Filtramos por organización del usuario logueado o parámetro
        return $query->latest()->paginate(10);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(CompetenciaRequest $request): JsonResponse
    {
        $competencia = Competencia::create($request->validated());

        return response()->json(new CompetenciaResource($competencia));
    }

    /**
     * Display the specified resource.
     */
    public function show(Competencia $competencia): JsonResponse
    {
        return response()->json(new CompetenciaResource($competencia));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(CompetenciaRequest $request, Competencia $competencia): JsonResponse
    {
        $competencia->update($request->validated());

        return response()->json(new CompetenciaResource($competencia));
    }

    /**
     * Delete the specified resource.
     */
    public function destroy(Competencia $competencia): Response
    {
        $competencia->delete();

        return response()->noContent();
    }
}
