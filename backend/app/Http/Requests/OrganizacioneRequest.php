<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OrganizacioneRequest extends FormRequest
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
			'owner_id' => 'required',
			'nombre' => 'required|string',
			'slug' => 'required|string',
			'descripcion' => 'string',
			'logo' => 'string',
			'banner' => 'string',
			'color_hex' => 'string',
			'email_contacto' => 'string',
			'discord_url' => 'string',
			'twitter_url' => 'string',
			'twitch_url' => 'string',
			'website' => 'string',
			'pais' => 'string',
			'is_verified' => 'required',
			'estado' => 'required',
        ];
    }
}
