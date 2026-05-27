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

// 2. Rutas Protegidas (Requieren token de Sanctum)
Route::middleware('auth:sanctum')->group(function () {

    // Obtener datos del usuario logueado
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/logout', [AuthController::class, 'logout']);

    // Rutas de tus entidades (El nombre a la izquierda debe coincidir con lo que llama React)
    Route::apiResource('organizaciones', OrganizacionController::class);
    Route::get('/mi-equipo', [EquipoController::class, 'miEquipo']);
    Route::apiResource('equipos', EquipoController::class);
    Route::apiResource('users', UserController::class);
    Route::apiResource('usuarios', UserController::class);
    Route::apiResource('competencias', CompetenciaController::class);
    Route::apiResource('equipo-jugador', EquipoJugadorController::class);

    Route::apiResource('solicitudes-fichaje', SolicitudFichajeController::class);
    Route::apiResource('temporadas', TemporadaController::class);

    Route::get('competencias/{competencia}/equipos/disponibles', [CompetenciaEquipoController::class, 'disponibles']);
Route::apiResource('competencias.equipos', CompetenciaEquipoController::class)->only(['index', 'store', 'update', 'destroy']);
    // Si Ibex generó otras, agrégalas aquí adentro. Ejemplo:
    // Route::apiResource('temporadas', TemporadaController::class);
    // Route::apiResource('competencias', CompetenciaController::class);
});
