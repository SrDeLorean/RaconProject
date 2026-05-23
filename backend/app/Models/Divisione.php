<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class Divisione
 *
 * @property $id
 * @property $id_competencia
 * @property $nombre
 * @property $nivel
 * @property $created_at
 * @property $updated_at
 *
 * @property Competencia $competencia
 * @property TemporadaDivisione[] $temporadaDivisiones
 * @package App
 * @mixin \Illuminate\Database\Eloquent\Builder
 */
class Divisione extends Model
{
    
    protected $perPage = 20;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = ['id_competencia', 'nombre', 'nivel'];


    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function competencia()
    {
        return $this->belongsTo(\App\Models\Competencia::class, 'id_competencia', 'id');
    }
    
    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function temporadaDivisiones()
    {
        return $this->hasMany(\App\Models\TemporadaDivisione::class, 'id', 'id_division');
    }
    
}
