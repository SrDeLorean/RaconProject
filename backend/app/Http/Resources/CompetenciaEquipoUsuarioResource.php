<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CompetenciaEquipoUsuarioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('nomina') ? $this->route('nomina') : null;

        return [
            'competencia_id'   => ['required', 'exists:competencias,id'],
            'equipo_id'        => ['required', 'exists:equipos,id'],

            // 🔥 REGLA CRÍTICA: Un jugador no puede ser inscrito en dos nóminas del mismo torneo
            'user_id' => [
                'required',
                'exists:users,id',
                Rule::unique('competencia_equipo_usuario')->where(function ($query) {
                    return $query->where('competencia_id', $this->competencia_id);
                })->ignore($id)
            ],

            // Configuraciones tácticas en el torneo
            'dorsal'           => ['nullable', 'integer', 'between:1,99'],
            'posicion_bloque'  => ['nullable', 'string', 'in:POR,DEF,MED,DEL,DFC,DC,MC,MCO,MI,MD'],
        ];
    }

    public function messages(): array
    {
        return [
            'user_id.unique' => 'Este competidor ya fue registrado en la nómina de un equipo para este torneo.',
            'dorsal.between' => 'El dorsal debe ser un número válido entre 1 y 99.',
            'posicion_bloque.in' => 'La posición táctica seleccionada no es válida.',
        ];
    }
}
