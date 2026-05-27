<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Organizacion extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'organizaciones';

    protected $fillable = [
        'owner_id', 'nombre', 'slug', 'descripcion', 'logo', 'banner',
        'color_hex', 'email_contacto', 'discord_url', 'twitter_url',
        'twitch_url', 'website', 'pais', 'is_verified', 'estado'
    ];

    protected $casts = [
        'is_verified' => 'boolean',
    ];

    // Relación con el administrador dueño
    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    // Una organización tiene múltiples temporadas a lo largo de su historia
    public function temporadas()
    {
        return $this->hasMany(Temporada::class);
    }
}
