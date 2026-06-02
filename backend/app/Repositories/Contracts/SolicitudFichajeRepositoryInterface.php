<?php

namespace App\Repositories\Contracts;

use App\Models\SolicitudFichaje;
use Illuminate\Database\Eloquent\Collection;

interface SolicitudFichajeRepositoryInterface
{
    /**
     * Obtener una solicitud por su ID.
     *
     * @param int $id
     * @return SolicitudFichaje|null
     */
    public function find(int $id): ?SolicitudFichaje;

     /**
     * Listar todas las solicitudes con filtros.
     *
     * @param string|null $estado
     * @param int|null $organizacionId
     * @return Collection
     */
    public function getAll(?string $estado = null, ?int $organizacionId = null): Collection;

    /**
     * Obtener solicitudes enviadas por un equipo.
     *
     * @param int $equipoId
     * @return Collection
     */
    public function getEnviadasPorEquipo(int $equipoId): Collection;

    /**
     * Obtener solicitudes recibidas pendientes por un jugador.
     *
     * @param int $userId
     * @return Collection
     */
    public function getRecibidasPendientesPorJugador(int $userId): Collection;

    /**
     * Comprobar si ya existe una solicitud pendiente idéntica.
     *
     * @param int $organizacionId
     * @param int $equipoId
     * @param int $userId
     * @return SolicitudFichaje|null
     */
    public function findPendiente(int $organizacionId, int $equipoId, int $userId): ?SolicitudFichaje;

    /**
     * Crear una nueva solicitud de fichaje.
     *
     * @param array $data
     * @return SolicitudFichaje
     */
    public function create(array $data): SolicitudFichaje;

    /**
     * Actualizar una solicitud existente.
     *
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update(int $id, array $data): bool;

    /**
     * Eliminar/Cancelar una solicitud de fichaje.
     *
     * @param int $id
     * @return bool
     */
    public function delete(int $id): bool;

    /**
     * Listar todos los traspasos/fichajes aprobados en el sistema (público).
     *
     * @return Collection
     */
    public function getAprobados(): Collection;
}
