<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $userId = $this->route('user') ? $this->route('user')->id : null;

        return [
            'name'             => ['required', 'string', 'max:255'],
            'email'            => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($userId)],
            'id_ea'            => ['nullable', 'string', 'max:255'],
            'role'             => ['required', 'in:jugador,organizador,administrador'],
            'password'         => $userId ? ['nullable', 'string', 'min:8'] : ['required', 'string', 'min:8'],

            // Campos de perfil
            'foto'             => ['nullable', 'string', 'max:255'],
            'nacionalidad'     => ['nullable', 'string', 'max:255'],
            'posicion'         => ['nullable', 'string', 'max:255'],
            'fecha_nacimiento' => ['nullable', 'string', 'max:255'],
            'altura'           => ['nullable', 'string', 'max:255'],
            'peso'             => ['nullable', 'string', 'max:255'],
            'telefono'         => ['nullable', 'string', 'max:255'],

            // Redes Sociales
            'instagram'        => ['nullable', 'string', 'max:255'],
            'facebook'         => ['nullable', 'string', 'max:255'],
            'twitch'           => ['nullable', 'string', 'max:255'],
            'youtube'          => ['nullable', 'string', 'max:255'],
            'tiktok'           => ['nullable', 'string', 'max:255'],
        ];
    }
}
