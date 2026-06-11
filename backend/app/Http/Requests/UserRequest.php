<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $routeParam = $this->route('usuario') ?? $this->route('user');
        $userId = $routeParam ? (is_object($routeParam) ? $routeParam->id : $routeParam) : null;

        return [
            'name'             => ['sometimes', 'required', 'string', 'max:255'],
            'email'            => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($userId)],
            'password'         => $userId ? ['nullable', 'string', 'min:8'] : ['required', 'string', 'min:8'],

            // 🔥 Roles y Estados (Obligatorio para que funcione el Frontend)
            'role'             => ['sometimes', 'required', 'in:jugador,organizador,administrador'],
            'status'           => ['sometimes', 'required', 'in:activo,inactivo,suspendido'],

            // 🔥 Identidades E-Sports
            'gamertag'         => ['sometimes', 'nullable', 'string', 'max:255', Rule::unique('users', 'gamertag')->ignore($userId)],
            'id_ea'            => ['sometimes', 'nullable', 'string', 'max:255', Rule::unique('users', 'id_ea')->ignore($userId)],
            'plataforma'       => ['sometimes', 'nullable', 'in:ps5,xbox,pc,crossplay'],

            // Campos de perfil (Corregidos los tipos numéricos y fechas)
            'foto'             => ['sometimes', 'nullable', 'string', 'max:255'],
            'nacionalidad'     => ['sometimes', 'nullable', 'string', 'max:255'],
            'posicion'         => ['sometimes', 'nullable', 'string', 'max:255'],
            'fecha_nacimiento' => ['sometimes', 'nullable', 'date'], // Ahora valida que sea una fecha real
            'altura'           => ['sometimes', 'nullable', 'integer', 'min:100', 'max:250'], // Entero (cm)
            'peso'             => ['sometimes', 'nullable', 'integer', 'min:30', 'max:200'],  // Entero (kg)
            'telefono'         => ['sometimes', 'nullable', 'string', 'max:255'],
            'biografia'        => ['sometimes', 'nullable', 'string'],

            // Redes Sociales
            'instagram'        => ['sometimes', 'nullable', 'string', 'max:255'],
            'facebook'         => ['sometimes', 'nullable', 'string', 'max:255'],
            'twitch'           => ['sometimes', 'nullable', 'string', 'max:255'],
            'youtube'          => ['sometimes', 'nullable', 'string', 'max:255'],
            'tiktok'           => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }
}
