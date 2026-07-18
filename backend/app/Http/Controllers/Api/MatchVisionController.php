<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\VisionMatchExtractorService;
use Exception;
use Illuminate\Support\Facades\Log;

class MatchVisionController extends Controller
{
    protected $visionService;

    public function __construct(VisionMatchExtractorService $visionService)
    {
        $this->visionService = $visionService;
    }

    /**
     * Extrae estadísticas enviando 2 imágenes base64 a la IA.
     */
    public function extractStats(Request $request)
    {
        $request->validate([
            'team_stats_image' => 'required|string',    // Base64 de las estadísticas del equipo
            'player_stats_image' => 'required|string',  // Base64 del rendimiento de los jugadores
        ]);

        try {
            // Decodificar los Base64 (esperamos el formato data:image/jpeg;base64,...)
            $images = [
                $request->input('team_stats_image'),
                $request->input('player_stats_image')
            ];

            $base64Images = [];
            $mimeTypes = [];

            foreach ($images as $imgStr) {
                // Separar el prefijo (data:image/jpeg;base64,) del contenido real
                if (preg_match('/^data:image\/(\w+);base64,/', $imgStr, $type)) {
                    $imgStr = substr($imgStr, strpos($imgStr, ',') + 1);
                    $mime = 'image/' . strtolower($type[1]);
                } else {
                    $mime = 'image/jpeg'; // Default si no tiene prefijo
                }

                $base64Images[] = $imgStr;
                $mimeTypes[] = $mime;
            }

            // Llamar al servicio
            $extractedData = $this->visionService->extractStatsFromImages($base64Images, $mimeTypes);

            return response()->json([
                'success' => true,
                'data' => $extractedData,
                'message' => 'Estadísticas extraídas correctamente mediante Inteligencia Artificial.'
            ]);

        } catch (Exception $e) {
            Log::error("Error extrayendo stats con IA: " . $e->getMessage());
            
            $statusCode = 500;
            if (strpos($e->getMessage(), '503') !== false) {
                $statusCode = 503;
            }

            return response()->json([
                'success' => false,
                'message' => 'Hubo un error al procesar las imágenes con Inteligencia Artificial.',
                'error' => $e->getMessage()
            ], $statusCode);
        }
    }
}
