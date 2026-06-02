<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSolicitudFichajeRequest;
use App\Http\Requests\ResponderSolicitudFichajeRequest;
use App\Http\Requests\DecidirAdminSolicitudFichajeRequest;
use App\Services\SolicitudFichajeService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Throwable;

class SolicitudFichajeController extends Controller
{
    use ApiResponse;

    protected SolicitudFichajeService $service;

    /**
     * Inyectar el servicio de negocio.
     *
     * @param SolicitudFichajeService $service
     */
    public function __construct(SolicitudFichajeService $service)
    {
        $this->service = $service;
    }

    /**
     * Listar solicitudes de fichaje según el rol.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = auth()->user();
            $tipo = $request->query('tipo');

            $solicitudes = $this->service->listarSolicitudes($user, $tipo);

            return $this->successResponse(
                $solicitudes,
                'Listado de solicitudes recuperado exitosamente.'
            );
        } catch (Throwable $e) {
            return $this->errorResponse(
                'Error al recuperar el listado de solicitudes: ' . $e->getMessage(),
                $e->getCode() >= 400 && $e->getCode() <= 500 ? $e->getCode() : 500
            );
        }
    }

    /**
     * Enviar solicitudes de fichaje (una por cada organización elegida).
     *
     * @param StoreSolicitudFichajeRequest $request
     * @return JsonResponse
     */
    public function store(StoreSolicitudFichajeRequest $request): JsonResponse
    {
        try {
            $capitan = auth()->user();
            $validated = $request->validated();

            $resultado = $this->service->crearSolicitudes($capitan, $validated);

            return $this->successResponse(
                null,
                "Se han enviado ({$resultado['creadas']}) solicitudes de fichaje con éxito.",
                201
            );
        } catch (Throwable $e) {
            return $this->errorResponse(
                $e->getMessage(),
                $e->getCode() >= 400 && $e->getCode() <= 500 ? $e->getCode() : 500
            );
        }
    }

    /**
     * El jugador Acepta o Rechaza la oferta.
     *
     * @param ResponderSolicitudFichajeRequest $request
     * @param int $id
     * @return JsonResponse
     */
    public function responder(ResponderSolicitudFichajeRequest $request, $id): JsonResponse
    {
        try {
            $authUserId = auth()->id();
            $respuesta = $request->input('respuesta');

            $resultado = $this->service->responderSolicitud((int)$id, $authUserId, $respuesta);

            return $this->successResponse(
                null,
                $resultado['message']
            );
        } catch (Throwable $e) {
            return $this->errorResponse(
                $e->getMessage(),
                $e->getCode() >= 400 && $e->getCode() <= 500 ? $e->getCode() : 500
            );
        }
    }

    /**
     * El Administrador decide sobre la solicitud en mercado cerrado o traspaso entre clubes.
     *
     * @param DecidirAdminSolicitudFichajeRequest $request
     * @param int $id
     * @return JsonResponse
     */
    public function decidirAdmin(DecidirAdminSolicitudFichajeRequest $request, $id): JsonResponse
    {
        try {
            $user = auth()->user();
            $respuesta = $request->input('respuesta');
            $observaciones = $request->input('observaciones');

            $resultado = $this->service->decidirAdmin((int)$id, $user->role, $respuesta, $observaciones);

            return $this->successResponse(
                null,
                $resultado['message']
            );
        } catch (Throwable $e) {
            return $this->errorResponse(
                $e->getMessage(),
                $e->getCode() >= 400 && $e->getCode() <= 500 ? $e->getCode() : 500
            );
        }
    }

    /**
     * Eliminar/Cancelar solicitud de fichaje.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy($id): JsonResponse
    {
        try {
            $eliminado = $this->service->cancelarSolicitud((int)$id);

            if (!$eliminado) {
                return $this->errorResponse('La solicitud no pudo ser encontrada o cancelada.', 404);
            }

            return $this->successResponse(
                null,
                'Solicitud cancelada con éxito.'
            );
        } catch (Throwable $e) {
            return $this->errorResponse(
                'Error al cancelar la solicitud: ' . $e->getMessage(),
                500
            );
        }
    }

    /**
     * Obtener listado de traspasos/fichajes aprobados en el sistema (público).
     *
     * @return JsonResponse
     */
    public function aprobados(): JsonResponse
    {
        try {
            $solicitudes = $this->service->obtenerTraspasosAprobados();

            return $this->successResponse(
                $solicitudes,
                'Traspasos aprobados recuperados exitosamente.'
            );
        } catch (Throwable $e) {
            return $this->errorResponse(
                'Error al recuperar traspasos aprobados: ' . $e->getMessage(),
                500
            );
        }
    }
}
