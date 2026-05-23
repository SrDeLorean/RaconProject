<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class Organizacione
 *
 * @property $id
 * @property $owner_id
 * @property $nombre
 * @property $slug
 * @property $descripcion
 * @property $logo
 * @property $banner
 * @property $color_hex
 * @property $email_contacto
 * @property $discord_url
 * @property $twitter_url
 * @property $twitch_url
 * @property $website
 * @property $pais
 * @property $is_verified
 * @property $estado
 * @property $created_at
 * @property $updated_at
 * @property $deleted_at
 *
 * @property User $user
 * @property Competencia[] $competencias
 * @property Temporada[] $temporadas
 * @package App
 * @mixin \Illuminate\Database\Eloquent\Builder
 */
class Organizacione extends Model
{
    use SoftDeletes;

    protected $perPage = 20;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = ['owner_id', 'nombre', 'slug', 'descripcion', 'logo', 'banner', 'color_hex', 'email_contacto', 'discord_url', 'twitter_url', 'twitch_url', 'website', 'pais', 'is_verified', 'estado'];


    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function user()
    {
        return $this->belongsTo(\App\Models\User::class, 'owner_id', 'id');
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function competencias()
    {
        return $this->hasMany(\App\Models\Competencia::class, 'id', 'id_organizacion');
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function temporadas()
    {
        return $this->hasMany(\App\Models\Temporada::class, 'id', 'id_organizacion');
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }
}
