<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class UploadController extends Controller
{
    public function upload(Request $request)
    {
        // Limite global de 12 MB (12288 KB)
        $maxSize = 12288;
        $maxSizeMb = '12MB';

        $request->validate([
            'file' => "required|image|mimes:jpeg,png,jpg,gif,svg,webp|max:{$maxSize}",
            'folder' => 'nullable|string|alpha_dash'
        ], [
            'file.required' => 'Debes proporcionar una imagen.',
            'file.image' => 'El archivo debe ser una imagen válida.',
            'file.mimes' => 'Formatos permitidos: jpeg, png, jpg, gif, svg, webp.',
            'file.max' => "La imagen no puede pesar más de {$maxSizeMb}."
        ]);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $folder = $request->input('folder', 'general');
            
            // Obtener extensión original del archivo
            $extension = strtolower($file->getClientOriginalExtension());
            
            // Carpeta destino dentro de la carpeta public del backend (compatible con XAMPP y cPanel)
            $destinationPath = public_path("uploads/{$folder}");
            
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }

            // Si es SVG, simplemente moverlo sin procesar porque Intervention no maneja vectores
            if ($extension === 'svg') {
                $filename = Str::random(20) . '_' . time() . '.svg';
                $file->move($destinationPath, $filename);
                $url = "/uploads/{$folder}/{$filename}";
                
                return response()->json([
                    'url' => $url,
                    'message' => '¡Imagen SVG subida correctamente!'
                ], 200);
            }

            try {
                // Generar un nombre de archivo único con extensión .webp para las imágenes comprimidas
                $filename = Str::random(20) . '_' . time() . '.webp';

                // Crear el manager de Intervention con el driver GD
                $manager = new ImageManager(new Driver());
                
                // Leer la imagen temporal subida
                $image = $manager->read($file->getRealPath());

                // Se solicitó mantener la resolución original de las fotos (especialmente banners), 
                // así que solo aplicaremos la compresión de peso a WebP sin alterar los píxeles.

                // Convertir a WebP con calidad 80 y guardar
                $image->toWebp(80)->save("{$destinationPath}/{$filename}");

                // URL relativa para guardar en BD
                $url = "/uploads/{$folder}/{$filename}";

                return response()->json([
                    'url' => $url,
                    'message' => '¡Imagen subida y comprimida correctamente!'
                ], 200);

            } catch (\Exception $e) {
                // Como fallback si falla Intervention (ej. formato corrupto), simplemente la guardamos normal
                $fallbackFilename = Str::random(20) . '_' . time() . '.' . $extension;
                $file->move($destinationPath, $fallbackFilename);
                $url = "/uploads/{$folder}/{$fallbackFilename}";

                return response()->json([
                    'url' => $url,
                    'message' => '¡Imagen subida sin compresión (hubo un problema procesándola)!',
                    'error_debug' => $e->getMessage()
                ], 200);
            }
        }

        return response()->json(['message' => 'No se detectó ningún archivo en la petición.'], 400);
    }
}
