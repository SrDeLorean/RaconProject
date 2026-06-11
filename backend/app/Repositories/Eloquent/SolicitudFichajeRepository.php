<?php

namespace App\Repositories\Eloquent;

use App\Models\SolicitudFichaje;
use App\Repositories\Contracts\SolicitudFichajeRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class SolicitudFichajeRepository implements SolicitudFichajeRepositoryInterface
{
    /**
     * @inheritDoc
     */
    public function find(int $id): ?SolicitudFichaje
    {
        return SolicitudFichaje::find($id);
    }

    /**
     * @inheritDoc
     */
    public function getAll(?string $estado = null, ?int $organizacionId = null): Collection
    {
        $query = SolicitudFichaje::with([
            'equipo', 
            'equipoOrigen', 
            'organizacion', 
            'jugador',
            'jugador.historial_fichajes' => function($q) {
                $q->with(['equipo', 'equipoOrigen', 'organizacion'])->take(3);
            }
        ]);

        if ($organizacionId) {
            $query->where('organizacion_id', $organizacionId);
        }

        if ($estado) {
            if ($estado !== 'todos') {
                $query->where('estado', $estado);
            }
        } else {
            $query->where('estado', 'pendiente_admin');
        }

        return $query->orderBy('created_at', 'desc')->get();
    }

    /**
     * @inheritDoc
     */
    public function getEnviadasPorEquipo(int $equipoId): Collection
    {
        return SolicitudFichaje::with(['organizacion', 'jugador'])
            ->where('equipo_id', $equipoId)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * @inheritDoc
     */
    public function getRecibidasPendientesPorJugador(int $userId): Collection
    {
        return SolicitudFichaje::with(['equipo', 'organizacion'])
            ->where('user_id', $userId)
            ->where('estado', 'pendiente_jugador')
            ->get();
    }

    /**
     * @inheritDoc
     */
    public function findPendiente(int $organizacionId, int $equipoId, int $userId): ?SolicitudFichaje
    {
        return SolicitudFichaje::where('organizacion_id', $organizacionId)
            ->where('equipo_id', $equipoId)
            ->where('user_id', $userId)
            ->whereIn('estado', ['pendiente_jugador', 'pendiente_admin'])
            ->first();
    }

    /**
     * @inheritDoc
     */
    public function create(array $data): SolicitudFichaje
    {
        return SolicitudFichaje::create($data);
    }

    /**
     * @inheritDoc
     */
    public function update(int $id, array $data): bool
    {
        $solicitud = $this->find($id);
        if (!$solicitud) {
            return false;
        }
        return $solicitud->update($data);
    }

    /**
     * @inheritDoc
     */
    public function delete(int $id): bool
    {
        $solicitud = $this->find($id);
        if (!$solicitud) {
            return false;
        }
        return $solicitud->delete();
    }

    /**
     * @inheritDoc
     */
    public function getAprobados(): Collection
    {
        return SolicitudFichaje::with([
            'jugador:id,name,foto,gamertag',
            'equipo:id,nombre,logo,abreviatura',
            'equipoOrigen:id,nombre,logo,abreviatura',
            'organizacion:id,nombre,logo'
        ])
        ->where('estado', 'aprobado')
        ->orderBy('updated_at', 'desc')
        ->get();
    }
}
