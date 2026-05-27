<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

/**
 * Class CompetenciaEquipo
 *
 * @property $id
 * @property $competencia_id
 * @property $equipo_id
 * @property $estado_inscripcion
 * @property $created_at
 * @property $updated_at
 *
 * @property Competencia $competencia
 * @property Equipo $equipo
 * @package App
 * @mixin \Illuminate\Database\Eloquent\Builder
 */
class CompetenciaEquipo extends Pivot
{

    protected $table = 'competencia_equipo';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = ['competencia_id', 'equipo_id', 'estado_inscripcion'];


    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function competencia()
    {
        return $this->belongsTo(\App\Models\Competencia::class, 'competencia_id', 'id');
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function equipo()
    {
        return $this->belongsTo(\App\Models\Equipo::class, 'equipo_id', 'id');
    }

}
