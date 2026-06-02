<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class ResponderSolicitudFichajeRequest extends FormRequest
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
     */
    public function rules(): array
    {
        return [
            'respuesta' => ['required', 'string', 'in:aceptar,rechazar']
        ];
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [
            'respuesta.required' => 'La respuesta es obligatoria.',
            'respuesta.in' => 'La respuesta debe ser "aceptar" o "rechazar".',
        ];
    }

    /**
     * Estandarizar la respuesta de error de validación.
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
