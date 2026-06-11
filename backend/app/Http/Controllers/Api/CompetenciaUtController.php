<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CompetenciaUt;
use App\Models\EquipoUt;
use App\Models\Organizacion;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class CompetenciaUtController extends Controller
{
    public function index(Request $request)
    {
        $user = auth('sanctum')->user();
        $query = CompetenciaUt::query();

        if ($request->boolean('for_organizer') && $user) {
            $organizacion = Organizacion::where('owner_id', $user->id)->first();

            if (!$organizacion) {
                if ($user->role === 'administrador') {
                    // Admin can see everything
                } else {
                    return response()->json(['data' => [], 'total' => 0]);
                }
            } else {
                $query->whereHas('temporada', function ($q) use ($organizacion) {
                    $q->where('organizacion_id', $organizacion->id);
                });
            }
        }

        if ($request->filled('temporada_id')) {
            $query->where('temporada_id', $request->temporada_id);
        }

        if ($request->filled('jugador_id')) {
            $jugadorId = $request->jugador_id;
            $query->whereHas('equipos', function ($q) use ($jugadorId) {
                $q->where('id_capitan', $jugadorId)
                  ->orWhere('id_companero', $jugadorId);
            });
        }

        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('nombre', 'like', '%' . $searchTerm . '%')
                  ->orWhere('slug', 'like', '%' . $searchTerm . '%');
            });
        }

        if ($request->filled('estado') && $request->estado !== 'todos') {
            $query->where('estado', $request->estado);
        }

        if ($request->filled('tipo') && $request->tipo !== 'todos') {
            $query->where('tipo', $request->tipo);
        }

        $query->with(['temporada.organizacion'])->withCount('equipos')->latest();

        return response()->json($query->paginate($request->per_page ?? 10));
    }

    public function show($id)
    {
        $cacheKey = 'competencia_ut_show_' . $id;
        $data = Cache::remember($cacheKey, now()->addMinutes(5), function () use ($id) {
            $competencia = CompetenciaUt::with([
                'equipos.capitan',
                'equipos.companero',
                'temporada.organizacion',
                'partidos.local.capitan:id,name,gamertag',
                'partidos.local.companero:id,name,gamertag',
                'partidos.visitante.capitan:id,name,gamertag',
                'partidos.visitante.companero:id,name,gamertag',
                'partidos.estadisticasJugadores.jugador:id,name,gamertag',
            ])->findOrFail($id);
            return ['data' => $competencia];
        });

        return response()->json($data);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'temporada_id' => 'required|exists:temporadas,id',
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'reglas' => 'nullable|string',
            'logo' => 'nullable|string',
            'banner' => 'nullable|string',
            'color_tema' => 'nullable|string|max:7',
            'tipo' => 'required|in:1vs1,2vs2',
            'formato' => 'required|in:liga,copa,eliminatoria',
            'plataforma' => 'required|in:ps5,xbox,pc,crossplay',
            'prize_pool' => 'required|numeric|min:0',
            'entry_fee' => 'required|numeric|min:0',
            'max_participantes' => 'required|integer|min:2',
            'es_publico' => 'required|boolean',
            'estado' => 'required|in:borrador,inscripciones,en_curso,finalizada',
            'fecha_inicio_inscripciones' => 'nullable|date',
            'fecha_fin_inscripciones' => 'nullable|date',
            'fecha_inicio_competencia' => 'nullable|date',
        ]);

        $data['slug'] = Str::slug($data['nombre']) . '-' . uniqid();
        if (empty($data['color_tema'])) {
            $data['color_tema'] = '#ef4444';
        }

        $competencia = CompetenciaUt::create($data);

        return response()->json(['data' => $competencia], 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $competencia = CompetenciaUt::findOrFail($id);

        $data = $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'reglas' => 'nullable|string',
            'logo' => 'nullable|string',
            'banner' => 'nullable|string',
            'color_tema' => 'nullable|string|max:7',
            'tipo' => 'required|in:1vs1,2vs2',
            'formato' => 'required|in:liga,copa,eliminatoria',
            'plataforma' => 'required|in:ps5,xbox,pc,crossplay',
            'prize_pool' => 'required|numeric|min:0',
            'entry_fee' => 'required|numeric|min:0',
            'max_participantes' => 'required|integer|min:2',
            'es_publico' => 'required|boolean',
            'estado' => 'required|in:borrador,inscripciones,en_curso,finalizada',
            'fecha_inicio_inscripciones' => 'nullable|date',
            'fecha_fin_inscripciones' => 'nullable|date',
            'fecha_inicio_competencia' => 'nullable|date',
        ]);

        if ($competencia->nombre !== $data['nombre']) {
            $data['slug'] = Str::slug($data['nombre']) . '-' . uniqid();
        }

        $competencia->update($data);
        Cache::forget('competencia_ut_show_' . $competencia->id);

        return response()->json(['data' => $competencia]);
    }

    public function destroy($id): JsonResponse
    {
        $competencia = CompetenciaUt::findOrFail($id);
        Cache::forget('competencia_ut_show_' . $competencia->id);
        $competencia->delete();

        return response()->json(null, 204);
    }

    /**
     * Inscribir un equipo (jugador o pareja) en la competencia UT.
     */
    public function inscribir(Request $request, $id): JsonResponse
    {
        $competencia = CompetenciaUt::findOrFail($id);
        $user = Auth::user();

        // Si es organizador o admin, y especifica un usuario manual, inscribimos a ese usuario en su lugar
        if ($request->has('user_id_manual') && in_array($user->role, ['administrador', 'organizador'])) {
            $user = \App\Models\User::findOrFail($request->user_id_manual);
        }

        if ($competencia->estado !== 'inscripciones') {
            return response()->json(['message' => 'Las inscripciones para este torneo están cerradas.'], 422);
        }

        $validated = $request->validate([
            'nombre_equipo' => 'nullable|string|max:50',
            'club_id_ea' => 'nullable|string|max:50',
            'id_companero' => 'nullable|exists:users,id',
        ]);

        if ($competencia->tipo === '2vs2' && empty($validated['id_companero'])) {
            return response()->json(['message' => 'Debes seleccionar un compañero para la modalidad 2vs2.'], 422);
        }

        // Autogenerar nombre de equipo basado en gamertag/nombre
        $capitanName = $user->gamertag ?: $user->name;
        $nombreEquipo = $capitanName;
        
        if ($competencia->tipo === '2vs2' && !empty($validated['id_companero'])) {
            $companero = \App\Models\User::find($validated['id_companero']);
            $companeroName = $companero ? ($companero->gamertag ?: $companero->name) : 'Dúo';
            $nombreEquipo = $capitanName . ' / ' . $companeroName;
        }

        // Verificar si ya está inscrito el capitán
        $alreadyRegistered = DB::table('competencia_equipo_ut')
            ->join('equipos_ut', 'competencia_equipo_ut.equipo_ut_id', '=', 'equipos_ut.id')
            ->where('competencia_equipo_ut.competencia_ut_id', $competencia->id)
            ->where(function ($q) use ($user) {
                $q->where('equipos_ut.id_capitan', $user->id)
                  ->orWhere('equipos_ut.id_companero', $user->id);
            })
            ->exists();

        if ($alreadyRegistered) {
            return response()->json(['message' => 'Ya te encuentras inscrito en este torneo.'], 422);
        }

        // Verificar si el compañero ya está inscrito
        if ($competencia->tipo === '2vs2' && !empty($validated['id_companero'])) {
            if ($validated['id_companero'] == $user->id) {
                return response()->json(['message' => 'No puedes seleccionarte a ti mismo como compañero.'], 422);
            }

            $partnerRegistered = DB::table('competencia_equipo_ut')
                ->join('equipos_ut', 'competencia_equipo_ut.equipo_ut_id', '=', 'equipos_ut.id')
                ->where('competencia_equipo_ut.competencia_ut_id', $competencia->id)
                ->where(function ($q) use ($validated) {
                    $q->where('equipos_ut.id_capitan', $validated['id_companero'])
                      ->orWhere('equipos_ut.id_companero', $validated['id_companero']);
                })
                ->exists();

            if ($partnerRegistered) {
                return response()->json(['message' => 'El compañero seleccionado ya está inscrito en este torneo.'], 422);
            }
        }

        // Verificar cupos
        $inscritosCount = $competencia->equipos()->count();
        if ($inscritosCount >= $competencia->max_participantes) {
            return response()->json(['message' => 'El torneo ha alcanzado el límite máximo de participantes.'], 422);
        }

        // Crear el equipo UT
        $equipoUt = EquipoUt::create([
            'nombre' => $nombreEquipo,
            'club_id_ea' => $validated['club_id_ea'] ?? null,
            'plataforma' => $competencia->plataforma,
            'id_capitan' => $user->id,
            'id_companero' => $competencia->tipo === '2vs2' ? $validated['id_companero'] : null,
            'estado' => true,
        ]);

        // Asociar a la competencia
        $competencia->equipos()->attach($equipoUt->id, ['estado_inscripcion' => 'aprobado']);

        Cache::forget('competencia_ut_show_' . $competencia->id);

        return response()->json([
            'success' => true,
            'message' => 'Inscripción realizada exitosamente.',
            'equipo' => $equipoUt
        ], 201);
    }
}
