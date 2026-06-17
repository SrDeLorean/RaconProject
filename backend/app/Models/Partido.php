<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Partido extends Model
{
    use HasFactory;

    protected $table = 'partidos';

    protected static function booted()
    {
        static::updated(function ($partido) {
            if ($partido->isDirty(['goles_local', 'goles_visitante'])) {
                try {
                    (new \App\Services\TorneoService)->autoAvanzarFase($partido->competencia_id, false);
                } catch (\Exception $e) {
                    \Log::error("Error auto-avanzando torneo: " . $e->getMessage());
                }
            }
        });
    }

    protected $fillable = [
        'competencia_id',
        'equipo_local_id',
        'equipo_visitante_id',
        'jornada',
        'grupo',
        'fecha',
        'hora',
        'goles_local',
        'goles_visitante',
        'stats',
        'reporte_local_stats',
        'reporte_visitante_stats',
        'reporte_local_completado',
        'reporte_visitante_completado',
        'reporte_confirmado'
    ];

    protected $casts = [
        'stats' => 'array',
        'reporte_local_stats' => 'array',
        'reporte_visitante_stats' => 'array',
        'reporte_local_completado' => 'boolean',
        'reporte_visitante_completado' => 'boolean',
        'reporte_confirmado' => 'boolean',
        'goles_local' => 'integer',
        'goles_visitante' => 'integer'
    ];

    protected $appends = ['estado'];

    public function getEstadoAttribute()
    {
        return ($this->goles_local !== null && $this->goles_visitante !== null) ? 'finalizado' : 'pendiente';
    }

    public function competencia()
    {
        return $this->belongsTo(Competencia::class, 'competencia_id');
    }

    public function local()
    {
        return $this->belongsTo(Equipo::class, 'equipo_local_id');
    }

    public function visitante()
    {
        return $this->belongsTo(Equipo::class, 'equipo_visitante_id');
    }
}
