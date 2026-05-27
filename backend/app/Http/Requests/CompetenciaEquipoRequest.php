<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CompetenciaEquipoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('competencia_equipo') ? $this->route('competencia_equipo') : null;

        return [
            'competencia_id' => ['required', 'exists:competencias,id'],

            // Validamos que el equipo exista y que no esté ya inscrito en ESTA competencia específica
            'equipo_id' => [
                'required',
                'exists:equipos,id',
                Rule::unique('competencia_equipo')->where(function ($query) {
                    return $query->where('competencia_id', $this->competencia_id);
                })->ignore($id)
            ],

            'estado_inscripcion' => ['required', 'in:pendiente,aprobado,rechazado'],
        ];
    }

    public function messages(): array
    {
        return [
            'equipo_id.unique' => 'Este equipo ya se encuentra inscrito en la competencia seleccionada.',
        ];
    }
