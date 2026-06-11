<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PartidoUt extends Model
{
    use HasFactory;

    protected $table = 'partidos_ut';

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
        'stats'
    ];

    protected $casts = [
        'stats' => 'array',
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
