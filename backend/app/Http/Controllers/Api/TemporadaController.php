<?php

namespace App\Http\Controllers\Api;

use App\Models\Temporada;
use Illuminate\Http\Request;
use App\Http\Requests\TemporadaRequest;
use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\TemporadaResource;

class TemporadaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // 1. Identificamos la organización del organizador logueado
        $organizacion = \App\Models\Organizacion::where('owner_id', auth()->id())->first();

        if (!$organizacion) {
            // Si es admin, dejamos ver todas; de lo contrario, listado vacío limpio en vez de 404
            $role = auth()->user()->role;
            if ($role === 'admin' || $role === 'administrador') {
                $query = \App\Models\Temporada::query();
            } else {
                return response()->json(['data' => [], 'total' => 0]);
            }
        } else {
            // 2. Iniciamos la consulta bloqueada estrictamente a su organización
            $query = \App\Models\Temporada::where('organizacion_id', $organizacion->id);
        }

        // 3. Filtro de Búsqueda de Texto (Search)
        // Usamos filled() en lugar de has() para ignorar strings vacíos ("")
        if ($request->filled('search')) {
            $searchTerm = $request->search;

            // 🔥 SEGURIDAD: Agrupamos los OR en un bloque lógico para no romper el filtro de organizacion_id
            $query->where(function ($q) use ($searchTerm) {
                $q->where('nombre', 'like', '%' . $searchTerm . '%')
                  ->orWhere('slug', 'like', '%' . $searchTerm . '%');
            });
        }

        // 4. Filtro por Estado (Pestañas Activas / Inactivas)
        if ($request->filled('activa')) {
            // Convierte el '1' o '0' que manda React a un booleano (true/false)
            $query->where('activa', $request->activa === '1');
        }

        // 5. Ordenamos para que las más recientes salgan primero
        $query->latest();

        // 6. Ejecutamos la paginación respetando el parámetro per_page del frontend
        $perPage = $request->get('per_page', 10);
        $temporadas = $query->paginate($perPage);

        // Laravel formatea automáticamente esto con los nodos 'data', 'meta' y 'links'
        return response()->json($temporadas);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(TemporadaRequest $request)
    {
        // 1. Buscamos la organización de la cual es dueño el usuario logueado
        $organizacion = \App\Models\Organizacion::where('owner_id', auth()->id())->firstOrFail();

        // 2. Extraemos los datos validados del FormRequest
        $datos = $request->validated();

        // 3. Inyectamos manualmente el ID de la organización en el array
        $datos['organizacion_id'] = $organizacion->id;

        // 4. Creamos la temporada con el array completo
        $temporada = Temporada::create($datos);

        return response()->json($temporada, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Temporada $temporada): JsonResponse
    {
        return response()->json(new TemporadaResource($temporada));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(TemporadaRequest $request, Temporada $temporada): JsonResponse
    {
        $temporada->update($request->validated());

        return response()->json(new TemporadaResource($temporada));
    }

    /**
     * Delete the specified resource.
     */
    public function destroy(Temporada $temporada): Response|JsonResponse
    {
        // Verificar si la temporada tiene competencias asociadas
        $competenciasCount = $temporada->competencias()->count();
        $competenciasUtCount = $temporada->competenciasUt()->count();

        if ($competenciasCount > 0 || $competenciasUtCount > 0) {
            return response()->json([
                'message' => 'No es posible eliminar esta temporada porque ya tiene competencias (11v11 o UT) registradas en ella. Para borrar la temporada, primero necesitas borrar todas las competencias asociadas.'
            ], 422);
        }

        $temporada->delete();

        return response()->noContent();
    }
}
