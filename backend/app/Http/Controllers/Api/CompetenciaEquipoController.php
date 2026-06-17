<?php

namespace App\Http\Controllers\Api;

use App\Models\Competencia;
use App\Models\Equipo; // 🔥 IMPORTACIÓN FALTANTE CORREGIDA
use App\Models\CompetenciaEquipo;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class CompetenciaEquipoController extends Controller
{
    // 1. Obtener los equipos actualmente inscritos en la competencia
    public function index(Competencia $competencia)
    {
        // Traemos los equipos y los datos de la tabla pivote (estado_inscripcion)
        $equipos = $competencia->equipos()
            ->with('capitan:id,name,gamertag')
            ->get();

        return response()->json($equipos);
    }

    // 2. Buscar equipos globales que AÚN NO estén en esta competencia (Autocomplete)
    public function disponibles(Request $request, Competencia $competencia)
    {
        // Usamos whereDoesntHave, que es mucho más eficiente que un whereNotIn con pluck
        $query = Equipo::where('estado', true)
            ->whereDoesntHave('competencias', function ($q) use ($competencia) {
                $q->where('competencias.id', $competencia->id);
            });

        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('nombre', 'like', '%' . $searchTerm . '%')
                  ->orWhere('abreviatura', 'like', '%' . $searchTerm . '%');
            });
        }

        // Devolvemos 10 para el combo de búsqueda del frontend
        return response()->json($query->take(10)->get());
    }

    // 3. Asignar (Inscribir) un nuevo equipo a la división
    public function store(Request $request, Competencia $competencia)
    {
        $request->validate(['equipo_id' => 'required|exists:equipos,id']);

        // Blindaje: Comprobar límite de cupos
        if ($competencia->equipos()->count() >= $competencia->max_participantes) {
            return response()->json([
                'message' => "La competencia ha alcanzado su límite máximo de {$competencia->max_participantes} participantes."
            ], 422);
        }

        // Blindaje: Comprobar que no esté ya inscrito (doble check de seguridad)
        if ($competencia->equipos()->where('equipo_id', $request->equipo_id)->exists()) {
            return response()->json([
                'message' => 'El club ya se encuentra inscrito en esta división.'
            ], 422);
        }

        // Lo inscribimos por defecto como "aprobado" (ya que lo hace el admin)
        $competencia->equipos()->attach($request->equipo_id, [
            'estado_inscripcion' => $request->estado_inscripcion ?? 'aprobado'
        ]);

        \Illuminate\Support\Facades\Cache::forget('competencia_show_' . $competencia->id);

        return response()->json(['message' => 'Club asignado a la división correctamente.']);
    }

    // 4. Actualizar el estado de inscripción (Pendiente -> Aprobado -> Rechazado)
    public function update(Request $request, Competencia $competencia, $equipo_id)
    {
        $request->validate(['estado_inscripcion' => 'required|in:pendiente,aprobado,rechazado']);

        // Actualizamos la tabla pivote
        $competencia->equipos()->updateExistingPivot($equipo_id, [
            'estado_inscripcion' => $request->estado_inscripcion
        ]);

        \Illuminate\Support\Facades\Cache::forget('competencia_show_' . $competencia->id);

        return response()->json(['message' => 'Estado de inscripción actualizado.']);
    }

    // 5. Expulsar / Dar de baja a un equipo del torneo
    public function destroy(Competencia $competencia, $equipo_id)
    {
        if ($competencia->partidos()->exists()) {
            return response()->json([
                'message' => 'No se puede dar de baja directamente porque la competencia ya tiene un calendario generado. Utiliza las opciones de WO o Reemplazo.'
            ], 422);
        }

        $competencia->equipos()->detach($equipo_id);
        
        \Illuminate\Support\Facades\Cache::forget('competencia_show_' . $competencia->id);

        return response()->json(['message' => 'El club ha sido dado de baja del torneo.']);
    }

    /**
     * Dar Walkover (WO) a todos los partidos de un equipo en la competencia.
     */
    public function darWO(Competencia $competencia, $equipo_id)
    {
        $partidos = \App\Models\Partido::where('competencia_id', $competencia->id)
            ->where(function ($q) use ($equipo_id) {
                $q->where('equipo_local_id', $equipo_id)
                  ->orWhere('equipo_visitante_id', $equipo_id);
            })
            ->get();

        foreach ($partidos as $partido) {
            if ($partido->equipo_local_id == $equipo_id) {
                $partido->goles_local = 0;
                $partido->goles_visitante = 3;
            } else {
                $partido->goles_local = 3;
                $partido->goles_visitante = 0;
            }

            $stats = $partido->stats ?? [];
            $stats['is_wo'] = true;
            $stats['wo_team_id'] = (int) $equipo_id;
            $partido->stats = $stats;
            
            $partido->reporte_confirmado = true;
            $partido->save();
        }

        \Illuminate\Support\Facades\Cache::forget('competencia_show_' . $competencia->id);

        return response()->json([
            'success' => true,
            'message' => 'Se ha aplicado Walkover (WO) a todos los partidos del club en esta competencia.'
        ]);
    }

    /**
     * Reemplazar un equipo por otro en el calendario/fixture.
     */
    public function reemplazar(Competencia $competencia, $equipo_id, Request $request)
    {
        $request->validate([
            'nuevo_equipo_id' => 'required|exists:equipos,id'
        ]);

        $nuevo_equipo_id = $request->nuevo_equipo_id;

        if ($competencia->equipos()->where('equipo_id', $nuevo_equipo_id)->exists()) {
            return response()->json([
                'message' => 'El nuevo club ya se encuentra inscrito en esta competencia.'
            ], 422);
        }

        // Reemplazar en la tabla pivot
        $competencia->equipos()->detach($equipo_id);
        $competencia->equipos()->attach($nuevo_equipo_id, ['estado_inscripcion' => 'aprobado']);

        // Actualizar partidos (tanto jugados como pendientes)
        \App\Models\Partido::where('competencia_id', $competencia->id)
            ->where('equipo_local_id', $equipo_id)
            ->update(['equipo_local_id' => $nuevo_equipo_id]);

        \App\Models\Partido::where('competencia_id', $competencia->id)
            ->where('equipo_visitante_id', $equipo_id)
            ->update(['equipo_visitante_id' => $nuevo_equipo_id]);

        // Actualizar estadísticas de equipo
        \App\Models\EstadisticaEquipo::where('competencia_id', $competencia->id)
            ->where('equipo_id', $equipo_id)
            ->update(['equipo_id' => $nuevo_equipo_id]);

        // Actualizar estadísticas de jugadores
        \App\Models\EstadisticaJugador::where('competencia_id', $competencia->id)
            ->where('equipo_id', $equipo_id)
            ->update(['equipo_id' => $nuevo_equipo_id]);

        \Illuminate\Support\Facades\Cache::forget('competencia_show_' . $competencia->id);

        return response()->json([
            'success' => true,
            'message' => 'El club ha sido reemplazado correctamente en el calendario, estadísticas y la competencia.'
        ]);
    }
}
