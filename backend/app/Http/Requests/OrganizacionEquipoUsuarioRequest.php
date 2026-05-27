<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OrganizacionEquipoUsuarioRequest extends FormRequest
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
			'equipo_id' => 'required',
			'user_id' => 'required',
			'estado_fichaje' => 'required',
			'fecha_vinculacion' => 'required',
        ];
    }
}
