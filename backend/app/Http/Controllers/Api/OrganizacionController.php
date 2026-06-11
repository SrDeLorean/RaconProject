<?php

namespace App\Http\Controllers\Api;

use App\Models\Organizacion;
use Illuminate\Http\Request;
use App\Http\Requests\OrganizacionRequest;
use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\OrganizacionResource;

class OrganizacionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Cargamos todas las relaciones necesarias para calcular estadísticas reales en el frontend
        $query = \App\Models\Organizacion::query()->with([
            'owner', 
            'temporadas.competencias.equipos', 
            'temporadas.competencias.partidos',
            'temporadas.competenciasUt.equipos',
            'temporadas.competenciasUt.partidos'
        ]);

        if ($request->filled('estado') && $request->estado !== 'todas') {
            $query->where('estado', $request->estado);
        }

        if ($request->filled('tipo') && $request->tipo !== 'todas') {
            if ($request->tipo === '11v11') {
                $query->whereHas('temporadas.competencias');
            } elseif ($request->tipo === 'ut' || $request->tipo === 'UT') {
                $query->whereHas('temporadas.competenciasUt');
            }
        }

        if ($request->filled('owner_id')) {
            $query->where('owner_id', $request->owner_id);
        }

        if ($request->filled('player_id')) {
            $query->whereIn('id', function($q) use ($request) {
                $q->select('organizacion_id')
                  ->from('organizacion_equipo_usuario')
                  ->where('user_id', $request->player_id)
                  ->where('estado_fichaje', 'activo');
            });
        }

        if ($request->filled('search')) {
            $query->where('nombre', 'LIKE', "%{$request->search}%");
        }

        return $query->paginate($request->input('per_page', 10));
    }
    /**
     * Store a newly created resource in storage.
     */
    public function store(OrganizacionRequest $request): JsonResponse
    {
        $organizacion = Organizacion::create($request->validated());

        return response()->json(new OrganizacionResource($organizacion));
    }

    /**
     * Display the specified resource.
     */
    public function show(Organizacion $organizacion): JsonResponse
    {
        $organizacion->load([
            'temporadas.competencias.equipos', 
            'temporadas.competencias.partidos', 
            'temporadas.competenciasUt.equipos', 
            'temporadas.competenciasUt.partidos', 
            'owner'
        ]);
        return response()->json($organizacion);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(OrganizacionRequest $request, Organizacion $organizacion): JsonResponse
    {
        $organizacion->update($request->validated());

        return response()->json(new OrganizacionResource($organizacion));
    }

    /**
     * Delete the specified resource.
     */
    public function destroy(Organizacion $organizacion): Response
    {
        $organizacion->delete();

        return response()->noContent();
    }
}
