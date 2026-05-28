<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EstadisticaEquipo extends Model
{
    use HasFactory;

    protected $table = 'estadisticas_equipos';

    protected $fillable = [
        'equipo_id',
        'partido_id',
        'competencia_id',
        'goles_favor',
        'goles_en_contra',
        'asistencias',
        'tiros',
        'pases_intentados',
        'pases_completados',
        'precision_pases',
        'entradas_intentadas',
        'entradas_exitosas',
        'tasa_exito_entradas',
        'tarjetas_rojas',
        'goles_contra_agregado',
        'atajadas',
        'atajadas_buena_colocacion',
        'atajadas_volada',
        'atajadas_reflejos',
        'centros_cortados',
        'despejes_punos',
        'desvios',
        'valla_invicta_global',
        'valla_invicta_defensa',
        'valla_invicta_portero',
        'valoracion_agregada',
        'jugador_partido',
        'segundos_jugados_agregado',
        'tiempo_juego_motor',
        'tiempo_inactivo_agregado',
        'tiempo_real_lag',
        'procesado',
    ];

    protected $casts = [
        'valla_invicta_global' => 'boolean',
        'valla_invicta_defensa' => 'boolean',
        'valla_invicta_portero' => 'boolean',
        'jugador_partido' => 'boolean',
        'procesado' => 'boolean',
    ];

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
