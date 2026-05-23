<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class Equipo
 *
 * @property $id
 * @property $id_capitan
 * @property $nombre
 * @property $abreviatura
 * @property $logo
 * @property $created_at
 * @property $updated_at
 *
 * @property User $user
 * @property InscripcionesEquipo[] $inscripcionesEquipos
 * @property Partido[] $partidos
 * @property Partido[] $partidos
 * @package App
 * @mixin \Illuminate\Database\Eloquent\Builder
 */
class Equipo extends Model
{
    
    protected $perPage = 20;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = ['id_capitan', 'nombre', 'abreviatura', 'logo'];


    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function user()
    {
        return $this->belongsTo(\App\Models\User::class, 'id_capitan', 'id');
    }
    
    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function inscripcionesEquipos()
    {
        return $this->hasMany(\App\Models\InscripcionesEquipo::class, 'id', 'id_equipo');
    }
    
    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function partidos()
    {
        return $this->hasMany(\App\Models\Partido::class, 'id', 'id_equipo_local');
    }
    
    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function partidos()
    {
        return $this->hasMany(\App\Models\Partido::class, 'id', 'id_equipo_visitante');
    }
    
}
