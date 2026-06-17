<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Ruta de ayuda para limpiar y optimizar caché en cPanel (sin terminal SSH)
Route::get('/clear-cache', function () {
    try {
        \Illuminate\Support\Facades\Artisan::call('optimize:clear');
        return response()->json([
            'success' => true,
            'message' => 'Cachés optimizadas y limpiadas exitosamente en cPanel.',
            'output' => \Illuminate\Support\Facades\Artisan::output()
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'success' => false,
            'message' => 'Error al limpiar la caché: ' . $e->getMessage()
        ], 500);
    }
});

// ⚡ FALLBACK DE IMÁGENES NO ENCONTRADAS (Evita NotFoundHttpException y sirve placeholders por default)
Route::get('uploads/usuarios/{filename}', function ($filename) {
    $path = public_path('images/users/default-user.png');
    return file_exists($path) ? response()->file($path) : response('Not found', 404);
});

Route::get('uploads/equipos/{filename}', function ($filename) {
    $isBanner = str_contains(strtolower($filename), 'banner');
    $defaultFile = $isBanner ? 'default-team-banner.svg' : 'default-team-logo.svg';
    $path = public_path('images/' . $defaultFile);
    return file_exists($path) ? response()->file($path) : response('Not found', 404);
});

Route::get('uploads/organizaciones/{filename}', function ($filename) {
    $isBanner = str_contains(strtolower($filename), 'banner');
    $defaultFile = $isBanner ? 'default-org-banner.svg' : 'default-org-logo.svg';
    $path = public_path('images/' . $defaultFile);
    return file_exists($path) ? response()->file($path) : response('Not found', 404);
});

Route::get('uploads/general/{filename}', function ($filename) {
    $path = public_path('images/default-org-logo.svg');
    return file_exists($path) ? response()->file($path) : response('Not found', 404);
});

