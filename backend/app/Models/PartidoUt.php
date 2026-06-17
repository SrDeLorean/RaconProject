<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PartidoUt extends Model
{
    use HasFactory;

    protected $table = 'partidos_ut';

    protected static function booted()
    {
        static::updated(function ($partido) {
            if ($partido->isDirty(['goles_local', 'goles_visitante'])) {
                try {
                    (new \App\Services\TorneoService)->autoAvanzarFase($partido->competencia_ut_id, true);
                } catch (\Exception $e) {
                    \Log::error("Error auto-avanzando torneo UT: " . $e->getMessage());
                }
            }
        });
    }

    protected $fillable = [
        'competencia_ut_id',
        'equipo_ut_local_id',
        'equipo_ut_visitante_id',
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

    public function competencia()
    {
        return $this->belongsTo(CompetenciaUt::class, 'competencia_ut_id');
    }

    public function local()
    {
        return $this->belongsTo(EquipoUt::class, 'equipo_ut_local_id');
    }

    public function visitante()
    {
        return $this->belongsTo(EquipoUt::class, 'equipo_ut_visitante_id');
    }

    public function estadisticasJugadores()
    {
        return $this->hasMany(EstadisticaJugadorUt::class, 'partido_ut_id');
    }

    public function estadisticasEquipos()
    {
        return $this->hasMany(EstadisticaEquipoUt::class, 'partido_ut_id');
    }

    public function logs()
    {
        return $this->hasMany(EstadisticaJugadorUtLog::class, 'partido_ut_id');
    }
}
