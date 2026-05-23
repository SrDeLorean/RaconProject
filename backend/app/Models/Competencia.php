<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class Competencia
 *
 * @property $id
 * @property $organizacion_id
 * @property $nombre
 * @property $slug
 * @property $descripcion
 * @property $banner
 * @property $formato
 * @property $prize_pool
 * @property $entry_fee
 * @property $max_participantes
 * @property $estado
 * @property $fecha_inicio_inscripciones
 * @property $fecha_fin_inscripciones
 * @property $fecha_inicio_competencia
 * @property $created_at
 * @property $updated_at
 * @property $deleted_at
 *
 * @property Organizacione $organizacione
 * @property Divisione[] $divisiones
 * @package App
 * @mixin \Illuminate\Database\Eloquent\Builder
 */
class Competencia extends Model
{
    use SoftDeletes;

    protected $perPage = 20;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = ['organizacion_id', 'nombre', 'slug', 'descripcion', 'banner', 'formato', 'prize_pool', 'entry_fee', 'max_participantes', 'estado', 'fecha_inicio_inscripciones', 'fecha_fin_inscripciones', 'fecha_inicio_competencia'];


    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function organizacione()
    {
        return $this->belongsTo(\App\Models\Organizacione::class, 'organizacion_id', 'id');
    }
    
    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function divisiones()
    {
        return $this->hasMany(\App\Models\Divisione::class, 'id', 'id_competencia');
    }
    
}
