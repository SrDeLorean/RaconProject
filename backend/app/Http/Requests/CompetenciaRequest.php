<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CompetenciaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $competenciaId = $this->route('competencia') ? $this->route('competencia')->id : null;

        return [
            // 🔥 CAMBIO CRÍTICO: Reemplazar organizacion_id por temporada_id
            'temporada_id' => ['required', 'exists:temporadas,id'],

            // Datos Básicos
            'nombre'       => ['required', 'string', 'max:255'],
            'slug'         => ['required', 'string', 'max:255', \Illuminate\Validation\Rule::unique('competencias', 'slug')->ignore($competenciaId)],
            'descripcion'  => ['nullable', 'string'],
            'reglas'       => ['nullable', 'string'],
            'banner'       => ['nullable', 'string', 'max:255'],
            'color_tema'   => ['nullable', 'string'], // Quité el Regex estricto por si el input color de HTML envía formatos raros

            // Configuración
            'formato'           => ['required', 'in:liga,copa,eliminatoria'],
            'plataforma'        => ['required', 'in:ps5,xbox,pc,crossplay'],
            'prize_pool'        => ['required', 'numeric', 'min:0'],
            'entry_fee'         => ['required', 'numeric', 'min:0'],
            'max_participantes' => ['required', 'integer', 'min:2', 'max:128'],
            'es_publico'        => ['boolean'],
            'estado'            => ['required', 'in:borrador,inscripciones,en_curso,finalizada'],

            // 🔥 FECHAS: Relajé un poco las reglas para evitar bloqueos por zonas horarias
            'fecha_inicio_inscripciones' => ['nullable', 'date'],
            'fecha_fin_inscripciones'    => ['nullable', 'date', 'after:fecha_inicio_inscripciones'],
            'fecha_inicio_competencia'   => ['nullable', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'slug.unique'                   => 'Este nombre de torneo ya está en uso.',
            'fecha_inicio_inscripciones.after_or_equal' => 'La fecha de inicio de inscripciones no puede ser en el pasado.',
            'fecha_fin_inscripciones.after' => 'El cierre de inscripciones debe ser posterior a la fecha de inicio.',
            'fecha_inicio_competencia.after'=> 'El inicio del torneo debe ser posterior al cierre de inscripciones.',
            'color_tema.regex'              => 'El color debe ser un código HEX válido (ej. #EF4444).',
        ];
    }
}
