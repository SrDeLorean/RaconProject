<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TemporadaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $temporadaId = $this->route('temporada') ? $this->route('temporada')->id : null;

        // Obtenemos la organización del usuario autenticado (Organizador) directamente de la BD
        $organizacion = \App\Models\Organizacion::where('owner_id', auth()->id())->first();
        $organizacionId = $organizacion ? $organizacion->id : null;

        return [
            // ELIMINAMOS 'organizacion_id' => 'required', ya no se lo pedimos al frontend

            // Validamos que el nombre sea único, pero solo dentro de LA ORGANIZACIÓN de este usuario
            'nombre' => [
                'required', 'string', 'max:255',
                \Illuminate\Validation\Rule::unique('temporadas', 'nombre')
                    ->where('organizacion_id', $organizacionId)
                    ->ignore($temporadaId)
            ],

            'slug'           => ['required', 'string', 'max:255', \Illuminate\Validation\Rule::unique('temporadas', 'slug')->ignore($temporadaId)],
            'estado_mercado' => ['required', 'in:abierto,cerrado'],
            'fecha_inicio'   => ['nullable', 'date'],
            'fecha_fin'      => ['nullable', 'date', 'after_or_equal:fecha_inicio'],
            'activa'         => ['boolean'],
        ];
    }
}
