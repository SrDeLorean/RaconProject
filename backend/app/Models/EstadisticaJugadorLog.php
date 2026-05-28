<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EstadisticaJugadorLog extends Model
{
    use HasFactory;

    protected $table = 'estadisticas_jugadores_logs';

    protected $fillable = [
        'playername',
        'partido_id',
        'jugador_id',
        'equipo_id',
        'competencia_id',
        'jugo',
        'procesado',
        'estado',
    ];

    protected $casts = [
        'jugo' => 'boolean',
        'procesado' => 'boolean',
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
