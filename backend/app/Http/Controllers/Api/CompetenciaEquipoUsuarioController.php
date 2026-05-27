<?php

namespace App\Http\Controllers\Api;

use App\Models\CompetenciaEquipoUsuario;
use Illuminate\Http\Request;
use App\Http\Requests\CompetenciaEquipoUsuarioRequest;
use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\CompetenciaEquipoUsuarioResource;

class CompetenciaEquipoUsuarioController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $competenciaEquipoUsuarios = CompetenciaEquipoUsuario::paginate();

        return CompetenciaEquipoUsuarioResource::collection($competenciaEquipoUsuarios);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(CompetenciaEquipoUsuarioRequest $request): JsonResponse
    {
        $competenciaEquipoUsuario = CompetenciaEquipoUsuario::create($request->validated());

        return response()->json(new CompetenciaEquipoUsuarioResource($competenciaEquipoUsuario));
    }

    /**
     * Display the specified resource.
     */
    public function show(CompetenciaEquipoUsuario $competenciaEquipoUsuario): JsonResponse
    {
        return response()->json(new CompetenciaEquipoUsuarioResource($competenciaEquipoUsuario));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(CompetenciaEquipoUsuarioRequest $request, CompetenciaEquipoUsuario $competenciaEquipoUsuario): JsonResponse
    {
        $competenciaEquipoUsuario->update($request->validated());

        return response()->json(new CompetenciaEquipoUsuarioResource($competenciaEquipoUsuario));
    }

    /**
     * Delete the specified resource.
     */
    public function destroy(CompetenciaEquipoUsuario $competenciaEquipoUsuario): Response
    {
        $competenciaEquipoUsuario->delete();

        return response()->noContent();
    }
}
