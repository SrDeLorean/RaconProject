<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Temporada extends Model
{
    use HasFactory, SoftDeletes;

    // 🔥 ASEGÚRATE DE QUE 'organizacion_id' ESTÉ AQUÍ:
    protected $fillable = [
        'organizacion_id',
        'nombre',
        'slug',
        'estado_mercado',
        'fecha_inicio',
        'fecha_fin',
        'activa'
    ];

    protected $casts = [
        'activa' => 'boolean',
    ];

    public function organizacion()
    {
        return $this->belongsTo(Organizacion::class);
    }

    public function competencias()
    {
        return $this->hasMany(Competencia::class);
    }

    public function competenciasUt()
    {
        return $this->hasMany(CompetenciaUt::class, 'temporada_id');
    }
}
