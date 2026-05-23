<?php

namespace App\Http\Controllers\Api;

use App\Models\Organizacione;
use Illuminate\Http\Request;
use App\Http\Requests\OrganizacioneRequest;
use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\OrganizacioneResource;

class OrganizacioneController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Cambiamos a 'organizacione' porque el modelo se llama así
        $query = \App\Models\Organizacione::query()->with('owner');

        if ($request->filled('estado') && $request->estado !== 'todas') {
            $query->where('estado', $request->estado);
        }

        if ($request->filled('search')) {
            $query->where('nombre', 'LIKE', "%{$request->search}%");
        }

        return $query->paginate($request->input('per_page', 10));
    }
    /**
     * Store a newly created resource in storage.
     */
    public function store(OrganizacioneRequest $request): JsonResponse
    {
        $organizacione = Organizacione::create($request->validated());

        return response()->json(new OrganizacioneResource($organizacione));
    }

    /**
     * Display the specified resource.
     */
    public function show(Organizacione $organizacione): JsonResponse
    {
        return response()->json(new OrganizacioneResource($organizacione));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(OrganizacioneRequest $request, Organizacione $organizacione): JsonResponse
    {
        $organizacione->update($request->validated());

        return response()->json(new OrganizacioneResource($organizacione));
    }

    /**
     * Delete the specified resource.
     */
    public function destroy(Organizacione $organizacione): Response
    {
        $organizacione->delete();

        return response()->noContent();
    }
}
