<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CompetenciaRequest extends FormRequest
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
			'organizacion_id' => 'required',
			'nombre' => 'required|string',
			'slug' => 'required|string',
			'descripcion' => 'string',
			'banner' => 'string',
			'formato' => 'required|string',
			'prize_pool' => 'required',
			'entry_fee' => 'required',
			'max_participantes' => 'required',
			'estado' => 'required',
        ];
    }
}
