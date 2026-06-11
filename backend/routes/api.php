<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\OrganizacionController;
use App\Http\Controllers\Api\EquipoController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\CompetenciaController;
use App\Http\Controllers\Api\EquipoJugadorController;
use App\Http\Controllers\Api\SolicitudFichajeController;
use App\Http\Controllers\Api\TemporadaController;
use App\Http\Controllers\Api\CompetenciaEquipoController;
use App\Http\Controllers\Api\CompetenciaUtController;
use App\Http\Controllers\Api\PartidoUtController;
use App\Http\Controllers\Api\ReporteUtController;
use App\Http\Controllers\Api\InscripcionUTController;

// 1. Rutas Públicas (No requieren token)
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
Route::post('/resend-verification', [AuthController::class, 'resendVerification']);

// Rutas de consulta pública (lectura sin token)
Route::get('/organizaciones', [OrganizacionController::class, 'index']);
Route::get('/organizaciones/{organizacion}', [OrganizacionController::class, 'show']);
Route::get('/equipos', [EquipoController::class, 'index']);
Route::get('/equipos/{equipo}', [EquipoController::class, 'show']);
Route::get('/users', [UserController::class, 'index']);
Route::get('/usuarios', [UserController::class, 'index']);
Route::get('/usuarios/{usuario}', [UserController::class, 'show'])->whereNumber('usuario');
Route::get('/competencias', [CompetenciaController::class, 'index']);
Route::get('/competencias/{competencia}', [CompetenciaController::class, 'show']);
Route::get('/traspasos/aprobados', [SolicitudFichajeController::class, 'aprobados']);
Route::get('/analytics/totw-tots', [UserController::class, 'totwTots']);
Route::get('/analytics/infografia', [UserController::class, 'infografia']);
Route::get('/analytics/public-stats', [UserController::class, 'publicStats']);
Route::post('/contacto', [UserController::class, 'contacto']);

Route::get('/media', function (Illuminate\Http\Request $request) {
    $path = $request->query('path');
    if (!$path) {
        return response()->json(['error' => 'Path is required'], 400);
    }
    
    // Normalize path to prevent directory traversal
    $path = ltrim($path, '/');
    if (strpos($path, '..') !== false) {
        return response()->json(['error' => 'Invalid path'], 400);
    }
    
    $fullPath = public_path($path);
    if (!file_exists($fullPath) || !is_file($fullPath)) {
        // Return a default placeholder with CORS headers
        $defaultUserPath = public_path('images/users/default-user.png');
        if (file_exists($defaultUserPath)) {
            return response()->file($defaultUserPath, [
                'Access-Control-Allow-Origin' => '*',
                'Cache-Control' => 'no-cache'
            ]);
        }
        return response()->json(['error' => 'File not found'], 404);
    }
    
    return response()->file($fullPath, [
        'Access-Control-Allow-Origin' => '*',
        'Cache-Control' => 'public, max-age=86400'
    ]);
});

// 2. Rutas Protegidas (Requieren token de Sanctum)
Route::middleware('auth:sanctum')->group(function () {

    // Obtener datos del usuario logueado
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::get('/analytics/dashboard-stats', [UserController::class, 'dashboardStats']);

    // Subida general de imágenes
    Route::post('/upload', [\App\Http\Controllers\Api\UploadController::class, 'upload']);

    Route::post('/logout', [AuthController::class, 'logout']);

    // Rutas de tus entidades (Protegemos escritura, permitimos lectura pública arriba)
    Route::apiResource('organizaciones', OrganizacionController::class)
        ->parameters(['organizaciones' => 'organizacion'])
        ->except(['index', 'show']);
    Route::get('/mi-equipo', [EquipoController::class, 'miEquipo']);
    Route::get('/user/mis-equipos', [EquipoController::class, 'misEquiposInscritos']);
    Route::apiResource('equipos', EquipoController::class)->except(['index', 'show']);
    Route::get('/usuarios/auditoria', [UserController::class, 'auditoriaGamerTAGs']);
    Route::post('/usuarios/disponibles', [UserController::class, 'disponibles']);
    Route::apiResource('users', UserController::class)->except(['index', 'show']);
    Route::apiResource('usuarios', UserController::class)->except(['index', 'show']);

    Route::apiResource('competencias', CompetenciaController::class)->except(['index', 'show']);
    Route::apiResource('equipo-jugador', EquipoJugadorController::class);

    Route::apiResource('solicitudes-fichaje', SolicitudFichajeController::class);
    Route::post('/solicitudes-fichaje/{solicitud}/responder', [SolicitudFichajeController::class, 'responder']);
    Route::post('/solicitudes-fichaje/{solicitud}/admin-decidir', [SolicitudFichajeController::class, 'decidirAdmin']);

    Route::apiResource('temporadas', TemporadaController::class);

    Route::get('competencias/{competencia}/equipos/disponibles', [CompetenciaEquipoController::class, 'disponibles']);
    Route::apiResource('competencias.equipos', CompetenciaEquipoController::class)->only(['index', 'store', 'update', 'destroy']);

    // Gestión del Roster del Equipo por Organización
    Route::post('/equipos/{equipo}/roster', [EquipoController::class, 'addRosterJugador']);
    Route::put('/equipos/{equipo}/roster/{user}', [EquipoController::class, 'updateRosterJugador']);
    Route::delete('/equipos/{equipo}/roster/{user}', [EquipoController::class, 'removeRosterJugador']);

    // Partidos y Matchmaker Oficial
    Route::post('/competencias/{competencia}/partidos/bulk', [\App\Http\Controllers\Api\PartidoController::class, 'bulkStore']);
    Route::apiResource('partidos', \App\Http\Controllers\Api\PartidoController::class)->except(['index', 'show']);

    // Reporte de Partidos vía EA Pro Clubs API
    Route::get('/partidos/{partido}/ea-matches', [\App\Http\Controllers\Api\ReporteController::class, 'getEaMatches']);
    Route::post('/partidos/{partido}/ea-report', [\App\Http\Controllers\Api\ReporteController::class, 'storeEaReport']);

    // ─── Rutas Protegidas UT 1v1 y 2v2 ───────────────────
    Route::apiResource('competencias-ut', CompetenciaUtController::class)->except(['index', 'show']);
    Route::post('/competencias-ut/{competenciaUt}/inscribir', [CompetenciaUtController::class, 'inscribir']);
    Route::post('/competencias-ut/{competenciaUt}/partidos/bulk', [PartidoUtController::class, 'bulkStore']);
    Route::apiResource('partidos-ut', PartidoUtController::class)->except(['index', 'show']);
    Route::get('/partidos-ut/{partido}/ea-matches', [ReporteUtController::class, 'getEaMatches']);
    Route::post('/partidos-ut/{partido}/ea-report', [ReporteUtController::class, 'storeEaReport']);
    Route::put('/inscripciones-ut/{id}', [InscripcionUTController::class, 'update']);
    Route::delete('/inscripciones-ut/{id}', [InscripcionUTController::class, 'destroy']);
});

// Rutas Públicas de Partidos 11v11
Route::get('/partidos', [\App\Http\Controllers\Api\PartidoController::class, 'index']);
Route::get('/partidos-fechas', [\App\Http\Controllers\Api\PartidoController::class, 'dates']);
Route::get('/partidos-conteos', [\App\Http\Controllers\Api\PartidoController::class, 'counts']);
Route::get('/partidos/{partido}', [\App\Http\Controllers\Api\PartidoController::class, 'show']);

// Rutas Públicas UT 1v1 y 2v2
Route::get('/competencias-ut', [CompetenciaUtController::class, 'index']);
Route::get('/competencias-ut/{competenciaUt}', [CompetenciaUtController::class, 'show']);
Route::get('/partidos-ut', [PartidoUtController::class, 'index']);
Route::get('/partidos-ut-fechas', [PartidoUtController::class, 'dates']);
Route::get('/partidos-ut-conteos', [PartidoUtController::class, 'counts']);
Route::get('/partidos-ut/{partido}', [PartidoUtController::class, 'show']);



