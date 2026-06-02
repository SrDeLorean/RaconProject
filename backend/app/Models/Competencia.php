<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Competencia extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'temporada_id', 'nombre', 'slug', 'descripcion', 'reglas',
        'logo', 'banner', 'color_tema', 'formato', 'plataforma', 'prize_pool',
        'entry_fee', 'max_participantes', 'es_publico', 'estado',
        'fecha_inicio_inscripciones', 'fecha_fin_inscripciones', 'fecha_inicio_competencia'
    ];

    protected $casts = [
        'prize_pool' => 'decimal:2',
        'entry_fee' => 'decimal:2',
        'es_publico' => 'boolean',
        'fecha_inicio_inscripciones' => 'datetime',
        'fecha_fin_inscripciones' => 'datetime',
        'fecha_inicio_competencia' => 'datetime',
    ];

    public function temporada()
    {
        return $this->belongsTo(Temporada::class);
    }

    // Equipos inscritos en esta competencia específica
    public function equipos()
    {
        return $this->belongsToMany(Equipo::class, 'competencia_equipo')
                    ->withPivot('estado_inscripcion')
                    ->withTimestamps();
    }

    // Partidos de esta competencia
    public function partidos()
    {
        return $this->hasMany(Partido::class, 'competencia_id')->orderBy('fecha')->orderBy('hora');
    }
}
