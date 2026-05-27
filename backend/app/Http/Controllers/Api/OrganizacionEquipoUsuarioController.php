<?php

namespace App\Http\Controllers\Api;

use App\Models\OrganizacionEquipoUsuario;
use Illuminate\Http\Request;
use App\Http\Requests\OrganizacionEquipoUsuarioRequest;
use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\OrganizacionEquipoUsuarioResource;

class OrganizacionEquipoUsuarioController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $organizacionEquipoUsuarios = OrganizacionEquipoUsuario::paginate();

        return OrganizacionEquipoUsuarioResource::collection($organizacionEquipoUsuarios);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(OrganizacionEquipoUsuarioRequest $request): JsonResponse
    {
        $organizacionEquipoUsuario = OrganizacionEquipoUsuario::create($request->validated());

        return response()->json(new OrganizacionEquipoUsuarioResource($organizacionEquipoUsuario));
    }

    /**
     * Display the specified resource.
     */
    public function show(OrganizacionEquipoUsuario $organizacionEquipoUsuario): JsonResponse
    {
        return response()->json(new OrganizacionEquipoUsuarioResource($organizacionEquipoUsuario));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(OrganizacionEquipoUsuarioRequest $request, OrganizacionEquipoUsuario $organizacionEquipoUsuario): JsonResponse
    {
        $organizacionEquipoUsuario->update($request->validated());

        return response()->json(new OrganizacionEquipoUsuarioResource($organizacionEquipoUsuario));
    }

    /**
     * Delete the specified resource.
     */
    public function destroy(OrganizacionEquipoUsuario $organizacionEquipoUsuario): Response
    {
        $organizacionEquipoUsuario->delete();

        return response()->noContent();
    }
}
