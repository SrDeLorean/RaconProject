<?php

namespace App\Services;

use App\Models\User;
use App\Models\Equipo;
use App\Models\Temporada;
use App\Models\SolicitudFichaje;
use App\Models\OrganizacionEquipoUsuario;
use App\Repositories\Contracts\SolicitudFichajeRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Exception;

class SolicitudFichajeService
{
    protected SolicitudFichajeRepositoryInterface $repository;

    public function __construct(SolicitudFichajeRepositoryInterface $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Listar solicitudes de fichaje filtradas por rol del usuario.
     *
     * @param User $user
     * @param string|null $tipo
     * @return array|Collection
     */
    public function listarSolicitudes(User $user, ?string $tipo = null): array|Collection
    {
        // 1. Si es Administrador u Organizador
        $role = $user->role;
        if ($role === 'admin' || $role === 'administrador' || $role === 'organizador' || $role === 'organizer') {
            $organizacionId = null;
            if ($role === 'organizador' || $role === 'organizer') {
                $org = \App\Models\Organizacion::where('owner_id', $user->id)->first();
                $organizacionId = $org ? $org->id : null;
            }
            return $this->repository->getAll($tipo, $organizacionId);
        }

        // 2. Si se piden ENVIADAS (por el entrenador/dueño del club)
        if ($tipo === 'enviadas') {
            $miEquipo = Equipo::where('id_capitan', $user->id)->first();
            if ($miEquipo) {
                return $this->repository->getEnviadasPorEquipo($miEquipo->id);
            }
            return [];
        }

        // 3. Si se piden RECIBIDAS (por el jugador)
        if ($tipo === 'recibidas') {
            return $this->repository->getRecibidasPendientesPorJugador($user->id);
        }

        // Fallback retrospectivo por rol de capitán
        $miEquipo = Equipo::where('id_capitan', $user->id)->first();
        if ($miEquipo) {
            return $this->repository->getEnviadasPorEquipo($miEquipo->id);
        }

        // Si es solo jugador, ver recibidas
        return $this->repository->getRecibidasPendientesPorJugador($user->id);
    }

    /**
     * Enviar solicitudes de fichaje (una por cada organización elegida).
     *
     * @param User $capitan
     * @param array $data
     * @return array
     * @throws Exception
     */
    public function crearSolicitudes(User $capitan, array $data): array
    {
        $equipo = Equipo::where('id_capitan', $capitan->id)->first();

        if (!$equipo) {
            throw new Exception('No tienes un club registrado para realizar fichajes.', 403);
        }

        $targetPlayer = User::find($data['user_id']);

        if ($targetPlayer->role !== 'jugador') {
            throw new Exception('Solo puedes fichar a usuarios con rol de jugador.', 400);
        }

        if ($targetPlayer->status === 'suspendido') {
            throw new Exception('El competidor está suspendido y no puede ser fichado.', 400);
        }

        $creadas = 0;

        foreach ($data['organizacion_ids'] as $orgId) {
            // Verificar si ya pertenece a NUESTRO club en esa organización
            $yaFichadoEnNuestroClub = OrganizacionEquipoUsuario::where('organizacion_id', $orgId)
                ->where('equipo_id', $equipo->id)
                ->where('user_id', $targetPlayer->id)
                ->first();

            if ($yaFichadoEnNuestroClub) {
                continue;
            }

            // Evitar duplicar solicitudes pendientes
            $pendiente = $this->repository->findPendiente($orgId, $equipo->id, $targetPlayer->id);

            if ($pendiente) {
                continue;
            }

            $temporada = Temporada::where('organizacion_id', $orgId)
                ->where('activa', true)
                ->first();

            // Detectar si el jugador ya tiene club en esta organización (equipo origen)
            $yaTieneClubEnOrg = OrganizacionEquipoUsuario::where('organizacion_id', $orgId)
                ->where('user_id', $targetPlayer->id)
                ->first();
            $equipoOrigenId = $yaTieneClubEnOrg ? $yaTieneClubEnOrg->equipo_id : null;

            $this->repository->create([
                'organizacion_id' => $orgId,
                'temporada_id' => $temporada ? $temporada->id : null,
                'equipo_id' => $equipo->id,
                'equipo_origen_id' => $equipoOrigenId,
                'user_id' => $targetPlayer->id,
                'dorsal' => $data['dorsal'] ?? null,
                'posicion' => $data['posicion'],
                'estado' => 'pendiente_jugador',
            ]);

            $creadas++;
        }

        if ($creadas === 0) {
            throw new Exception('El jugador ya pertenece a un club o tiene solicitudes pendientes en los circuitos elegidos.', 400);
        }

        return ['creadas' => $creadas];
    }

    /**
     * El jugador Acepta o Rechaza la oferta.
     *
     * @param int $id
     * @param int $authUserId
     * @param string $respuesta
     * @return array
     * @throws Exception
     */
    public function responderSolicitud(int $id, int $authUserId, string $respuesta): array
    {
        $solicitud = $this->repository->find($id);

        if (!$solicitud) {
            throw new Exception('Solicitud no encontrada.', 404);
        }

        if ($solicitud->user_id !== $authUserId) {
            throw new Exception('No tienes permiso sobre esta solicitud.', 403);
        }

        if ($solicitud->estado !== 'pendiente_jugador') {
            throw new Exception('Esta solicitud ya ha sido procesada.', 400);
        }

        if ($respuesta === 'rechazar') {
            $this->repository->update($id, ['estado' => 'rechazado']);
            return ['message' => 'Has rechazado la oferta de fichaje.'];
        }

        // El jugador aceptó. Revisamos si ya posee un club activo en esta organización
        $yaTieneClubEnOrg = OrganizacionEquipoUsuario::where('organizacion_id', $solicitud->organizacion_id)
            ->where('user_id', $solicitud->user_id)
            ->first();

        // Revisamos el mercado de la temporada.
        $temporada = Temporada::where('organizacion_id', $solicitud->organizacion_id)
            ->where('activa', true)
            ->first();

        $mercadoAbierto = true;
        if ($temporada) {
            $mercadoAbierto = ($temporada->estado_mercado === 'abierto');
        }

        // Si ya posee club en esta organización, el traspaso DEBE ser autorizado por el administrador
        if ($yaTieneClubEnOrg && $yaTieneClubEnOrg->equipo_id !== $solicitud->equipo_id) {
            $this->repository->update($id, ['estado' => 'pendiente_admin']);
            return ['message' => 'Oferta aceptada. Al tener un club activo en esta organización, el traspaso queda pendiente de aprobación administrativa.'];
        }

        if ($mercadoAbierto) {
            // MERCADO ABIERTO: Incorporación automática al roster
            OrganizacionEquipoUsuario::updateOrCreate(
                [
                    'organizacion_id' => $solicitud->organizacion_id,
                    'user_id' => $solicitud->user_id,
                ],
                [
                    'equipo_id' => $solicitud->equipo_id,
                    'dorsal' => $solicitud->dorsal,
                    'posicion_bloque' => $solicitud->posicion,
                    'estado_fichaje' => 'activo',
                    'fecha_vinculacion' => now(),
                ]
            );

            $this->repository->update($id, ['estado' => 'aprobado']);
            return ['message' => '¡Fichaje completado! Te has unido al roster de manera inmediata.'];
        } else {
            // MERCADO CERRADO: Pasa a aprobación administrativa
            $this->repository->update($id, ['estado' => 'pendiente_admin']);
            return ['message' => 'Oferta aceptada. Al estar el mercado cerrado, el fichaje queda pendiente de aprobación administrativa.'];
        }
    }

    /**
     * El Administrador decide sobre la solicitud en mercado cerrado.
     *
     * @param int $id
     * @param string $role
     * @param string $respuesta
     * @param string|null $observaciones
     * @return array
     * @throws Exception
     */
    public function decidirAdmin(int $id, string $role, string $respuesta, ?string $observaciones = null): array
    {
        $roleLower = strtolower($role);
        if ($roleLower !== 'admin' && $roleLower !== 'administrador' && $roleLower !== 'organizador' && $roleLower !== 'organizer') {
            throw new Exception('Acceso denegado. Solo administradores pueden decidir.', 403);
        }

        $solicitud = $this->repository->find($id);

        if (!$solicitud) {
            throw new Exception('Solicitud no encontrada.', 404);
        }

        // Si es Organizador, verificar que la solicitud pertenezca a su organización
        $user = auth()->user();
        if ($user && ($user->role === 'organizador' || $user->role === 'organizer')) {
            $org = \App\Models\Organizacion::where('owner_id', $user->id)->first();
            if (!$org || $solicitud->organizacion_id !== $org->id) {
                throw new Exception('Acceso denegado. No tienes permisos para gestionar esta solicitud.', 403);
            }
        }

        if ($solicitud->estado !== 'pendiente_admin') {
            throw new Exception('La solicitud no requiere aprobación administrativa.', 400);
        }

        if ($respuesta === 'rechazar') {
            $this->repository->update($id, [
                'estado' => 'rechazado',
                'observaciones_admin' => $observaciones
            ]);
            return ['message' => 'Solicitud de fichaje rechazada por la administración.'];
        }

        // Aprobar e inscribir
        OrganizacionEquipoUsuario::updateOrCreate(
            [
                'organizacion_id' => $solicitud->organizacion_id,
                'user_id' => $solicitud->user_id,
            ],
            [
                'equipo_id' => $solicitud->equipo_id,
                'dorsal' => $solicitud->dorsal,
                'posicion_bloque' => $solicitud->posicion,
                'estado_fichaje' => 'activo',
                'fecha_vinculacion' => now(),
            ]
        );

        $this->repository->update($id, [
            'estado' => 'aprobado',
            'observaciones_admin' => $observaciones
        ]);

        return ['message' => 'Fichaje aprobado de manera administrativa. Jugador incorporado al roster.'];
    }

    /**
     * Cancelar solicitud de fichaje.
     *
     * @param int $id
     * @return bool
     */
    public function cancelarSolicitud(int $id): bool
    {
        return $this->repository->delete($id);
    }

    /**
     * Obtener listado de traspasos/fichajes aprobados en el sistema (público).
     *
     * @return Collection
     */
    public function obtenerTraspasosAprobados(): Collection
    {
        return $this->repository->getAprobados();
    }
}
