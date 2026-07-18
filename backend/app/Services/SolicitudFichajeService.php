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
            // Check if there is a competition in this organization where transfers are disabled
            $hasDisabledTransfers = \App\Models\Competencia::whereHas('temporada', function ($query) use ($orgId) {
                $query->where('organizacion_id', $orgId);
            })->get()->contains(function ($comp) {
                return isset($comp->config['sin_transferencias']) && $comp->config['sin_transferencias'] == true;
            });

            if ($hasDisabledTransfers) {
                throw new Exception('Las transferencias están deshabilitadas en esta competencia/organización.', 403);
            }

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

        if ((int)$solicitud->user_id !== (int)$authUserId) {
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
        if ($yaTieneClubEnOrg && (int)$yaTieneClubEnOrg->equipo_id !== (int)$solicitud->equipo_id) {
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
            if (!$org || (int)$solicitud->organizacion_id !== (int)$org->id) {
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
     * Fichar a un jugador directamente (Sin aprobación, por parte del Organizador).
     *
     * @param User $admin
     * @param int $equipoId
     * @param int $jugadorId
     * @param array $datosFichaje
     * @return array
     * @throws Exception
     */
    public function ficharDirectoAdministrativo(User $admin, int $equipoId, int $jugadorId, array $datosFichaje): array
    {
        $roleLower = strtolower($admin->role);
        if ($roleLower !== 'admin' && $roleLower !== 'administrador' && $roleLower !== 'organizador' && $roleLower !== 'organizer') {
            throw new Exception('Acceso denegado. Solo administradores u organizadores pueden fichar directamente.', 403);
        }

        $equipo = Equipo::find($equipoId);
        if (!$equipo) {
            throw new Exception('El equipo no existe.', 404);
        }

        $jugador = User::find($jugadorId);
        if (!$jugador || strtolower($jugador->role) !== 'jugador') {
            throw new Exception('El usuario no existe o no es un jugador.', 404);
        }

        if ($jugador->status === 'suspendido') {
            throw new Exception('El jugador está suspendido y no puede ser fichado.', 400);
        }

        $organizacionId = $equipo->organizacion_id; // Depende de cómo esté la BD, pero OrganizacionEquipoUsuario lo necesita.
        // Si no está en equipo, sacamos la orgId de los datos del request o del owner.
        // Pero el equipo debe pertenecer a la organización del Organizador.
        if ($roleLower === 'organizador' || $roleLower === 'organizer') {
            $org = \App\Models\Organizacion::where('owner_id', $admin->id)->first();
            if (!$org) {
                throw new Exception('No se encontró una organización asociada a tu cuenta.', 404);
            }
            $organizacionId = $org->id;
        } else {
            // Administrador global, asume que se pasa en los datos o que el equipo ya está vinculado
            // Por simplicidad, tomamos el del owner
            $organizacionId = $datosFichaje['organizacion_id'] ?? 1; // Fallback
        }

        // Revisar si ya pertenece a OTRO equipo en esta organización
        $yaTieneClubEnOrg = OrganizacionEquipoUsuario::where('organizacion_id', $organizacionId)
            ->where('user_id', $jugador->id)
            ->first();
            
        $equipoOrigenId = $yaTieneClubEnOrg ? $yaTieneClubEnOrg->equipo_id : null;

        if ($yaTieneClubEnOrg && (int)$yaTieneClubEnOrg->equipo_id === (int)$equipoId) {
            throw new Exception('El jugador ya pertenece a este equipo.', 400);
        }

        $temporada = Temporada::where('organizacion_id', $organizacionId)
            ->where('activa', true)
            ->first();

        // Crear la Solicitud (Aprobada)
        $this->repository->create([
            'organizacion_id' => $organizacionId,
            'temporada_id' => $temporada ? $temporada->id : null,
            'equipo_id' => $equipoId,
            'equipo_origen_id' => $equipoOrigenId,
            'user_id' => $jugador->id,
            'dorsal' => $datosFichaje['dorsal'] ?? null,
            'posicion' => $datosFichaje['posicion'] ?? null,
            'estado' => 'aprobado',
            'observaciones_admin' => 'Fichado administrativamente por la Organización'
        ]);

        // Insertar/Actualizar en el roster
        OrganizacionEquipoUsuario::updateOrCreate(
            [
                'organizacion_id' => $organizacionId,
                'user_id' => $jugador->id,
            ],
            [
                'equipo_id' => $equipoId,
                'dorsal' => $datosFichaje['dorsal'] ?? null,
                'posicion_bloque' => $datosFichaje['posicion'] ?? null,
                'estado_fichaje' => 'activo',
                'fecha_vinculacion' => now(),
            ]
        );

        return ['message' => 'Fichaje directo realizado con éxito. El jugador ha sido incorporado al roster.'];
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
