<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrganizacionEquipoUsuario extends Model
{
    protected $table = 'organizacion_equipo_usuario';

    protected $fillable = [
        'organizacion_id', 'equipo_id', 'user_id', 'estado_fichaje', 'fecha_vinculacion', 'dorsal', 'posicion_bloque'
    ];

    protected $casts = [
        'organizacion_id' => 'integer',
        'equipo_id' => 'integer',
        'user_id' => 'integer',
        'fecha_vinculacion' => 'datetime',
    ];

    public function organizacion()
    {
        return $this->belongsTo(Organizacion::class);
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
