<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompetenciaEquipoUsuario extends Model
{
    protected $table = 'competencia_equipo_usuario';

    protected $fillable = [
        'competencia_id', 'equipo_id', 'user_id', 'dorsal', 'posicion_bloque'
    ];

    public function competencia()
    {
        return $this->belongsTo(Competencia::class);
    }

    public function equipo()
    {
        return $this->belongsTo(Equipo::class);
    }

    public function jugador()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
