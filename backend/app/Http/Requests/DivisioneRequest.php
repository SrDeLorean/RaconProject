<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DivisioneRequest extends FormRequest
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
			'id_competencia' => 'required',
			'nombre' => 'required|string',
			'nivel' => 'required',
        ];
    }

    public function messages(): array
    {
        return [
            'id_competencia.required' => 'La competencia asociada es obligatoria.',
            'nombre.required'         => 'El nombre de la división es obligatorio.',
            'nombre.string'           => 'El nombre de la división debe ser una cadena de texto.',
            'nivel.required'          => 'El nivel de la división es obligatorio.',
        ];
    }
}
