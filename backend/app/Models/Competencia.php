<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Competencia extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'temporada_id', 'nombre', 'slug', 'descripcion', 'reglas',
        'logo', 'banner', 'color_tema', 'formato', 'plataforma', 'prize_pool',
        'entry_fee', 'max_participantes', 'es_publico', 'estado',
        'fecha_inicio_inscripciones', 'fecha_fin_inscripciones', 'fecha_inicio_competencia',
        'campeon_id', 'subcampeon_id', 'tercer_lugar_id', 'config'
    ];

    protected $casts = [
        'prize_pool' => 'decimal:2',
        'entry_fee' => 'decimal:2',
        'es_publico' => 'boolean',
        'fecha_inicio_inscripciones' => 'datetime',
        'fecha_fin_inscripciones' => 'datetime',
        'fecha_inicio_competencia' => 'datetime',
        'config' => 'array'
    ];

    // PERFORMANCE FIX: Removed from $appends to prevent N+1 bomb on list views.
    // Load top_stats explicitly when needed: $competencia->append('top_stats')
    protected $appends = [];

    public function getTopStatsAttribute()
    {
        if ($this->estado !== 'finalizada') {
            return [
                'goleadores' => [],
                'asistentes' => [],
                'mvps' => []
            ];
        }

        $goleadores = \DB::table('estadisticas_jugadores')
            ->join('users', 'estadisticas_jugadores.jugador_id', '=', 'users.id')
            ->join('equipos', 'estadisticas_jugadores.equipo_id', '=', 'equipos.id')
            ->where('estadisticas_jugadores.competencia_id', $this->id)
            ->selectRaw('users.id, users.name, users.gamertag, users.foto, equipos.nombre as equipo_nombre, sum(estadisticas_jugadores.goles) as total')
            ->groupBy('users.id', 'users.name', 'users.gamertag', 'users.foto', 'equipos.nombre')
            ->orderByDesc('total')
            ->limit(3)
            ->get();

        $asistentes = \DB::table('estadisticas_jugadores')
            ->join('users', 'estadisticas_jugadores.jugador_id', '=', 'users.id')
            ->join('equipos', 'estadisticas_jugadores.equipo_id', '=', 'equipos.id')
            ->where('estadisticas_jugadores.competencia_id', $this->id)
            ->selectRaw('users.id, users.name, users.gamertag, users.foto, equipos.nombre as equipo_nombre, sum(estadisticas_jugadores.asistencias) as total')
            ->groupBy('users.id', 'users.name', 'users.gamertag', 'users.foto', 'equipos.nombre')
            ->orderByDesc('total')
            ->limit(3)
            ->get();

        $mvps = \DB::table('estadisticas_jugadores')
            ->join('users', 'estadisticas_jugadores.jugador_id', '=', 'users.id')
            ->join('equipos', 'estadisticas_jugadores.equipo_id', '=', 'equipos.id')
            ->where('estadisticas_jugadores.competencia_id', $this->id)
            ->selectRaw('users.id, users.name, users.gamertag, users.foto, equipos.nombre as equipo_nombre, avg(estadisticas_jugadores.valoracion) as total')
            ->groupBy('users.id', 'users.name', 'users.gamertag', 'users.foto', 'equipos.nombre')
            ->orderByDesc('total')
            ->limit(3)
            ->get();

        return [
            'goleadores' => $goleadores,
            'asistentes' => $asistentes,
            'mvps' => $mvps
        ];
    }

    public function temporada()
    {
        return $this->belongsTo(Temporada::class);
    }

    public function campeon()
    {
        return $this->belongsTo(Equipo::class, 'campeon_id');
    }

    public function subcampeon()
    {
        return $this->belongsTo(Equipo::class, 'subcampeon_id');
    }

    public function tercerLugar()
    {
        return $this->belongsTo(Equipo::class, 'tercer_lugar_id');
    }

    // Equipos inscritos en esta competencia específica
    public function equipos()
    {
        return $this->belongsToMany(Equipo::class, 'competencia_equipo')
                    ->withPivot('estado_inscripcion')
                    ->withTimestamps();
    }

    // Partidos de esta competencia
    public function partidos()
    {
        return $this->hasMany(Partido::class, 'competencia_id')->orderBy('fecha')->orderBy('hora');
    }
}
