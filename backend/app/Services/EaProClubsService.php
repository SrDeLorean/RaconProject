<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Models\Equipo;
use App\Models\Partido;
use App\Models\User;

class EaProClubsService
{
    public function obtenerPartidos(string $clubId): array
    {
        $matches = [];
        $matchType = 'friendlyMatch';

        try {
            $response = Http::withOptions([
                'verify' => false,
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
            ->timeout(8)
            ->get('https://proclubs.ea.com/api/fc/clubs/matches', [
                'clubIds'   => $clubId,
                'matchType' => 'friendlyMatch',
                'platform'  => 'common-gen5',
                'maxResultCount' => 12,
            ]);

            if ($response->ok() && is_array($response->json()) && count($response->json()) > 0) {
                return [
                    'matchType' => 'friendlyMatch',
                    'matches'   => $response->json(),
                ];
            }
        } catch (\Throwable $e) {
            Log::warning('EA HTTP request failed, falling back to mock data: ' . $e->getMessage());
        }

        // Mock data fallback for local environment / testing
        if (app()->environment('local')) {
            $matches = $this->generateMockMatches($clubId);
        }

        return [
            'matchType' => $matchType,
            'matches'   => $matches,
        ];
    }

    private function generateMockMatches(string $clubId): array
    {
        $team = Equipo::where('club_id_ea', $clubId)->first();
        if (!$team) {
            return [];
        }

        // Buscar partidos de este equipo
        $partidos = Partido::where(function($query) use ($team) {
            $query->where('equipo_local_id', $team->id)
                  ->orWhere('equipo_visitante_id', $team->id);
        })
        ->whereNull('goles_local')
        ->whereNull('goles_visitante')
        ->with(['local', 'visitante'])
        ->take(3)
        ->get();

        if ($partidos->isEmpty()) {
            return [];
        }

        $mockMatches = [];

        foreach ($partidos as $idx => $partido) {
            $local = $partido->local;
            $visit = $partido->visitante;

            $localEaId = $local->club_id_ea ?: '50000';
            $visitEaId = $visit->club_id_ea ?: '50001';

            // Obtener usuarios del roster
            $localUsers = User::whereIn('id', DB::table('organizacion_equipo_usuario')
                ->where('equipo_id', $local->id)
                ->where('estado_fichaje', 'activo')
                ->pluck('user_id')
            )->get();

            $visitUsers = User::whereIn('id', DB::table('organizacion_equipo_usuario')
                ->where('equipo_id', $visit->id)
                ->where('estado_fichaje', 'activo')
                ->pluck('user_id')
            )->get();

            // Construir jugadores locales
            $localPlayersData = [];
            foreach ($localUsers as $i => $u) {
                $playername = $u->gamertag ?: $u->name;
                
                if ($i === 2) {
                    // Jugador que mandamos con gamertag incorrecto
                    $playername = 'Wrong_GamerTag_Local'; 
                }

                $localPlayersData[] = [
                    'playername' => $playername,
                    'pos' => 'MCO',
                    'goals' => $i === 0 ? '2' : '0',
                    'assists' => $i === 1 ? '1' : '0',
                    'shots' => $i === 0 ? '4' : '0',
                    'passesmade' => '10',
                    'passattempts' => '12',
                    'rating' => '7.5',
                ];
            }

            // Agregar jugador no registrado
            $localPlayersData[] = [
                'playername' => 'Unregistered_Player_Local',
                'pos' => 'DEL',
                'rating' => '6.0'
            ];

            // Construir jugadores visitantes
            $visitPlayersData = [];
            foreach ($visitUsers as $i => $u) {
                $playername = $u->gamertag ?: $u->name;

                if ($i === 2) {
                    // Jugador de otro equipo
                    $otherUser = User::where('role', 'jugador')
                        ->whereNotIn('id', $visitUsers->pluck('id'))
                        ->whereNotIn('id', $localUsers->pluck('id'))
                        ->first();
                    if ($otherUser) {
                        $playername = $otherUser->gamertag;
                    }
                }

                $visitPlayersData[] = [
                    'playername' => $playername,
                    'pos' => 'DEL',
                    'goals' => $i === 0 ? '1' : '0',
                    'assists' => '0',
                    'rating' => '6.8',
                ];
            }

            // Generar discrepancia de ID EA y Gamertag
            if ($visitUsers->isNotEmpty()) {
                $firstVisitUser = $visitUsers[0];
                if (!empty($firstVisitUser->id_ea) && !empty($firstVisitUser->gamertag)) {
                    $firstVisitUser->id_ea = 'EA_ID_mismatch_123';
                    $firstVisitUser->save();
                }
            }

            // Vaciar el gamertag de uno para probar alerta de gamertag vacío
            if ($localUsers->count() >= 2) {
                $secondLocalUser = $localUsers[1];
                $secondLocalUser->gamertag = '';
                $secondLocalUser->save();
            }

            $mockMatches[] = [
                'matchId' => "mock-match-{$partido->id}-{$idx}",
                'timestamp' => time() - ($idx * 3600),
                'timeAgo' => [
                    'number' => $idx + 1,
                    'unit' => 'hours',
                ],
                'clubs' => [
                    $localEaId => [
                        'goals' => '2',
                        'goalsAgainst' => '1',
                        'details' => [
                            'name' => $local->nombre,
                        ]
                    ],
                    $visitEaId => [
                        'goals' => '1',
                        'goalsAgainst' => '2',
                        'details' => [
                            'name' => $visit->nombre,
                        ]
                    ]
                ],
                'players' => [
                    $localEaId => $localPlayersData,
                    $visitEaId => $visitPlayersData,
                ],
                'aggregate' => [
                    $localEaId => [
                        'goals' => '2',
                        'goalsAgainst' => '1',
                        'shots' => '6',
                        'passesmade' => '30',
                        'passattempts' => '40',
                        'tacklesmade' => '4',
                        'tackleattempts' => '6',
                        'rating' => '7.2',
                    ],
                    $visitEaId => [
                        'goals' => '1',
                        'goalsAgainst' => '2',
                        'shots' => '4',
                        'passesmade' => '24',
                        'passattempts' => '35',
                        'tacklesmade' => '3',
                        'tackleattempts' => '5',
                        'rating' => '6.5',
                    ]
                ]
            ];
        }

        return $mockMatches;
    }

    private function emptyResponse(): array
    {
        return [
            'matchType' => 'friendlyMatch',
            'matches'   => [],
        ];
    }
}
