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
                'campeon',
                'subcampeon',
                'tercerLugar',
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
            'campeon_id' => 'nullable|exists:equipos_ut,id',
            'subcampeon_id' => 'nullable|exists:equipos_ut,id',
            'tercer_lugar_id' => 'nullable|exists:equipos_ut,id',
            'config' => 'nullable|array',
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
            'campeon_id' => 'nullable|exists:equipos_ut,id',
            'subcampeon_id' => 'nullable|exists:equipos_ut,id',
            'tercer_lugar_id' => 'nullable|exists:equipos_ut,id',
            'config' => 'nullable|array',
        ]);

        if ($competencia->nombre !== $data['nombre']) {
            $data['slug'] = Str::slug($data['nombre']) . '-' . uniqid();
        }

        // Delete old logo if updated
        if (array_key_exists('logo', $data) && $data['logo'] !== $competencia->logo) {
            $oldLogo = $competencia->logo;
            if ($oldLogo && str_contains($oldLogo, 'uploads/') && !str_starts_with($oldLogo, 'http')) {
                $fullPath = public_path(ltrim($oldLogo, '/'));
                if (file_exists($fullPath) && is_file($fullPath)) {
                    @unlink($fullPath);
                }
            }
        }

        // Delete old banner if updated
        if (array_key_exists('banner', $data) && $data['banner'] !== $competencia->banner) {
            $oldBanner = $competencia->banner;
            if ($oldBanner && str_contains($oldBanner, 'uploads/') && !str_starts_with($oldBanner, 'http')) {
                $fullPath = public_path(ltrim($oldBanner, '/'));
                if (file_exists($fullPath) && is_file($fullPath)) {
                    @unlink($fullPath);
                }
            }
        }

        $competencia->update($data);
        Cache::forget('competencia_ut_show_' . $competencia->id);

        return response()->json(['data' => $competencia]);
    }

    public function destroy($id): JsonResponse
    {
        $competencia = CompetenciaUt::findOrFail($id);

        $partidosCount = $competencia->partidos()->count();

        if ($partidosCount > 0) {
            return response()->json([
                'message' => 'No es posible eliminar esta competencia porque ya tiene partidos registrados. Para borrar la competencia, primero necesitas eliminar todos los partidos asociados.'
            ], 422);
        }

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

        // Usar el nombre de equipo proporcionado, o autogenerar basado en gamertag/nombre
        $nombreEquipo = $validated['nombre_equipo'] ?? null;
        
        if (empty($nombreEquipo)) {
            $capitanName = $user->gamertag ?: $user->name;
            $nombreEquipo = $capitanName;
            
            if ($competencia->tipo === '2vs2' && !empty($validated['id_companero'])) {
                $companero = \App\Models\User::find($validated['id_companero']);
                $companeroName = $companero ? ($companero->gamertag ?: $companero->name) : 'Dúo';
                $nombreEquipo = $capitanName . ' / ' . $companeroName;
            }
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

    /**
     * Dar Walkover (WO) a todos los partidos de un equipo UT en la competencia.
     */
    public function darWO($id, $equipo_ut_id)
    {
        $competenciaUt = CompetenciaUt::findOrFail($id);

        $partidos = \App\Models\PartidoUt::where('competencia_ut_id', $competenciaUt->id)
            ->where(function ($q) use ($equipo_ut_id) {
                $q->where('equipo_ut_local_id', $equipo_ut_id)
                  ->orWhere('equipo_ut_visitante_id', $equipo_ut_id);
            })
            ->get();

        foreach ($partidos as $partido) {
            if ($partido->equipo_ut_local_id == $equipo_ut_id) {
                $partido->goles_local = 0;
                $partido->goles_visitante = 3;
            } else {
                $partido->goles_local = 3;
                $partido->goles_visitante = 0;
            }

            $stats = $partido->stats ?? [];
            $stats['is_wo'] = true;
            $stats['wo_team_id'] = (int) $equipo_ut_id;
            $partido->stats = $stats;
            
            $partido->reporte_confirmado = true;
            $partido->save();
        }

        Cache::forget('competencia_ut_show_' . $competenciaUt->id);

        return response()->json([
            'success' => true,
            'message' => 'Se ha aplicado Walkover (WO) a todos los partidos del participante en este torneo.'
        ]);
    }

    /**
     * Reemplazar un equipo UT por otro (creado con capitán y demás datos) en el calendario/fixture.
     */
    public function reemplazar(Request $request, $id, $equipo_ut_id)
    {
        $competenciaUt = CompetenciaUt::findOrFail($id);

        $validated = $request->validate([
            'user_id_manual' => 'required|exists:users,id',
            'nombre_equipo' => 'required|string|max:255',
            'club_id_ea' => 'nullable|string|max:50',
            'id_companero' => 'nullable|exists:users,id',
        ]);

        // Verificar si el nuevo capitán ya está inscrito
        $newCaptainId = $validated['user_id_manual'];
        $alreadyRegistered = DB::table('competencia_equipo_ut')
            ->join('equipos_ut', 'competencia_equipo_ut.equipo_ut_id', '=', 'equipos_ut.id')
            ->where('competencia_equipo_ut.competencia_ut_id', $competenciaUt->id)
            ->where(function ($q) use ($newCaptainId) {
                $q->where('equipos_ut.id_capitan', $newCaptainId)
                  ->orWhere('equipos_ut.id_companero', $newCaptainId);
            })
            ->exists();

        if ($alreadyRegistered) {
            return response()->json(['message' => 'El nuevo participante ya se encuentra inscrito en este torneo.'], 422);
        }

        // Verificar si el compañero ya está inscrito
        if ($competenciaUt->tipo === '2vs2' && !empty($validated['id_companero'])) {
            if ($validated['id_companero'] == $newCaptainId) {
                return response()->json(['message' => 'No puedes seleccionar al mismo usuario como capitán y compañero.'], 422);
            }

            $partnerRegistered = DB::table('competencia_equipo_ut')
                ->join('equipos_ut', 'competencia_equipo_ut.equipo_ut_id', '=', 'equipos_ut.id')
                ->where('competencia_equipo_ut.competencia_ut_id', $competenciaUt->id)
                ->where(function ($q) use ($validated) {
                    $q->where('equipos_ut.id_capitan', $validated['id_companero'])
                      ->orWhere('equipos_ut.id_companero', $validated['id_companero']);
                })
                ->exists();

            if ($partnerRegistered) {
                return response()->json(['message' => 'El compañero seleccionado ya está inscrito en este torneo.'], 422);
            }
        }

        // Crear el nuevo equipo UT
        $nuevoEquipoUt = EquipoUt::create([
            'nombre' => $validated['nombre_equipo'],
            'club_id_ea' => $validated['club_id_ea'] ?? null,
            'plataforma' => $competenciaUt->plataforma,
            'id_capitan' => $newCaptainId,
            'id_companero' => $competenciaUt->tipo === '2vs2' ? $validated['id_companero'] : null,
            'estado' => true,
        ]);

        // Asociar nuevo equipo pivot
        $competenciaUt->equipos()->attach($nuevoEquipoUt->id, ['estado_inscripcion' => 'aprobado']);

        // Desasociar el viejo
        $competenciaUt->equipos()->detach($equipo_ut_id);

        // Actualizar partidos (tanto jugados como pendientes)
        \App\Models\PartidoUt::where('competencia_ut_id', $competenciaUt->id)
            ->where('equipo_ut_local_id', $equipo_ut_id)
            ->update(['equipo_ut_local_id' => $nuevoEquipoUt->id]);

        \App\Models\PartidoUt::where('competencia_ut_id', $competenciaUt->id)
            ->where('equipo_ut_visitante_id', $equipo_ut_id)
            ->update(['equipo_ut_visitante_id' => $nuevoEquipoUt->id]);

        // Actualizar estadísticas de equipo UT
        \App\Models\EstadisticaEquipoUt::where('competencia_ut_id', $competenciaUt->id)
            ->where('equipo_ut_id', $equipo_ut_id)
            ->update(['equipo_ut_id' => $nuevoEquipoUt->id]);

        // Actualizar estadísticas de jugadores UT
        \App\Models\EstadisticaJugadorUt::where('competencia_ut_id', $competenciaUt->id)
            ->where('equipo_ut_id', $equipo_ut_id)
            ->update(['equipo_ut_id' => $nuevoEquipoUt->id]);

        // Eliminar el viejo equipo UT ya que fue completamente reemplazado y sus partidos reasignados
        $viejoEquipo = EquipoUt::find($equipo_ut_id);
        if ($viejoEquipo) {
            $viejoEquipo->delete();
        }

        Cache::forget('competencia_ut_show_' . $competenciaUt->id);

        return response()->json([
            'success' => true,
            'message' => 'El participante ha sido reemplazado correctamente en el calendario y el torneo.'
        ]);
    }
}
