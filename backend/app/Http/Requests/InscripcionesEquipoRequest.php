<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class InscripcionesEquipoRequest extends FormRequest
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
        return [
			'id_temporada_division' => 'required',
			'id_equipo' => 'required',
			'puntos' => 'required',
			'partidos_jugados' => 'required',
			'victorias' => 'required',
			'empates' => 'required',
			'derrotas' => 'required',
			'goles_favor' => 'required',
			'goles_contra' => 'required',
        ];
    }
}
