<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Requests\UserRequest;
use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;

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
