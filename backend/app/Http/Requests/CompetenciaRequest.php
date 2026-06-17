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
            'logo'         => ['nullable', 'string', 'max:255'],
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
            'campeon_id'                 => ['nullable', 'exists:equipos,id'],
            'subcampeon_id'              => ['nullable', 'exists:equipos,id'],
            'tercer_lugar_id'            => ['nullable', 'exists:equipos,id'],
            'config'                     => ['nullable', 'array'],
        ];
    }

    public function messages(): array
    {
        return [
            'temporada_id.required'         => 'La temporada es obligatoria.',
            'temporada_id.exists'           => 'La temporada seleccionada no es válida.',
            'nombre.required'               => 'El nombre de la competencia es obligatorio.',
            'slug.required'                 => 'El slug de la competencia es obligatorio.',
            'slug.unique'                   => 'Este nombre de torneo o slug ya está en uso por otra competencia.',
            'formato.required'              => 'El formato es obligatorio.',
            'formato.in'                    => 'El formato seleccionado no es válido (debe ser liga, copa o eliminatoria).',
            'plataforma.required'           => 'La plataforma es obligatoria.',
            'plataforma.in'                 => 'La plataforma seleccionada no es válida.',
            'prize_pool.required'           => 'El premio acumulado es obligatorio.',
            'prize_pool.numeric'            => 'El premio acumulado debe ser un número.',
            'prize_pool.min'                => 'El premio acumulado no puede ser menor a 0.',
            'entry_fee.required'            => 'El costo de inscripción es obligatorio.',
            'entry_fee.numeric'             => 'El costo de inscripción debe ser un número.',
            'entry_fee.min'                 => 'El costo de inscripción no puede ser menor a 0.',
            'max_participantes.required'    => 'El límite máximo de participantes es obligatorio.',
            'max_participantes.integer'     => 'El límite de participantes debe ser un número entero.',
            'max_participantes.min'         => 'Se necesitan al menos 2 participantes para la competencia.',
            'max_participantes.max'         => 'La competencia no puede superar los 128 participantes.',
            'estado.required'               => 'El estado de la competencia es obligatorio.',
            'estado.in'                     => 'El estado de la competencia seleccionado no es válido.',
            'fecha_fin_inscripciones.after' => 'El cierre de inscripciones debe ser una fecha posterior al inicio de inscripciones.',
        ];
    }
}
