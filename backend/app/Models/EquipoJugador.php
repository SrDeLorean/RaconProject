<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class EquipoJugador
 *
 * @property $id
 * @property $equipo_id
 * @property $user_id
 * @property $dorsal
 * @property $posicion_bloque
 * @property $estado_fichaje
 * @property $created_at
 * @property $updated_at
 *
 * @property Equipo $equipo
 * @property User $user
 * @package App
 * @mixin \Illuminate\Database\Eloquent\Builder
 */
class EquipoJugador extends Model
{
    
    protected $perPage = 20;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = ['equipo_id', 'user_id', 'dorsal', 'posicion_bloque', 'estado_fichaje'];


    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function equipo()
    {
        return $this->belongsTo(\App\Models\Equipo::class, 'equipo_id', 'id');
    }
    
    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function user()
    {
        return $this->belongsTo(\App\Models\User::class, 'user_id', 'id');
    }
    
}
