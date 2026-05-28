<?php

namespace App\Http\Controllers\Api;

use App\Models\SolicitudFichaje;
use App\Models\Equipo;
use App\Models\Temporada;
use App\Models\OrganizacionEquipoUsuario;
use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class SolicitudFichajeController extends Controller
{
    /**
     * Listar solicitudes de fichaje según el rol.
     */
    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();
        $tipo = $request->query('tipo');

        // 1. Si explícitamente se piden ENVIADAS (por el entrenador/dueño del club)
        if ($tipo === 'enviadas') {
            $miEquipo = Equipo::where('id_capitan', $user->id)->first();
            if ($miEquipo) {
                $solicitudes = SolicitudFichaje::with(['organizacion', 'jugador'])
                    ->where('equipo_id', $miEquipo->id)
                    ->orderBy('created_at', 'desc')
                    ->get();
                return response()->json($solicitudes);
            }
            return response()->json([]);
        }

        // 2. Si explícitamente se piden RECIBIDAS (por el jugador)
        if ($tipo === 'recibidas') {
            $solicitudes = SolicitudFichaje::with(['equipo', 'organizacion'])
                ->where('user_id', $user->id)
                ->where('estado', 'pendiente_jugador')
                ->get();
            return response()->json($solicitudes);
        }

        // 3. Si explícitamente se piden PENDIENTES DE ADMIN (para administradores)
        if ($tipo === 'pendientes_admin') {
            $solicitudes = SolicitudFichaje::with(['equipo', 'organizacion', 'jugador'])
                ->where('estado', 'pendiente_admin')
                ->get();
            return response()->json($solicitudes);
        }

        // Fallback retrospectivo por rol
        if ($user->role === 'admin' || $user->role === 'organizador') {
            $solicitudes = SolicitudFichaje::with(['equipo', 'organizacion', 'jugador'])
                ->where('estado', 'pendiente_admin')
                ->get();
            return response()->json($solicitudes);
        }

        // Si es capitán (dueño de equipo), ver enviadas
        $miEquipo = Equipo::where('id_capitan', $user->id)->first();
        if ($miEquipo) {
            $solicitudes = SolicitudFichaje::with(['organizacion', 'jugador'])
                ->where('equipo_id', $miEquipo->id)
                ->orderBy('created_at', 'desc')
                ->get();
            return response()->json($solicitudes);
        }

        // Si es solo jugador, ver recibidas
        $solicitudes = SolicitudFichaje::with(['equipo', 'organizacion'])
            ->where('user_id', $user->id)
            ->where('estado', 'pendiente_jugador')
            ->get();
        return response()->json($solicitudes);
    }

    /**
     * Enviar solicitudes de fichaje (una por cada organización elegida).
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'posicion' => 'required|string',
            'dorsal' => 'nullable|string',
            'organizacion_ids' => 'required|array|min:1',
            'organizacion_ids.*' => 'exists:organizaciones,id'
        ]);

        $capitan = auth()->user();
        $equipo = Equipo::where('id_capitan', $capitan->id)->first();

        if (!$equipo) {
            return response()->json(['message' => 'No tienes un club registrado para realizar fichajes.'], 403);
        }

        $targetPlayer = User::find($request->user_id);

        if ($targetPlayer->role !== 'jugador') {
            return response()->json(['message' => 'Solo puedes fichar a usuarios con rol de jugador.'], 400);
        }

        if ($targetPlayer->status === 'suspendido') {
            return response()->json(['message' => 'El competidor está suspendido y no puede ser fichado.'], 400);
        }

        $creadas = 0;

        foreach ($request->organizacion_ids as $orgId) {
            // Verificar si ya pertenece a NUESTRO club en esa organización
            $yaFichadoEnNuestroClub = OrganizacionEquipoUsuario::where('organizacion_id', $orgId)
                ->where('equipo_id', $equipo->id)
                ->where('user_id', $targetPlayer->id)
                ->first();

            if ($yaFichadoEnNuestroClub) {
                continue; // Saltar si ya tiene club en esta organización
            }

            // Evitar duplicar solicitudes pendientes
            $pendiente = SolicitudFichaje::where('organizacion_id', $orgId)
                ->where('equipo_id', $equipo->id)
                ->where('user_id', $targetPlayer->id)
                ->whereIn('estado', ['pendiente_jugador', 'pendiente_admin'])
                ->first();

            if ($pendiente) {
                continue;
            }

            $temporada = Temporada::where('organizacion_id', $orgId)
                ->where('activa', true)
                ->first();

            SolicitudFichaje::create([
                'organizacion_id' => $orgId,
                'temporada_id' => $temporada ? $temporada->id : null,
                'equipo_id' => $equipo->id,
                'user_id' => $targetPlayer->id,
                'dorsal' => $request->dorsal,
                'posicion' => $request->posicion,
                'estado' => 'pendiente_jugador',
            ]);

            $creadas++;
        }

        if ($creadas === 0) {
            return response()->json(['message' => 'El jugador ya pertenece a un club o tiene solicitudes pendientes en los circuitos elegidos.'], 400);
        }

        return response()->json(['message' => "Se han enviado ($creadas) solicitudes de fichaje con éxito."], 201);
    }

    /**
     * El jugador Acepta o Rechaza la oferta.
     */
    public function responder(Request $request, $id): JsonResponse
    {
        $request->validate([
            'respuesta' => 'required|in:aceptar,rechazar'
        ]);

        $solicitud = SolicitudFichaje::findOrFail($id);

        if ($solicitud->user_id !== auth()->id()) {
            return response()->json(['message' => 'No tienes permiso sobre esta solicitud.'], 403);
        }

        if ($solicitud->estado !== 'pendiente_jugador') {
            return response()->json(['message' => 'Esta solicitud ya ha sido procesada.'], 400);
        }

        if ($request->respuesta === 'rechazar') {
            $solicitud->update(['estado' => 'rechazado']);
            return response()->json(['message' => 'Has rechazado la oferta de fichaje.']);
        }

        // El jugador aceptó. Revisamos si ya posee un club activo en esta organización
        $yaTieneClubEnOrg = OrganizacionEquipoUsuario::where('organizacion_id', $solicitud->organizacion_id)
            ->where('user_id', $solicitud->user_id)
            ->first();

        // Revisamos el mercado de la temporada.
        $temporada = Temporada::where('organizacion_id', $solicitud->organizacion_id)
            ->where('activa', true)
            ->first();

        $mercadoAbierto = true; // Por defecto abierto si no hay temporada
        if ($temporada) {
            $mercadoAbierto = ($temporada->estado_mercado === 'abierto');
        }

        // Si ya posee club en esta organización, el traspaso DEBE ser autorizado por el administrador
        if ($yaTieneClubEnOrg && $yaTieneClubEnOrg->equipo_id !== $solicitud->equipo_id) {
            $solicitud->update(['estado' => 'pendiente_admin']);
            return response()->json(['message' => 'Oferta aceptada. Al tener un club activo en esta organización, el traspaso queda pendiente de aprobación administrativa.']);
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

            $solicitud->update(['estado' => 'aprobado']);
            return response()->json(['message' => '¡Fichaje completado! Te has unido al roster de manera inmediata.']);
        } else {
            // MERCADO CERRADO: Pasa a aprobación administrativa
            $solicitud->update(['estado' => 'pendiente_admin']);
            return response()->json(['message' => 'Oferta aceptada. Al estar el mercado cerrado, el fichaje queda pendiente de aprobación administrativa.']);
        }
    }

    /**
     * El Administrador decide sobre la solicitud en mercado cerrado.
     */
    public function decidirAdmin(Request $request, $id): JsonResponse
    {
        $request->validate([
            'respuesta' => 'required|in:aprobar,rechazar',
            'observaciones' => 'nullable|string'
        ]);

        $user = auth()->user();
        if ($user->role !== 'admin' && $user->role !== 'organizador') {
            return response()->json(['message' => 'Acceso denegado. Solo administradores pueden decidir.'], 403);
        }

        $solicitud = SolicitudFichaje::findOrFail($id);

        if ($solicitud->estado !== 'pendiente_admin') {
            return response()->json(['message' => 'La solicitud no requiere aprobación administrativa.'], 400);
        }

        if ($request->respuesta === 'rechazar') {
            $solicitud->update([
                'estado' => 'rechazado',
                'observaciones_admin' => $request->observaciones
            ]);
            return response()->json(['message' => 'Solicitud de fichaje rechazada por la administración.']);
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

        $solicitud->update([
            'estado' => 'aprobado',
            'observaciones_admin' => $request->observaciones
        ]);

        return response()->json(['message' => 'Fichaje aprobado de manera administrativa. Jugador incorporado al roster.']);
    }

    /**
     * Eliminar/Cancelar solicitud
     */
    public function destroy($id): JsonResponse
    {
        $solicitud = SolicitudFichaje::findOrFail($id);
        $solicitud->delete();
        return response()->json(['message' => 'Solicitud cancelada.']);
    }
}
