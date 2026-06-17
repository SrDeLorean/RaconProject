<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EquipoRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Retornamos true asumiendo que la autorización real (quién puede editar)
        // la manejarás con Policies o en el Controlador.
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // Obtenemos el ID del equipo si estamos en una petición PUT/PATCH (actualización)
        // Esto permite que las reglas 'unique' ignoren el registro actual.
        $routeParam = $this->route('equipo');
        $equipoId = $routeParam ? (is_object($routeParam) ? $routeParam->id : $routeParam) : null;

        return [
            // El controlador debería asignar Auth::id() automáticamente, pero si se envía,
            // validamos que el usuario exista y que NO sea capitán de otro equipo.
            'id_capitan' => 'nullable|exists:users,id|unique:equipos,id_capitan,' . $equipoId,

            // Datos Principales
            'nombre' => 'required|string|max:100|unique:equipos,nombre,' . $equipoId,
            'abreviatura' => 'required|string|max:10|unique:equipos,abreviatura,' . $equipoId,
            'descripcion' => 'nullable|string|max:1000',

            // El slug se genera en el controlador usando Str::slug($request->nombre),
            // por lo que no obligamos al frontend a enviarlo.
            'slug' => 'nullable|string|unique:equipos,slug,' . $equipoId,

            // Multimedia y Plataforma
            'logo' => 'nullable|string',
            'banner' => 'nullable|string',
            'plataforma' => 'nullable|string|in:crossplay,ps5,xbox,pc',
            'club_id_ea' => 'nullable|string|max:255',

            // El frontend en React envía redes_sociales como un objeto JSON,
            // por lo que Laravel lo recibe como un array. Validamos su contenido interno.
            'redes_sociales' => 'nullable|array',
            'redes_sociales.twitter' => 'nullable|string|max:255',
            'redes_sociales.twitch' => 'nullable|string|max:255',

            // El estado en la migración es boolean, el frontend envía '1' o '0' (o true/false)
            'estado' => 'nullable|boolean',
        ];
    }

    /**
     * Mensajes de error personalizados (Opcional, pero muy recomendado para el frontend)
     */
    public function messages(): array
    {
        return [
            'nombre.required'      => 'El nombre del club es obligatorio.',
            'nombre.unique'        => 'Ya existe un club registrado con este nombre.',
            'abreviatura.required' => 'La abreviatura del club (TAG) es obligatoria.',
            'abreviatura.unique'   => 'Este TAG o abreviatura ya está en uso por otro equipo.',
            'abreviatura.max'      => 'La abreviatura del club no puede superar los 10 caracteres.',
            'id_capitan.unique'    => 'Solo puedes ser capitán de un equipo a la vez.',
            'id_capitan.exists'    => 'El capitán seleccionado no existe en el sistema.',
            'plataforma.in'        => 'La plataforma seleccionada no es válida.',
            'club_id_ea.max'       => 'El ID de club de EA no puede superar los 255 caracteres.',
        ];
    }
}
