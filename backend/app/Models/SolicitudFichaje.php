<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SolicitudFichaje extends Model
{
    use HasFactory;

    protected $table = 'solicitudes_fichaje';

    protected $fillable = [
        'temporada_id', 'equipo_id', 'user_id', 'estado', 'comprobante_pago', 'observaciones_admin'
    ];

    public function temporada()
    {
        return $this->belongsTo(Temporada::class);
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
