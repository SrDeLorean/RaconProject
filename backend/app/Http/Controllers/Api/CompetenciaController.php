<?php

namespace App\Http\Controllers\Api;

use App\Models\Competencia;
use Illuminate\Http\Request;
use App\Http\Requests\CompetenciaRequest;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\CompetenciaResource;

class CompetenciaController extends Controller
{
    public function index(Request $request)
    {
        // 1. Identificamos la organización que administra este usuario
        $organizacion = \App\Models\Organizacion::where('owner_id', auth()->id())->firstOrFail();

        // 2. Traemos todas las competencias cuyas temporadas pertenezcan a su organización
        $query = Competencia::whereHas('temporada', function ($q) use ($organizacion) {
            $q->where('organizacion_id', $organizacion->id);
        });

        // 3. 🔥 FILTRO DE TABLA OPCIONAL: Si viene un temporada_id desde el combo del front, filtramos
        if ($request->filled('temporada_id')) {
            $query->where('temporada_id', $request->temporada_id);
        }

        // 4. Filtro de búsqueda por texto
        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('nombre', 'like', '%' . $searchTerm . '%')
                ->orWhere('slug', 'like', '%' . $searchTerm . '%');
            });
        }

        // 5. Filtro por pestañas de estado
        if ($request->filled('estado') && $request->estado !== 'todos') {
            $query->where('estado', $request->estado);
        }

        // Incluimos la relación de la temporada para pintar su nombre en la tabla
        $query->with(['temporada:id,nombre'])->withCount('equipos')->latest();

        return response()->json($query->paginate($request->per_page ?? 10));
    }

    public function show(Competencia $competencia)
    {
        $competencia->load([
            'equipos',
            'temporada.organizacion',
            'partidos.local',
            'partidos.visitante',
        ]);
        return response()->json(['data' => $competencia]);
    }

    public function store(CompetenciaRequest $request): JsonResponse
    {
        $competencia = Competencia::create($request->validated());
        return response()->json(new CompetenciaResource($competencia), 201);
    }

    public function update(CompetenciaRequest $request, Competencia $competencia): JsonResponse
    {
        $competencia->update($request->validated());
        return response()->json(new CompetenciaResource($competencia));
    }

    public function destroy(Competencia $competencia): \Illuminate\Http\Response
    {
        $competencia->delete();
        return response()->noContent();
    }
}
