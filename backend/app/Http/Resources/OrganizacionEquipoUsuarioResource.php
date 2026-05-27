<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class OrganizacionEquipoUsuarioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('roster') ? $this->route('roster') : null;

        return [
            'organizacion_id' => ['required', 'exists:organizaciones,id'],
            'equipo_id'       => ['required', 'exists:equipos,id'],

            // 🔥 REGLA CRÍTICA: Un jugador solo puede pertenecer a un club por organización a la vez
            'user_id' => [
                'required',
                'exists:users,id',
                Rule::unique('organizacion_equipo_usuario')->where(function ($query) {
                    return $query->where('organizacion_id', $this->organizacion_id);
                })->ignore($id)
            ],

            'estado_fichaje'  => ['required', 'in:activo,a_prueba,transferible,suspendido'],
        ];
    }

    public function messages(): array
    {
        return [
            'user_id.unique' => 'El competidor ya se encuentra inscrito en un roster activo dentro de esta organización.',
        ];
    }
}
