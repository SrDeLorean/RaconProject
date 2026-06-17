<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Detener la exclusión de todas las excepciones internas comunes de Laravel para reportar absolutamente todo
        $exceptions->stopIgnoring([
            \Illuminate\Auth\AuthenticationException::class,
            \Illuminate\Auth\Access\AuthorizationException::class,
            \Illuminate\Routing\Exceptions\BackedEnumCaseNotFoundException::class,
            \Symfony\Component\HttpKernel\Exception\HttpException::class,
            \Illuminate\Http\Exceptions\HttpResponseException::class,
            \Illuminate\Database\Eloquent\ModelNotFoundException::class,
            \Illuminate\Database\MultipleRecordsFoundException::class,
            \Illuminate\Database\RecordNotFoundException::class,
            \Illuminate\Database\RecordsNotFoundException::class,
            \Symfony\Component\HttpFoundation\Exception\RequestExceptionInterface::class,
            \Illuminate\Session\TokenMismatchException::class,
            \Illuminate\Validation\ValidationException::class,
        ]);

        // Registrar un callback de reporte para escribir todos los errores en laravel.log con contexto de la petición y evitar duplicados
        $exceptions->report(function (\Throwable $e) {
            $context = [
                'exception' => $e,
            ];

            // Si no estamos en consola, agregar información detallada de la petición HTTP
            if (!app()->runningInConsole()) {
                $context['url'] = request()->fullUrl();
                $context['method'] = request()->method();
                $context['input'] = request()->except(['password', 'password_confirmation', 'current_password', 'token', 'password_verified_at']);
                $context['ip'] = request()->ip();
            }

            // Si es un error de validación, incluir detalladamente qué campos fallaron y por qué
            if ($e instanceof \Illuminate\Validation\ValidationException) {
                $context['validation_errors'] = $e->errors();
            }

            \Illuminate\Support\Facades\Log::error('[' . get_class($e) . '] ' . $e->getMessage(), $context);

            return false; // Evita que Laravel duplique el registro del error en el log estándar
        });
    })->create();
