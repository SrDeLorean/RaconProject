<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EstadisticaJugadorUt extends Model
{
    use HasFactory;

    protected $table = 'estadisticas_jugadores_ut';

    protected $fillable = [
        'jugador_id',
        'equipo_ut_id',
        'partido_ut_id',
        'competencia_ut_id',
        'posicion',
        'valoracion',
        'goles',
        'asistencias',
        'tiros',
        'tarjetas_rojas',
        'jugador_partido',
        'pases_intentados',
        'pases_completados',
        'precision_pases',
        'entradas_intentadas',
        'entradas_exitosas',
        'tasa_exito_entradas',
        'segundos_jugados'
    ];

    protected $casts = [
        'valoracion' => 'decimal:2',
        'precision_pases' => 'decimal:2',
        'tasa_exito_entradas' => 'decimal:2',
        'jugador_partido' => 'boolean'
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
