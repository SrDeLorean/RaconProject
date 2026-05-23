<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class Plantilla
 *
 * @property $id
 * @property $id_inscripcion_equipo
 * @property $id_usuario
 * @property $rol_equipo
 * @property $dorsal
 * @property $posicion
 * @property $created_at
 * @property $updated_at
 *
 * @property User $user
 * @property InscripcionesEquipo $inscripcionesEquipo
 * @package App
 * @mixin \Illuminate\Database\Eloquent\Builder
 */
class Plantilla extends Model
{
    
    protected $perPage = 20;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = ['id_inscripcion_equipo', 'id_usuario', 'rol_equipo', 'dorsal', 'posicion'];


    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function user()
    {
        return $this->belongsTo(\App\Models\User::class, 'id_usuario', 'id');
    }
    
    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function inscripcionesEquipo()
    {
        return $this->belongsTo(\App\Models\InscripcionesEquipo::class, 'id_inscripcion_equipo', 'id');
    }
    
}
