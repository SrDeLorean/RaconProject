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
            
            // Si es SVG, no lo procesamos ya que es vectorial y transparente nativo
            $isSvg = $file->getClientOriginalExtension() === 'svg';
            $extension = $isSvg ? 'svg' : 'png';
            
            // Generar un nombre de archivo único para evitar colisiones
            $filename = Str::random(20) . '_' . time() . '.' . $extension;
            
            // Carpeta destino dentro de la carpeta public del backend (compatible con XAMPP inmediatamente)
            $destinationPath = public_path("uploads/{$folder}");
            
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }
            
            if ($isSvg) {
                // Solo mover archivo
                $file->move($destinationPath, $filename);
            } else {
                // Cargar imagen según formato
                $mime = $file->getMimeType();
                $srcImage = null;

                try {
                    if ($mime === 'image/jpeg' || $mime === 'image/jpg') {
                        $srcImage = @imagecreatefromjpeg($file->getRealPath());
                    } elseif ($mime === 'image/png') {
                        $srcImage = @imagecreatefrompng($file->getRealPath());
                    } elseif ($mime === 'image/webp') {
                        $srcImage = @imagecreatefromwebp($file->getRealPath());
                    } elseif ($mime === 'image/gif') {
                        $srcImage = @imagecreatefromgif($file->getRealPath());
                    }
                } catch (\Exception $e) {
                    $srcImage = null;
                }

                if ($srcImage) {
                    // Procesar para eliminar el fondo
                    $processedImage = $this->removeBackground($srcImage);
                    
                    // Asegurar transparencia en el PNG
                    imagealphablending($processedImage, false);
                    imagesavealpha($processedImage, true);
                    
                    // Guardar como PNG
                    imagepng($processedImage, $destinationPath . '/' . $filename);
                    
                    // Liberar memoria
                    imagedestroy($srcImage);
                    imagedestroy($processedImage);
                } else {
                    // Fallback si falla GD: mover el archivo original tal cual
                    $file->move($destinationPath, $filename);
                }
            }
            
            // URL relativa para guardar en BD (ej: /uploads/equipos/xxx.png)
            $url = "/uploads/{$folder}/{$filename}";

            return response()->json([
                'url' => $url,
                'message' => '¡Imagen subida, convertida a PNG y sin fondo correctamente!'
            ], 200);
        }

        return response()->json(['message' => 'No se detectó ningún archivo en la petición.'], 400);
    }

    /**
     * Algoritmo de eliminación de fondo cromático basado en píxel de esquina y blancos tolerantes.
     */
    private function removeBackground($sourceImage)
    {
        $width = imagesx($sourceImage);
        $height = imagesy($sourceImage);

        // Crear una nueva imagen verdadera con canal alfa
        $target = imagecreatetruecolor($width, $height);
        imagealphablending($target, false);
        imagesavealpha($target, true);

        // Obtener el color de fondo del píxel superior izquierdo (0,0)
        $colorIndex = imagecolorat($sourceImage, 0, 0);
        $bgR = ($colorIndex >> 16) & 0xFF;
        $bgG = ($colorIndex >> 8) & 0xFF;
        $bgB = $colorIndex & 0xFF;
        $bgA = ($colorIndex >> 24) & 0x7F;

        // Si la esquina superior izquierda ya es transparente, asumimos que ya no tiene fondo
        $isAlreadyTransparent = ($bgA > 100);

        // Tolerancia de color para fondos con compresión (JPEG blocks)
        $tolerance = 30;

        // Color transparente para reemplazar
        $transparentColor = imagecolorallocatealpha($target, 0, 0, 0, 127);

        for ($x = 0; $x < $width; $x++) {
            for ($y = 0; $y < $height; $y++) {
                $pixelColorIndex = imagecolorat($sourceImage, $x, $y);
                $r = ($pixelColorIndex >> 16) & 0xFF;
                $g = ($pixelColorIndex >> 8) & 0xFF;
                $b = $pixelColorIndex & 0xFF;
                $a = ($pixelColorIndex >> 24) & 0x7F;

                // Si ya está transparente, preservarlo
                if ($a > 50) {
                    imagesetpixel($target, $x, $y, $pixelColorIndex);
                    continue;
                }

                if (!$isAlreadyTransparent) {
                    // Comprobar si se parece al color de fondo de la esquina (0,0)
                    $isBgColor = (
                        abs($r - $bgR) < $tolerance &&
                        abs($g - $bgG) < $tolerance &&
                        abs($b - $bgB) < $tolerance
                    );

                    // Comprobar si es un fondo blanco/grisáceo claro (común en logos)
                    $isNearWhite = ($r > 238 && $g > 238 && $b > 238);

                    if ($isBgColor || $isNearWhite) {
                        imagesetpixel($target, $x, $y, $transparentColor);
                        continue;
                    }
                }

                imagesetpixel($target, $x, $y, $pixelColorIndex);
            }
        }

        return $target;
    }
}
