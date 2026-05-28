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

// 1. Rutas Públicas (No requieren token)
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Rutas de consulta pública (lectura sin token)
Route::get('/organizaciones', [OrganizacionController::class, 'index']);
Route::get('/organizaciones/{organizacion}', [OrganizacionController::class, 'show']);
Route::get('/equipos', [EquipoController::class, 'index']);
Route::get('/equipos/{equipo}', [EquipoController::class, 'show']);
Route::get('/users', [UserController::class, 'index']);
Route::get('/usuarios', [UserController::class, 'index']);
Route::get('/usuarios/{usuario}', [UserController::class, 'show']);
Route::get('/competencias/{competencia}', [CompetenciaController::class, 'show']);

// 2. Rutas Protegidas (Requieren token de Sanctum)
Route::middleware('auth:sanctum')->group(function () {

    // Obtener datos del usuario logueado
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/logout', [AuthController::class, 'logout']);

    // Rutas de tus entidades (Protegemos escritura, permitimos lectura pública arriba)
    Route::apiResource('organizaciones', OrganizacionController::class)->except(['index', 'show']);
    Route::get('/mi-equipo', [EquipoController::class, 'miEquipo']);
    Route::get('/user/mis-equipos', [EquipoController::class, 'misEquiposInscritos']);
    Route::apiResource('equipos', EquipoController::class)->except(['index', 'show']);
    Route::apiResource('users', UserController::class)->except(['index', 'show']);
    Route::apiResource('usuarios', UserController::class)->except(['index', 'show']);
    Route::post('/usuarios/disponibles', [UserController::class, 'disponibles']);

    Route::apiResource('competencias', CompetenciaController::class)->except(['show']);
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
});

// Rutas Públicas de Partidos
Route::get('/partidos', [\App\Http\Controllers\Api\PartidoController::class, 'index']);
Route::get('/partidos/{partido}', [\App\Http\Controllers\Api\PartidoController::class, 'show']);

