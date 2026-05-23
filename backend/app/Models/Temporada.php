<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class Temporada
 *
 * @property $id
 * @property $id_organizacion
 * @property $nombre
 * @property $fecha_inicio
 * @property $fecha_termino
 * @property $estado
 * @property $created_at
 * @property $updated_at
 *
 * @property Organizacione $organizacione
 * @package App
 * @mixin \Illuminate\Database\Eloquent\Builder
 */
class Temporada extends Model
{
    
    protected $perPage = 20;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = ['id_organizacion', 'nombre', 'fecha_inicio', 'fecha_termino', 'estado'];


    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function organizacione()
    {
        return $this->belongsTo(\App\Models\Organizacione::class, 'id_organizacion', 'id');
    }
    
}
