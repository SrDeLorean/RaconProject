<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Partido extends Model
{
    use HasFactory;

    protected $table = 'partidos';

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
        'stats'
    ];

    protected $casts = [
        'stats' => 'array',
        'goles_local' => 'integer',
        'goles_visitante' => 'integer'
    ];

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
