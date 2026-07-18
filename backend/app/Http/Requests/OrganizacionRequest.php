<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class OrganizacionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $organizacion = $this->route('organizacion');
        $orgId = is_object($organizacion) ? $organizacion->id : $organizacion;

        return [
            'owner_id'       => ['required', 'exists:users,id'],
            'nombre'         => ['required', 'string', 'max:255', Rule::unique('organizaciones', 'nombre')->ignore($orgId)],
            'slug'           => ['required', 'string', 'max:255', Rule::unique('organizaciones', 'slug')->ignore($orgId)],
            'descripcion'    => ['nullable', 'string'],
            'logo'           => ['nullable', 'string'],
            'banner'         => ['nullable', 'string'],
            'color_hex'      => ['nullable', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'email_contacto' => ['nullable', 'email', 'max:255'],
            'discord_url'    => ['nullable', 'url', 'max:255'],
            'twitter_url'    => ['nullable', 'url', 'max:255'],
            'twitch_url'     => ['nullable', 'url', 'max:255'],
            'instagram_url'  => ['nullable', 'url', 'max:255'],
            'facebook_url'   => ['nullable', 'url', 'max:255'],
            'youtube_url'    => ['nullable', 'url', 'max:255'],
            'tiktok_url'     => ['nullable', 'url', 'max:255'],
            'whatsapp'       => ['nullable', 'string', 'max:255'],
            'website'        => ['nullable', 'url', 'max:255'],
            'pais'           => ['nullable', 'string', 'size:2'], // Ej: CL
            'is_verified'    => ['boolean'],
            'estado'         => ['required', 'in:activo,inactivo,suspendido'],
        ];
    }

    public function messages(): array
    {
        return [
            'owner_id.required' => 'El propietario de la organización es obligatorio.',
            'owner_id.exists' => 'El propietario seleccionado no es válido.',
            'nombre.required' => 'El nombre de la organización es obligatorio.',
            'nombre.unique' => 'Ya existe una organización registrada con este nombre.',
            'slug.required' => 'El slug es obligatorio.',
            'slug.unique' => 'El slug generado ya se encuentra en uso por otra organización.',
            'color_hex.regex' => 'El color de la organización debe ser un código hexadecimal válido (ej. #FF5500).',
            'email_contacto.email' => 'El correo electrónico de contacto debe ser una dirección válida.',
            'discord_url.url' => 'El enlace de Discord debe ser una dirección URL válida.',
            'twitter_url.url' => 'El enlace de Twitter debe ser una dirección URL válida.',
            'twitch_url.url' => 'El enlace de Twitch debe ser una dirección URL válida.',
            'website.url' => 'El sitio web debe ser una dirección URL válida.',
            'pais.size' => 'El código de país debe tener exactamente 2 letras (ej. CL).',
            'estado.required' => 'El estado de la organización es obligatorio.',
            'estado.in' => 'El estado seleccionado no es válido.',
        ];
    }
}
