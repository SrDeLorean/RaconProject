<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class Equipo
 *
 * @property $id
 * @property $id_capitan
 * @property $nombre
 * @property $abreviatura
 * @property $logo
 * @property $created_at
 * @property $updated_at
 *
 * @property User $user
 * @property InscripcionesEquipo[] $inscripcionesEquipos
 * @property Partido[] $partidos
 * @property Partido[] $partidos
 * @package App
 * @mixin \Illuminate\Database\Eloquent\Builder
 */
class Equipo extends Model
{

    protected $perPage = 20;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'id_capitan',
        'nombre',
        'slug',
        'abreviatura',
        'descripcion',
        'logo',
        'banner',
        'plataforma',
        'club_id_ea',
        'redes_sociales',
        'estado',
    ];

    protected $casts = [
        'redes_sociales' => 'array',
        'estado' => 'boolean',
    ];


    /**
     * Relación con el Capitán (Dueño del equipo)
     */
    public function capitan()
    {
        return $this->belongsTo(User::class, 'id_capitan');
    }

    /**
     * Relación con los jugadores del equipo (El Roster)
     * Traemos también los campos de la tabla pivote 'equipo_jugador'
     */
    public function roster()
    {
        return $this->belongsToMany(User::class, 'equipo_jugador')
                    ->withPivot('dorsal', 'posicion_bloque', 'estado_fichaje')
                    ->withTimestamps();
    }

    /**
     * Relación con los jugadores del equipo vinculados por Organización
     */
    public function rosterOrganizacion()
    {
        return $this->belongsToMany(User::class, 'organizacion_equipo_usuario')
                    ->withPivot('organizacion_id', 'dorsal', 'posicion_bloque', 'estado_fichaje', 'fecha_vinculacion')
                    ->withTimestamps();
    }

    /**
     * Relación con las competencias en las que está inscrito el equipo
     */
    public function competencias()
    {
        return $this->belongsToMany(Competencia::class, 'competencia_equipo')
                    ->withTimestamps();
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function inscripcionesEquipos()
    {
        return $this->hasMany(\App\Models\InscripcionesEquipo::class, 'id', 'id_equipo');
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function partidosLocal() {
        return $this->hasMany(Partido::class, 'equipo_local_id');
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function partidosVisitante() {
        return $this->hasMany(Partido::class, 'equipo_visitante_id');
    }

    /**
     * Combina los partidos donde el equipo es local o visitante para obtener todos los partidos relacionados con este equipo.
     */
    public function todosLosPartidos() {
        return $this->partidosLocal->merge($this->partidosVisitante);
    }

    public function campeonatos()
    {
        return $this->hasMany(Competencia::class, 'campeon_id');
    }

    public function subcampeonatos()
    {
        return $this->hasMany(Competencia::class, 'subcampeon_id');
    }

    public function terceros()
    {
        return $this->hasMany(Competencia::class, 'tercer_lugar_id');
    }

}
