<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class VisionMatchExtractorService
{
    /**
     * Extrae estadísticas de partido enviando imágenes a la API de Gemini 1.5 Flash.
     *
     * @param string[] $base64Images Arreglo de strings base64 (ej: 'iVBORw0KGgo...')
     * @param string[] $mimeTypes Arreglo de mime types correspondientes (ej: 'image/jpeg')
     * @return array|null Datos estructurados del partido
     */
    public function extractStatsFromImages(array $base64Images, array $mimeTypes): ?array
    {
        $apiKey = env('GEMINI_API_KEY');

        if (empty($apiKey)) {
            Log::error('Gemini API Key no configurada en .env (GEMINI_API_KEY)');
            throw new Exception("La API Key de Gemini no está configurada.");
        }

        $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$apiKey}";

        // Construir el prompt
        $prompt = "Extrae las estadísticas de este reporte de partido de EA FC. Se te proporcionan 1 o 2 imágenes: 
1. La primera muestra las estadísticas globales del equipo (Posesión, Tiros, Pases, Entradas, Recuperaciones, etc.) y el resultado en la parte superior. El equipo de la izquierda es el 'equipo_1' y el de la derecha el 'equipo_2'.
2. La segunda imagen (si existe) muestra el rendimiento individual de los futbolistas de uno de los equipos (Nombre, POS, VAL, G, ASI, Tiros, Pases, etc.).

IMPORTANTE: 
- Si la posición (POS) es 'ST' o 'DEL', tradúcela a 'DC'. Si es 'GK' o 'POR', usa 'POR'. Mantén las posiciones estándar en español.
- Lee los goles del marcador superior para saber cuántos goles hizo cada equipo.

Devuelve ÚNICAMENTE un objeto JSON puro, sin bloques de código Markdown (```json ... ```) ni texto adicional. Usa estrictamente esta estructura (si un dato no está en la imagen, pon 0):
{
  \"equipo_1\": { \"goles\": 0, \"posesion\": 0, \"tiros\": 0, \"pases\": 0, \"entradas\": 0, \"entradas_exitosas\": 0, \"atajadas\": 0, \"precision_pases\": 0, \"asistencias\": 0, \"tarjetas_amarillas\": 0, \"tarjetas_rojas\": 0, \"recuperaciones\": 0, \"fueras_lugar\": 0, \"tiros_esquina\": 0, \"tiros_libres\": 0, \"penales\": 0, \"faltas_cometidas\": 0, \"precision_tiros\": 0, \"tasa_exito_regates\": 0 },
  \"equipo_2\": { \"goles\": 0, \"posesion\": 0, \"tiros\": 0, \"pases\": 0, \"entradas\": 0, \"entradas_exitosas\": 0, \"atajadas\": 0, \"precision_pases\": 0, \"asistencias\": 0, \"tarjetas_amarillas\": 0, \"tarjetas_rojas\": 0, \"recuperaciones\": 0, \"fueras_lugar\": 0, \"tiros_esquina\": 0, \"tiros_libres\": 0, \"penales\": 0, \"faltas_cometidas\": 0, \"precision_tiros\": 0, \"tasa_exito_regates\": 0 },
  \"jugadores\": [
     { \"nombre\": \"NombreDelJugador\", \"posicion\": \"MCO\", \"valoracion\": 8.5, \"goles\": 1, \"asistencias\": 1, \"tiros\": 3, \"pases\": 15, \"entradas\": 2 }
  ]
}";

        // Preparar las partes del contenido para Gemini (Prompt + Imágenes)
        $parts = [
            [
                "text" => $prompt
            ]
        ];

        foreach ($base64Images as $index => $base64) {
            $parts[] = [
                "inline_data" => [
                    "mime_type" => $mimeTypes[$index],
                    "data" => $base64
                ]
            ];
        }

        $payload = [
            "contents" => [
                [
                    "parts" => $parts
                ]
            ],
            "generationConfig" => [
                "temperature" => 0.1, // Baja temperatura para mayor precisión y determinismo
                "topK" => 32,
                "topP" => 1,
                "maxOutputTokens" => 8192,
                "response_mime_type" => "application/json" // Fuerza respuesta JSON
            ]
        ];

        try {
            $response = Http::timeout(60)->post($url, $payload);

            if ($response->successful()) {
                $data = $response->json();
                
                if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                    $jsonString = $data['candidates'][0]['content']['parts'][0]['text'];
                    // Limpiar el string en caso de que Gemini devuelva backticks de markdown a pesar de las instrucciones
                    $jsonString = preg_replace('/```json/i', '', $jsonString);
                    $jsonString = preg_replace('/```/i', '', $jsonString);
                    $jsonString = trim($jsonString);

                    $result = json_decode($jsonString, true);

                    if (json_last_error() === JSON_ERROR_NONE) {
                        return $result;
                    } else {
                        Log::error('Error al decodificar JSON de Gemini: ' . json_last_error_msg(), ['response' => $jsonString]);
                        throw new Exception("La IA no devolvió un JSON válido.");
                    }
                } else {
                    Log::error('Respuesta inesperada de Gemini API', ['response' => $data]);
                    throw new Exception("Estructura de respuesta inesperada de la IA.");
                }
            } else {
                Log::error('Error en Gemini API: HTTP ' . $response->status(), ['body' => $response->body()]);
                throw new Exception("Error al conectar con la API de IA (HTTP " . $response->status() . ").");
            }
        } catch (\Exception $e) {
            Log::error('Excepción al llamar a Gemini API: ' . $e->getMessage());
            throw $e;
        }
    }
}
