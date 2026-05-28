<?php

namespace App\Http\Controllers\Api;

use App\Models\Partido;
use App\Models\Competencia;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;

class PartidoController extends Controller
{
    /**
     * Listar partidos con soporte de filtros: competencia_id, organizacion_id.
     * Incluye la cadena competencia→temporada→organizacion para que el front
     * pueda construir los filtros sin llamadas extra.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Partido::with([
            'local',
            'visitante',
            'competencia.temporada.organizacion',
        ]);

        if ($request->filled('competencia_id')) {
            $query->where('competencia_id', $request->competencia_id);
        }

        if ($request->filled('organizacion_id')) {
            $query->whereHas('competencia.temporada', function ($q) use ($request) {
                $q->where('organizacion_id', $request->organizacion_id);
            });
        }

        if ($request->filled('equipo_id')) {
            $query->where(function ($q) use ($request) {
                $q->where('equipo_local_id', $request->equipo_id)
                  ->orWhere('equipo_visitante_id', $request->equipo_id);
            });
        }

        return response()->json($query->orderBy('fecha')->orderBy('hora')->get());
    }

    /**
     * Guardar o actualizar de forma masiva los partidos oficiales desde el Matchmaker.
     */
    public function bulkStore(Request $request, Competencia $competencia): JsonResponse
    {
        $request->validate([
            'partidos' => 'required|array',
            'partidos.*.jornada' => 'required|string',
            'partidos.*.fecha' => 'nullable|string',
            'partidos.*.hora' => 'nullable|string',
            'partidos.*.local.id' => 'required',
            'partidos.*.visitante.id' => 'required',
        ]);

        // Limpiar partidos previos para regenerar
        Partido::where('competencia_id', $competencia->id)->delete();

        $saved = [];
        foreach ($request->input('partidos') as $pData) {
            // Ignorar descansos "BYE"
            if ($pData['local']['id'] === 'bye' || $pData['visitante']['id'] === 'bye') {
                continue;
            }

            $localId = is_numeric($pData['local']['id']) ? $pData['local']['id'] : null;
            $visitanteId = is_numeric($pData['visitante']['id']) ? $pData['visitante']['id'] : null;

            $partido = Partido::create([
                'competencia_id' => $competencia->id,
                'equipo_local_id' => $localId,
                'equipo_visitante_id' => $visitanteId,
                'jornada' => $pData['jornada'],
                'grupo' => $pData['grupo'] ?? null,
                'fecha' => $pData['fecha'] ?? null,
                'hora' => $pData['hora'] ?? null,
                'goles_local' => isset($pData['score_local']) ? $pData['score_local'] : null,
                'goles_visitante' => isset($pData['score_visitante']) ? $pData['score_visitante'] : null,
                'stats' => $pData['stats'] ?? null,
            ]);
            $saved[] = $partido;
        }

        return response()->json([
            'message' => 'Fixture persistido exitosamente en la base de datos.',
            'count' => count($saved)
        ]);
    }

    /**
     * Actualizar una ficha/marcador particular.
     */
    public function update(Request $request, Partido $partido): JsonResponse
    {
        $user = auth()->user();
        $partido->load(['local', 'visitante']);

        $isOrganizerOrAdmin = in_array($user->role, ['administrador', 'organizador']);
        $isHomeCaptain = $partido->local && $partido->local->id_capitan == $user->id;
        $isAwayCaptain = $partido->visitante && $partido->visitante->id_capitan == $user->id;

        if (!$isOrganizerOrAdmin && !$isHomeCaptain && !$isAwayCaptain) {
            return response()->json(['message' => 'No tienes permiso para actualizar este partido.'], 403);
        }

        if (!$isOrganizerOrAdmin && $partido->goles_local !== null && $partido->goles_visitante !== null) {
            return response()->json(['message' => 'Este partido ya ha sido reportado y cerrado por el capitán correspondiente.'], 422);
        }

        $partido->update($request->only([
            'goles_local',
            'goles_visitante',
            'fecha',
            'hora',
            'stats'
        ]));

        return response()->json([
            'message' => 'Partido actualizado con éxito.',
            'partido' => $partido
        ]);
    }
}
