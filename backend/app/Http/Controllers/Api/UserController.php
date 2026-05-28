<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Requests\UserRequest;
use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Equipo;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query();

        // 1. Filtro de Búsqueda Ampliado (Ahora busca también por Gamertag y EA ID)
        $query->when($request->filled('search'), function ($q) use ($request) {
            $searchTerm = $request->search;
            $q->where(function ($query) use ($searchTerm) {
                $query->where('name', 'like', "%{$searchTerm}%")
                      ->orWhere('email', 'like', "%{$searchTerm}%")
                      ->orWhere('gamertag', 'like', "%{$searchTerm}%") // Búsqueda gamer
                      ->orWhere('id_ea', 'like', "%{$searchTerm}%");
            });
        });

        // 2. Filtro por Rol (Dashboard General)
        $query->when($request->filled('role'), function ($q) use ($request) {
            $q->where('role', $request->role);
        });

        // 3. 🔥 NUEVO: Filtro por Estado (Para las pestañas del Organizador: Activo, Inactivo...)
        $query->when($request->filled('status'), function ($q) use ($request) {
            $q->where('status', $request->status);
        });

        $perPage = $request->get('per_page', 10);
        $users = $query->paginate($perPage);

        return UserResource::collection($users);
    }

    public function disponibles(Request $request)
    {
        // 🔥 CORRECCIÓN CRÍTICA: Si no hay búsqueda, devolvemos vacío inmediatamente.
        // Esto evita que se listen todos los usuarios del sistema por error.
        if (!$request->filled('search')) {
            return response()->json([]);
        }

        $query = User::query();

        // 1. OBLIGATORIO: Solo se pueden fichar jugadores (role = 'jugador') y no suspendidos
        $query->where('role', 'jugador')
              ->where('status', '!=', 'suspendido');

        // 2. Búsqueda por texto
        $searchTerm = $request->search;
        $query->where(function ($q) use ($searchTerm) {
            $q->where('name', 'LIKE', '%' . $searchTerm . '%')
            ->orWhere('gamertag', 'LIKE', '%' . $searchTerm . '%')
            ->orWhere('email', 'LIKE', '%' . $searchTerm . '%');
        });

        // 3. Excluir únicamente a los que ya están en NUESTRO equipo en esta misma organización
        $organizacionId = $request->input('organizacion_id')
            ?? DB::table('organizaciones')->where('owner_id', auth()->id())->value('id')
            ?? DB::table('organizaciones')->value('id')
            ?? 1;

        $miEquipo = Equipo::where('id_capitan', auth()->id())->first();

        if ($miEquipo) {
            $inscritosIds = DB::table('organizacion_equipo_usuario')
                ->where('organizacion_id', $organizacionId)
                ->where('equipo_id', $miEquipo->id) // Solo excluir del propio equipo
                ->pluck('user_id')
                ->toArray();

            if (!empty($inscritosIds)) {
                $query->whereNotIn('id', $inscritosIds);
            }
        }

        // 4. Seleccionamos los campos necesarios y mapeamos sus contratos activos por organización
        $jugadoresLibres = $query->select('id', 'name', 'email', 'gamertag', 'posicion')
                                ->take(10)
                                ->get()
                                ->map(function ($jugador) {
                                    $contratos = DB::table('organizacion_equipo_usuario')
                                        ->join('equipos', 'organizacion_equipo_usuario.equipo_id', '=', 'equipos.id')
                                        ->join('organizaciones', 'organizacion_equipo_usuario.organizacion_id', '=', 'organizaciones.id')
                                        ->where('organizacion_equipo_usuario.user_id', $jugador->id)
                                        ->select('equipos.nombre as club', 'organizaciones.nombre as organizacion')
                                        ->get();

                                    return [
                                        'id' => $jugador->id,
                                        'name' => $jugador->name,
                                        'email' => $jugador->email,
                                        'gamertag' => $jugador->gamertag,
                                        'posicion' => $jugador->posicion,
                                        'contratos' => $contratos
                                    ];
                                });

        return response()->json($jugadoresLibres);
    }

    public function store(UserRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Si no tienes configurado 'password' => 'hashed' en tu modelo, actívalo aquí:
        // $validated['password'] = bcrypt($validated['password']);

        $user = User::create($validated);

        return response()->json(new UserResource($user));
    }

    public function show(User $user): JsonResponse
    {
        return response()->json(new UserResource($user));
    }

    public function update(UserRequest $request, User $user): JsonResponse
    {
        $validated = $request->validated();

        // 🔥 CRÍTICO: Si el frontend manda la contraseña vacía (significa que no quiere cambiarla)
        // La removemos del array para no sobrescribir el password con NULL.
        if (empty($validated['password'])) {
            unset($validated['password']);
        }
        // else { $validated['password'] = bcrypt($validated['password']); } // Si no usas casts en el modelo.

        $user->update($validated);

        return response()->json(new UserResource($user));
    }

    public function destroy(User $user): Response
    {
        // Esto ejecutará un Soft Delete automático si configuraste el trait SoftDeletes en el modelo User
        $user->delete();

        return response()->noContent();
    }
}
