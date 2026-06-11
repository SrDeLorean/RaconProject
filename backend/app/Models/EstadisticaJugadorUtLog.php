<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EstadisticaJugadorUtLog extends Model
{
    use HasFactory;

    protected $table = 'estadisticas_jugadores_ut_logs';

    protected $fillable = [
        'playername',
        'partido_ut_id',
        'jugador_id',
        'equipo_ut_id',
        'competencia_ut_id',
        'jugo',
        'procesado',
        'estado'
    ];

    protected $casts = [
        'jugo' => 'boolean',
        'procesado' => 'boolean'
    ];

    public function jugador()
    {
        return $this->belongsTo(User::class, 'jugador_id');
    }

    public function equipo()
    {
        return $this->belongsTo(EquipoUt::class, 'equipo_ut_id');
    }

    public function partido()
    {
        return $this->belongsTo(PartidoUt::class, 'partido_ut_id');
    }

    public function competencia()
    {
        return $this->belongsTo(CompetenciaUt::class, 'competencia_ut_id');
    }
}
