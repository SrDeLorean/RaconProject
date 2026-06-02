<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class DecidirAdminSolicitudFichajeRequest extends FormRequest
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
            'respuesta' => ['required', 'string', 'in:aprobar,rechazar'],
            'observaciones' => ['nullable', 'string', 'max:1000']
        ];
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [
            'respuesta.required' => 'La respuesta administrativa es obligatoria.',
            'respuesta.in' => 'La respuesta debe ser "aprobar" o "rechazar".',
            'observaciones.max' => 'Las observaciones no pueden exceder los 1000 caracteres.'
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
