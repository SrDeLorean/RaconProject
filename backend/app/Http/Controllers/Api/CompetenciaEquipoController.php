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

        return response()->json(['message' => 'Estado de inscripción actualizado.']);
    }

    // 5. Expulsar / Dar de baja a un equipo del torneo
    public function destroy(Competencia $competencia, $equipo_id)
    {
        $competencia->equipos()->detach($equipo_id);
        return response()->json(['message' => 'El club ha sido dado de baja del torneo.']);
    }
}
