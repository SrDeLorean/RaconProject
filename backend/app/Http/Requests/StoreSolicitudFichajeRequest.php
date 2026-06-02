<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreSolicitudFichajeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Autenticación controlada por Middleware Sanctum
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'posicion' => ['required', 'string', 'max:50'],
            'dorsal' => ['nullable', 'string', 'max:10'],
            'organizacion_ids' => ['required', 'array', 'min:1'],
            'organizacion_ids.*' => ['integer', 'exists:organizaciones,id'],
        ];
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [
            'user_id.required' => 'El ID del jugador es obligatorio.',
            'user_id.exists' => 'El jugador seleccionado no existe.',
            'posicion.required' => 'La posición de fichaje es requerida.',
            'organizacion_ids.required' => 'Debes seleccionar al menos un circuito de organización.',
            'organizacion_ids.array' => 'Las organizaciones deben ser proporcionadas en formato de arreglo.',
            'organizacion_ids.*.exists' => 'Una de las organizaciones seleccionadas no es válida.',
        ];
    }

    /**
     * Estandarizar la respuesta de error de validación bajo el contrato requerido.
     */
    protected function failedValidation(Validator $validator)
    {
        $errors = [];
        foreach ($validator->errors()->getMessages() as $field => $issues) {
            foreach ($issues as $issue) {
                $errors[] = [
                    'field' => $field,
                    'issue' => $issue
                ];
            }
        }

        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Errores de validación en la petición.',
            'data' => null,
            'errors' => $errors
        ], 422));
    }
}
