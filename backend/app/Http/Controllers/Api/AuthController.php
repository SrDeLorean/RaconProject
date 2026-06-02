<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        // 1. Validamos que envíen los datos
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        // 2. Intentamos autenticar con la base de datos
        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'message' => 'Credenciales incorrectas. Verifica tu correo y contraseña.'
            ], 401);
        }

        // 3. Si es correcto, buscamos al usuario y le creamos su Token
        $user = User::where('email', $request->email)->with('organizacion')->firstOrFail();
        $token = $user->createToken('auth_token')->plainTextToken;

        // 4. Retornamos user y token en la raíz para que Zustand los lea directo
        return response()->json([
            'user' => $user,
            'token' => $token,
            'message' => 'Bienvenido al sistema'
        ], 200);
    }

    public function register(Request $request)
    {
        // 1. Validamos los datos que llegan desde React
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            // Validamos que el rol sea exactamente uno de los permitidos por seguridad
            'role' => 'required|in:jugador,organizador,admin',
            // Campos gamer opcionales en el registro
            'gamertag' => 'nullable|string|max:255|unique:users',
            'id_ea' => 'nullable|string|max:255|unique:users',
            'plataforma' => 'nullable|in:ps5,xbox,pc,crossplay'
        ], [
            'email.unique' => 'Este correo electrónico ya está registrado.',
            'gamertag.unique' => 'Este Gamertag ya está en uso.',
            'id_ea.unique' => 'Este EA ID ya está en uso.',
            'password.confirmed' => 'Las contraseñas no coinciden.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.'
        ]);

        // 2. Creamos al usuario en la base de datos y encriptamos la clave
        $user = User::create([
            'name' => $validatedData['name'],
            'email' => $validatedData['email'],
            'password' => Hash::make($validatedData['password']),
            'role' => $validatedData['role'], // Asignamos el rol elegido en el frontend
            'gamertag' => $validatedData['gamertag'] ?? null,
            'id_ea' => $validatedData['id_ea'] ?? null,
            'plataforma' => $validatedData['plataforma'] ?? null,
        ]);

        // 3. Generamos su token de acceso inmediato
        $token = $user->createToken('auth_token')->plainTextToken;

        // 4. Misma estructura de respuesta que el Login
        return response()->json([
            'user' => $user,
            'token' => $token,
            'message' => 'Cuenta creada con éxito'
        ], 201);
    }

    // NUEVO MÉTODO RECOMENDADO: Para limpiar el token en el backend
    public function logout(Request $request)
    {
        // Revoca (elimina) el token actual que se usó para la petición
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Sesión cerrada exitosamente'
        ], 200);
    }

    // 🔥 NUEVO: Solicitar recuperación de contraseña (valida existencia de email y envía correo real)
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email'
        ], [
            'email.exists' => 'Este correo electrónico no está registrado en el sistema.'
        ]);

        $user = User::where('email', $request->email)->firstOrFail();
        
        // Generamos un token seguro y lo guardamos temporalmente en la columna 'remember_token'
        $token = bin2hex(random_bytes(16));
        $user->remember_token = $token;
        $user->save();

        // Enviar el correo electrónico real mediante el sistema de Laravel Mail
        try {
            \Illuminate\Support\Facades\Mail::send([], [], function ($message) use ($request, $token) {
                $message->to($request->email)
                        ->subject('Recuperación de Contraseña - RaconPro')
                        ->html("
                            <div style='font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #2d3748; border-radius: 16px; background-color: #0f172a; color: #f8fafc;'>
                                <div style='text-align: center; margin-bottom: 28px;'>
                                    <div style='display: inline-block; width: 60px; height: 60px; line-height: 60px; border-radius: 16px; background: linear-gradient(135deg, #e11d48, #be123c); color: #ffffff; font-size: 28px; font-weight: 900; box-shadow: 0 4px 15px rgba(225,29,72,0.4);'>R</div>
                                    <h1 style='font-size: 22px; font-weight: bold; margin-top: 16px; color: #ffffff; letter-spacing: 0.05em;'>RECUPERACIÓN DE CONTRASEÑA</h1>
                                    <p style='font-size: 13px; color: #94a3b8; margin-top: 4px;'>Centro de Mando RaconPro</p>
                                </div>
                                <p style='font-size: 15px; line-height: 1.6;'>Hola <strong>{$token}</strong> (Token de Seguridad),</p>
                                <p style='font-size: 15px; line-height: 1.6;'>Has recibido este correo porque solicitaste restablecer la contraseña de tu cuenta en la plataforma de torneos <strong>RaconPro</strong>.</p>
                                
                                <div style='margin: 32px 0; text-align: center;'>
                                    <p style='font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #94a3b8; margin-bottom: 10px; font-weight: bold;'>Tu Código Seguro de Restablecimiento:</p>
                                    <div style='display: inline-block; padding: 16px 32px; font-size: 20px; font-family: monospace; font-weight: bold; background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; color: #f43f5e; letter-spacing: 0.1em;'>
                                        {$token}
                                    </div>
                                </div>
                                
                                <p style='font-size: 14px; line-height: 1.6; color: #94a3b8;'>Por favor, copia y pega este código en el formulario de la aplicación para poder asignar tu nueva clave de acceso.</p>
                                <p style='font-size: 14px; line-height: 1.6; color: #64748b;'>Si no realizaste esta solicitud, puedes ignorar este mensaje de forma segura.</p>
                                <hr style='border: 0; border-top: 1px solid #334155; margin: 30px 0;' />
                                <p style='font-size: 11px; color: #64748b; text-align: center;'>Este correo es automático, por favor no respondas directamente. &copy; RaconPro.</p>
                            </div>
                        ");
            });
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Error al enviar correo de recuperación: " . $e->getMessage());
        }

        return response()->json([
            'message' => 'Se ha enviado un enlace de recuperación de contraseña a tu correo electrónico.',
            'token' => $token,
            'email' => $request->email
        ], 200);
    }

    // 🔥 NUEVO: Restablecer contraseña real en base de datos validando el token
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'token' => 'required',
            'password' => 'required|string|min:8|confirmed'
        ], [
            'password.confirmed' => 'Las contraseñas no coinciden.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.'
        ]);

        $user = User::where('email', $request->email)->firstOrFail();

        // Validamos que el token de recuperación sea el correcto
        if (!$user->remember_token || $user->remember_token !== $request->token) {
            return response()->json([
                'message' => 'El código de seguridad o token de recuperación es inválido o ya ha sido utilizado.'
            ], 422);
        }

        $user->password = Hash::make($request->password);
        $user->remember_token = null; // Limpiamos el token de un solo uso por seguridad
        $user->save();

        return response()->json([
            'message' => 'Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva clave.'
        ], 200);
    }
}
