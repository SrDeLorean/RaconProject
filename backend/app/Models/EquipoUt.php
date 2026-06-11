<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EquipoUt extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'equipos_ut';

    protected $fillable = [
        'nombre',
        'logo',
        'club_id_ea',
        'plataforma',
        'id_capitan',
        'id_companero',
        'estado'
    ];

    protected $casts = [
        'estado' => 'boolean'
    ];

    public function capitan()
    {
        return $this->belongsTo(User::class, 'id_capitan');
    }

    public function companero()
    {
        return $this->belongsTo(User::class, 'id_companero');
    }

    public function competencias()
    {
        return $this->belongsToMany(CompetenciaUt::class, 'competencia_equipo_ut', 'equipo_ut_id', 'competencia_ut_id')
                    ->withPivot('estado_inscripcion')
                    ->withTimestamps();
    }

    public function partidosLocal()
    {
        return $this->hasMany(PartidoUt::class, 'equipo_ut_local_id');
    }

    public function partidosVisitante()
    {
        return $this->hasMany(PartidoUt::class, 'equipo_ut_visitante_id');
    }
}
