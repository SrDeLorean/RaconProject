<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class InscripcionesEquipo
 *
 * @property $id
 * @property $id_temporada_division
 * @property $id_equipo
 * @property $puntos
 * @property $partidos_jugados
 * @property $victorias
 * @property $empates
 * @property $derrotas
 * @property $goles_favor
 * @property $goles_contra
 * @property $created_at
 * @property $updated_at
 *
 * @property Equipo $equipo
 * @property TemporadaDivisione $temporadaDivisione
 * @property Plantilla[] $plantillas
 * @package App
 * @mixin \Illuminate\Database\Eloquent\Builder
 */
class InscripcionesEquipo extends Model
{
    
    protected $perPage = 20;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = ['id_temporada_division', 'id_equipo', 'puntos', 'partidos_jugados', 'victorias', 'empates', 'derrotas', 'goles_favor', 'goles_contra'];


    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function equipo()
    {
        return $this->belongsTo(\App\Models\Equipo::class, 'id_equipo', 'id');
    }
    
    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function temporadaDivisione()
    {
        return $this->belongsTo(\App\Models\TemporadaDivisione::class, 'id_temporada_division', 'id');
    }
    
    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function plantillas()
    {
        return $this->hasMany(\App\Models\Plantilla::class, 'id', 'id_inscripcion_equipo');
    }
    
}
