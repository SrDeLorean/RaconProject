<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|image|mimes:jpeg,png,jpg,gif,svg,webp|max:4096', // Max 4MB
            'folder' => 'nullable|string|alpha_dash'
        ], [
            'file.required' => 'Debes proporcionar una imagen.',
            'file.image' => 'El archivo debe ser una imagen válida.',
            'file.mimes' => 'Formatos permitidos: jpeg, png, jpg, gif, svg, webp.',
            'file.max' => 'La imagen no puede pesar más de 4MB.'
        ]);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $folder = $request->input('folder', 'general');
            
            // Generar un nombre de archivo único para evitar colisiones
            $filename = Str::random(20) . '_' . time() . '.' . $file->getClientOriginalExtension();
            
            // Carpeta destino dentro de la carpeta public del backend (compatible con XAMPP inmediatamente)
            $destinationPath = public_path("uploads/{$folder}");
            
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }
            
            // Mover archivo a public/uploads/{folder}/{filename}
            $file->move($destinationPath, $filename);
            
            // URL relativa para guardar en BD (ej: /uploads/equipos/xxx.png)
            $url = "/uploads/{$folder}/{$filename}";

            return response()->json([
                'url' => $url,
                'message' => '¡Imagen subida correctamente!'
            ], 200);
        }

        return response()->json(['message' => 'No se detectó ningún archivo en la petición.'], 400);
    }
}
