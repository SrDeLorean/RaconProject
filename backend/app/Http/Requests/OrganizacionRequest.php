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
        $orgId = $this->route('organizacion') ? $this->route('organizacion')->id : null;

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
            'website'        => ['nullable', 'url', 'max:255'],
            'pais'           => ['nullable', 'string', 'size:2'], // Ej: CL
            'is_verified'    => ['boolean'],
            'estado'         => ['required', 'in:activo,inactivo,suspendido'],
        ];
    }
}
