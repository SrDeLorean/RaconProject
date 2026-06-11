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
        $validated = $request->validated();
        
        // Delete old logo if updated
        if (array_key_exists('logo', $validated) && $validated['logo'] !== $organizacion->logo) {
            $oldLogo = $organizacion->logo;
            if ($oldLogo && str_contains($oldLogo, 'uploads/') && !str_starts_with($oldLogo, 'http')) {
                $fullPath = public_path(ltrim($oldLogo, '/'));
                if (file_exists($fullPath) && is_file($fullPath)) {
                    @unlink($fullPath);
                }
            }
        }
        
        // Delete old banner if updated
        if (array_key_exists('banner', $validated) && $validated['banner'] !== $organizacion->banner) {
            $oldBanner = $organizacion->banner;
            if ($oldBanner && str_contains($oldBanner, 'uploads/') && !str_starts_with($oldBanner, 'http')) {
                $fullPath = public_path(ltrim($oldBanner, '/'));
                if (file_exists($fullPath) && is_file($fullPath)) {
                    @unlink($fullPath);
                }
            }
        }

        $organizacion->update($validated);

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
