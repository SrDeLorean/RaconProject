<?php

namespace App\Http\Controllers\Api;

use App\Models\Competencia;
use Illuminate\Http\Request;
use App\Http\Requests\CompetenciaRequest;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\CompetenciaResource;
use Illuminate\Support\Facades\Cache;

class CompetenciaController extends Controller
{
    public function index(Request $request)
    {
        $user = auth('sanctum')->user();

        if ($request->boolean('for_organizer') && $user) {
            // 1. Identificamos la organización que administra este usuario
            $organizacion = \App\Models\Organizacion::where('owner_id', $user->id)->first();

            if (!$organizacion) {
                // Si es admin, dejamos ver todas; de lo contrario, listado vacío limpio en vez de 404
                $role = $user->role;
                if ($role === 'admin' || $role === 'administrador') {
                    $query = Competencia::query();
                } else {
                    return response()->json(['data' => [], 'total' => 0]);
                }
            } else {
                // 2. Traemos todas las competencias cuyas temporadas pertenezcan a su organización
                $query = Competencia::whereHas('temporada', function ($q) use ($organizacion) {
                    $q->where('organizacion_id', $organizacion->id);
                });
            }
        } else {
            $query = Competencia::query();
        }

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
        $query->with(['temporada.organizacion'])->withCount('equipos')->latest();

        return response()->json($query->paginate($request->per_page ?? 10));
    }

    public function show(Competencia $competencia)
    {
        $cacheKey = 'competencia_show_' . $competencia->id;
        $data = Cache::remember($cacheKey, now()->addMinutes(5), function () use ($competencia) {
            $competencia->load([
                'equipos',
                'temporada.organizacion',
                'partidos.local',
                'partidos.visitante',
                'campeon',
                'subcampeon',
                'tercerLugar',
            ]);
            return ['data' => $competencia];
        });

        return response()->json($data);
    }

    public function store(CompetenciaRequest $request): JsonResponse
    {
        $competencia = Competencia::create($request->validated());
        return response()->json(new CompetenciaResource($competencia), 201);
    }

    public function update(CompetenciaRequest $request, Competencia $competencia): JsonResponse
    {
        $validated = $request->validated();

        // Delete old logo if updated
        if (array_key_exists('logo', $validated) && $validated['logo'] !== $competencia->logo) {
            $oldLogo = $competencia->logo;
            if ($oldLogo && str_contains($oldLogo, 'uploads/') && !str_starts_with($oldLogo, 'http')) {
                $fullPath = public_path(ltrim($oldLogo, '/'));
                if (file_exists($fullPath) && is_file($fullPath)) {
                    @unlink($fullPath);
                }
            }
        }

        // Delete old banner if updated
        if (array_key_exists('banner', $validated) && $validated['banner'] !== $competencia->banner) {
            $oldBanner = $competencia->banner;
            if ($oldBanner && str_contains($oldBanner, 'uploads/') && !str_starts_with($oldBanner, 'http')) {
                $fullPath = public_path(ltrim($oldBanner, '/'));
                if (file_exists($fullPath) && is_file($fullPath)) {
                    @unlink($fullPath);
                }
            }
        }

        $competencia->update($validated);
        Cache::forget('competencia_show_' . $competencia->id);
        return response()->json(new CompetenciaResource($competencia));
    }

    public function destroy(Competencia $competencia): \Illuminate\Http\Response|\Illuminate\Http\JsonResponse
    {
        $partidosCount = $competencia->partidos()->count();

        if ($partidosCount > 0) {
            return response()->json([
                'message' => 'No es posible eliminar esta competencia porque ya tiene partidos registrados. Para borrar la competencia, primero necesitas eliminar todos los partidos asociados.'
            ], 422);
        }

        Cache::forget('competencia_show_' . $competencia->id);
        $competencia->delete();
        return response()->noContent();
    }
}
