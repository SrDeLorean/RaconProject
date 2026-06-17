<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EstadisticaJugador extends Model
{
    use HasFactory;

    protected $table = 'estadisticas_jugadores';

    protected $fillable = [
        'jugador_id',
        'equipo_id',
        'partido_id',
        'competencia_id',
        'posicion',
        'id_arquetipo',
        'valoracion',
        'goles',
        'asistencias',
        'tiros',
        'tarjetas_rojas',
        'tarjetas_amarillas',
        'jugador_partido',
        'resultado_usuario',
        'precision_tiro',
        'pases_intentados',
        'pases_completados',
        'precision_pases',
        'entradas_intentadas',
        'entradas_exitosas',
        'tasa_exito_entradas',
        'goles_recibidos',
        'atajadas',
        'atajadas_buena_colocacion',
        'atajadas_volada',
        'atajadas_reflejos',
        'centros_cortados',
        'despejes_punos',
        'desvios',
        'segundos_jugados',
        'tiempo_juego_motor',
        'tiempo_inactivo',
        'tiempo_real_lag',
    ];

    protected $casts = [
        'jugador_partido' => 'boolean',
    ];

    public function jugador()
    {
        return $this->belongsTo(User::class, 'jugador_id');
    }

    public function equipo()
    {
        return $this->belongsTo(Equipo::class, 'equipo_id');
    }

    public function partido()
    {
        return $this->belongsTo(Partido::class, 'partido_id');
    }

    public function competencia()
    {
        return $this->belongsTo(Competencia::class, 'competencia_id');
    }
}
