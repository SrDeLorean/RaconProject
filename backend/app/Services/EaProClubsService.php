<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EaProClubsService
{
    public function obtenerPartidos(string $clubId): array
    {
        try {
            $response = Http::withOptions([
                'verify' => false, // MUY IMPORTANTE en cPanel / shared hosting
            ])->withHeaders([
                'User-Agent' =>
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept'            => 'application/json, text/plain, */*',
                'Accept-Language'   => 'es-ES,es;q=0.9,en;q=0.8',
                'Accept-Encoding'   => 'gzip, deflate, br',
                'Referer'           => 'https://www.ea.com/',
                'Origin'            => 'https://www.ea.com',
                'Connection'        => 'keep-alive',
            ])
            ->timeout(20)
            ->get('https://proclubs.ea.com/api/fc/clubs/matches', [
                'clubIds'   => $clubId,
                'matchType' => 'friendlyMatch',
                'platform'  => 'common-gen5',
                'maxResultCount' => 12,
            ]);

            if (!$response->ok()) {
                Log::error('EA HTTP error', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);

                return $this->emptyResponse();
            }

            $data = $response->json();

            return [
                'matchType' => 'friendlyMatch',
                'matches'   => is_array($data) ? $data : [],
            ];

        } catch (\Throwable $e) {
            Log::error('EA Exception', [
                'error' => $e->getMessage(),
            ]);

            return $this->emptyResponse();
        }
    }

    private function emptyResponse(): array
    {
        return [
            'matchType' => 'friendlyMatch',
            'matches'   => [],
        ];
    }
}
