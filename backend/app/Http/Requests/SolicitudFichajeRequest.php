<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SolicitudFichajeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'temporada_id' => ['required', 'exists:temporadas,id'],
            'equipo_id'    => ['required', 'exists:equipos,id'],
            'user_id'      => ['required', 'exists:users,id'],

            // Generalmente, el frontend de usuario solo manda la solicitud vacía o con comprobante
            // El estado lo maneja el controlador (abierto = libre_transito, cerrado = pendiente_pago)
            'comprobante_pago' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:2048'],

            // Este campo solo debería poder editarlo el administrador en un update
            'estado' => ['sometimes', 'in:pendiente_pago,aprobado,rechazado,libre_transito'],
            'observaciones_admin' => ['nullable', 'string', 'max:500'],
        ];
    }
}
