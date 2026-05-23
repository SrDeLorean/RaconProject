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
        $user = User::where('email', $request->email)->firstOrFail();
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
            'role' => 'required|in:jugador,organizador,admin'
        ]);

        // 2. Creamos al usuario en la base de datos y encriptamos la clave
        $user = User::create([
            'name' => $validatedData['name'],
            'email' => $validatedData['email'],
            'password' => Hash::make($validatedData['password']),
            'role' => $validatedData['role'], // Asignamos el rol elegido en el frontend
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
}
