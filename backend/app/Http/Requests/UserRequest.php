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
            'gamertag'         => ['nullable', 'string', 'max:255', Rule::unique('users', 'gamertag')->ignore($userId)],
            'id_ea'            => ['nullable', 'string', 'max:255', Rule::unique('users', 'id_ea')->ignore($userId)],
            'plataforma'       => ['nullable', 'in:ps5,xbox,pc,crossplay'],

            // Campos de perfil (Corregidos los tipos numéricos y fechas)
            'foto'             => ['nullable', 'string', 'max:255'],
            'nacionalidad'     => ['nullable', 'string', 'max:255'],
            'posicion'         => ['nullable', 'string', 'max:255'],
            'fecha_nacimiento' => ['nullable', 'date'], // Ahora valida que sea una fecha real
            'altura'           => ['nullable', 'integer', 'min:100', 'max:250'], // Entero (cm)
            'peso'             => ['nullable', 'integer', 'min:30', 'max:200'],  // Entero (kg)
            'telefono'         => ['nullable', 'string', 'max:255'],
            'biografia'        => ['nullable', 'string'],

            // Redes Sociales
            'instagram'        => ['nullable', 'string', 'max:255'],
            'facebook'         => ['nullable', 'string', 'max:255'],
            'twitch'           => ['nullable', 'string', 'max:255'],
            'youtube'          => ['nullable', 'string', 'max:255'],
            'tiktok'           => ['nullable', 'string', 'max:255'],
        ];
    }
}
