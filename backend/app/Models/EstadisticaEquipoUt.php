<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EstadisticaEquipoUt extends Model
{
    use HasFactory;

    protected $table = 'estadisticas_equipos_ut';

    protected $fillable = [
        'equipo_ut_id',
        'partido_ut_id',
        'competencia_ut_id',
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
        'valla_invicta_global',
        'valoracion_agregada',
        'segundos_jugados_agregado',
        'tiempo_juego_motor',
        'procesado'
    ];

    protected $casts = [
        'precision_pases' => 'decimal:2',
        'tasa_exito_entradas' => 'decimal:2',
        'valoracion_agregada' => 'decimal:2',
        'valla_invicta_global' => 'boolean',
        'procesado' => 'boolean'
    ];

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
