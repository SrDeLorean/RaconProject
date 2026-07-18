<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EquipoUt;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class InscripcionUTController extends Controller
{
    /**
     * Actualizar estado de inscripción de un equipo UT.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'estado_inscripcion' => 'required|in:pendiente,aprobado,rechazado',
            'competencia_ut_id' => 'nullable|exists:competencias_ut,id'
        ]);

        $query = DB::table('competencia_equipo_ut')->where('equipo_ut_id', $id);
        
        // Si se provee la competencia, filtramos para ser específicos
        if ($request->filled('competencia_ut_id')) {
            $query->where('competencia_ut_id', $request->competencia_ut_id);
        }

        $query->update([
            'estado_inscripcion' => $validated['estado_inscripcion'],
            'updated_at' => now()
        ]);

        // Obtener el ID de la competencia para invalidar la caché
        $pivot = DB::table('competencia_equipo_ut')->where('equipo_ut_id', $id)->first();
        if ($pivot) {
            Cache::forget('competencia_ut_show_' . $pivot->competencia_ut_id);
        }

        return response()->json([
            'success' => true,
            'message' => 'Estado de inscripción actualizado.'
        ]);
    }

    /**
     * Eliminar (dar de baja) una inscripción y el equipo UT.
     */
    public function destroy(\Illuminate\Http\Request $request, $id): JsonResponse
    {
        $pivot = DB::table('competencia_equipo_ut')->where('equipo_ut_id', $id)->first();
        
        if ($pivot) {
            $competenciaUt = \App\Models\CompetenciaUt::find($pivot->competencia_ut_id);
            if ($competenciaUt && $competenciaUt->partidos()->exists() && !$request->boolean('force')) {
                return response()->json([
                    'message' => 'No se puede dar de baja directamente porque el torneo ya tiene un calendario generado. Utiliza las opciones de WO o Reemplazo.'
                ], 422);
            }
            
            if ($competenciaUt && $request->boolean('force')) {
                \App\Models\PartidoUt::where('competencia_ut_id', $competenciaUt->id)
                    ->where(function ($q) use ($id) {
                        $q->where('equipo_local_id', $id)
                          ->orWhere('equipo_visitante_id', $id);
                    })
                    ->delete();
            }
            Cache::forget('competencia_ut_show_' . $pivot->competencia_ut_id);
        }

        // Eliminar relación pivot
        DB::table('competencia_equipo_ut')->where('equipo_ut_id', $id)->delete();

        // Eliminar equipo UT
        $equipo = EquipoUt::find($id);
        if ($equipo) {
            $equipo->delete();
        }

        return response()->json(null, 204);
    }
}
