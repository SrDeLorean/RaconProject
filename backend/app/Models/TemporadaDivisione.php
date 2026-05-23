<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class TemporadaDivisione
 *
 * @property $id
 * @property $id_temporada
 * @property $id_division
 * @property $fichajes_abiertos
 * @property $created_at
 * @property $updated_at
 *
 * @property Divisione $divisione
 * @property Temporada $temporada
 * @property InscripcionesEquipo[] $inscripcionesEquipos
 * @package App
 * @mixin \Illuminate\Database\Eloquent\Builder
 */
class TemporadaDivisione extends Model
{
    
    protected $perPage = 20;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = ['id_temporada', 'id_division', 'fichajes_abiertos'];


    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function divisione()
    {
        return $this->belongsTo(\App\Models\Divisione::class, 'id_division', 'id');
    }
    
    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function temporada()
    {
        return $this->belongsTo(\App\Models\Temporada::class, 'id_temporada', 'id');
    }
    
    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function inscripcionesEquipos()
    {
        return $this->hasMany(\App\Models\InscripcionesEquipo::class, 'id', 'id_temporada_division');
    }
    
}
