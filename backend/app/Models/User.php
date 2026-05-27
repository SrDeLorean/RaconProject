<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class User
 *
 * @property $id
 * @property $name
 * @property $email
 * @property $email_verified_at
 * @property $password
 * @property $role
 * @property $remember_token
 * @property $created_at
 * @property $updated_at
 *
 * @property Equipo[] $equipos
 * @property Plantilla[] $plantillas
 * @package App
 * @mixin \Illuminate\Database\Eloquent\Builder
 */
class User extends Authenticatable
{
    // 3. IMPORTANTE: Debes incluir el trait HasApiTokens para el login
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $perPage = 20;

    /**
     * Los atributos que son asignables en masa (Mass assignable).
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'status', // <- No olvides agregarlo aquí
        'gamertag',
        'id_ea',
        'plataforma',
        'foto',
        'nacionalidad',
        'posicion',
        'fecha_nacimiento',
        'altura',
        'peso',
        'telefono',
        'biografia',
        'instagram',
        'facebook',
        'twitch',
        'youtube',
        'tiktok',
        'last_login_at'
    ];

    /**
     * Los atributos que deben ocultarse para la serialización (como al enviar JSON a React).
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Los atributos que deben ser casteados.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'last_login_at' => 'datetime',
        'fecha_nacimiento' => 'date',
        'password' => 'hashed',
    ];


    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function equipos()
    {
        return $this->hasMany(\App\Models\Equipo::class, 'id', 'id_capitan');
    }

    public function organizacion()
    {
        return $this->hasOne(Organizacion::class, 'owner_id', 'id');
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function plantillas()
    {
        return $this->hasMany(\App\Models\Plantilla::class, 'id', 'id_usuario');
    }

}
