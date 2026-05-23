<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class Partido
 *
 * @property $id
 * @property $id_temporada_division
 * @property $id_equipo_local
 * @property $id_equipo_visitante
 * @property $jornada
 * @property $fecha_hora
 * @property $goles_local
 * @property $goles_visitante
 * @property $estado
 * @property $created_at
 * @property $updated_at
 *
 * @property Equipo $equipo
 * @property Equipo $equipo
 * @property TemporadaDivisione $temporadaDivisione
 * @package App
 * @mixin \Illuminate\Database\Eloquent\Builder
 */
class Partido extends Model
{
    
    protected $perPage = 20;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = ['id_temporada_division', 'id_equipo_local', 'id_equipo_visitante', 'jornada', 'fecha_hora', 'goles_local', 'goles_visitante', 'estado'];


    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function equipo()
    {
        return $this->belongsTo(\App\Models\Equipo::class, 'id_equipo_visitante', 'id');
    }
    
    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function equipo()
    {
        return $this->belongsTo(\App\Models\Equipo::class, 'id_equipo_local', 'id');
    }
    
    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function temporadaDivisione()
    {
        return $this->belongsTo(\App\Models\TemporadaDivisione::class, 'id_temporada_division', 'id');
    }
    
}
