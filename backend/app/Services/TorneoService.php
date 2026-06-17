<?php

namespace App\Services;

use App\Models\Competencia;
use App\Models\CompetenciaUt;
use App\Models\Partido;
use App\Models\PartidoUt;
use Illuminate\Support\Facades\DB;

class TorneoService
{
    /**
     * Trigger auto-advance check on match score updates.
     */
    public function autoAvanzarFase($competenciaId, $isUt = false)
    {
        $comp = $isUt 
            ? CompetenciaUt::with('equipos')->find($competenciaId)
            : Competencia::with('equipos')->find($competenciaId);

        if (!$comp) return;

        // Bypass the auto_avanzar_fase check so bracket advancement always triggers on match reports
        // since there is no manual advancement route in the UI.
        /*
        $config = $comp->config;
        if (!$config || empty($config['auto_avanzar_fase'])) {
            return;
        }
        */

        $partidoClass = $isUt ? PartidoUt::class : Partido::class;
        $relationId = $isUt ? 'competencia_ut_id' : 'competencia_id';

        // 1. Get all matches
        $partidos = $partidoClass::where($relationId, $competenciaId)->get();

        // 2. Filter group/league stage matches
        $groupMatches = $partidos->filter(function($p) {
            return !empty($p->grupo) || str_contains(strtolower($p->jornada), 'grupo') || str_contains(strtolower($p->jornada), 'jornada') || str_contains(strtolower($p->jornada), 'liga');
        });

        if (!$groupMatches->isEmpty()) {
            // 3. Check if all group matches are finished
            $allGroupFinished = $groupMatches->every(function($p) {
                return $p->goles_local !== null && $p->goles_visitante !== null;
            });

            if (!$allGroupFinished) {
                return;
            }

            // 4. Check if playoffs are already generated
            $hasPlayoffs = $partidos->contains(function($p) {
                $j = strtolower($p->jornada);
                return empty($p->grupo) && (
                    str_contains($j, 'octavos') || 
                    str_contains($j, 'cuartos') || 
                    str_contains($j, 'semi') || 
                    str_contains($j, 'final') || 
                    str_contains($j, 'playoff')
                );
            });

            if ($hasPlayoffs) {
                // Resolve group stage qualifiers in existing empty playoff matches
                $this->resolverClasificadosDeGrupos($comp, $partidos, $isUt);

                // Playoffs exist. Try to advance winners in existing bracket!
                $this->avanzarPlayoffsExistentes($comp, $partidos, $isUt);
            } else {
                // 5. Generate first round of playoffs
                $this->generarPlayoffsIniciales($comp, $partidos, $isUt);
            }
        } else {
            // No group matches: this is a direct elimination bracket tournament from the start.
            // Just advance winners in the existing playoff bracket matches!
            $this->avanzarPlayoffsExistentes($comp, $partidos, $isUt);
        }

        // Clear the cache to ensure the frontend loads the updated matchups immediately.
        $cacheKey = $isUt ? 'competencia_ut_show_' . $competenciaId : 'competencia_show_' . $competenciaId;
        \Illuminate\Support\Facades\Cache::forget($cacheKey);
    }

    /**
     * Resolve group standings qualifiers into pre-generated playoff matches.
     */
    private function resolverClasificadosDeGrupos($comp, $partidos, $isUt)
    {
        $config = $comp->config;
        $numGroups = $config['cantidad_grupos'] ?? 1;
        $qualifiersPerGroup = $config['clasificados_por_grupo'] ?? 2;

        $localIdCol = $isUt ? 'equipo_ut_local_id' : 'equipo_local_id';
        $visitanteIdCol = $isUt ? 'equipo_ut_visitante_id' : 'equipo_visitante_id';

        // 1. Compute standings for all groups
        $groupStandings = [];
        $groupMatches = $partidos->filter(fn($p) => !empty($p->grupo));
        
        $groupTeams = [];
        foreach ($groupMatches as $p) {
            $g = $p->grupo;
            $lid = $p->$localIdCol;
            $vid = $p->$visitanteIdCol;
            if ($lid) $groupTeams[$g][$lid] = true;
            if ($vid) $groupTeams[$g][$vid] = true;
        }

        $groupNames = array_keys($groupTeams);
        sort($groupNames);

        foreach ($groupNames as $gName) {
            $teamIds = array_keys($groupTeams[$gName] ?? []);
            $teamsInGroup = $comp->equipos->filter(fn($t) => in_array($t->id, $teamIds));
            $groupMatchesFiltered = $groupMatches->filter(fn($p) => $p->grupo === $gName);
            
            $standings = $this->computeStandings($teamsInGroup, $groupMatchesFiltered);
            $groupStandings[$gName] = $standings;
        }

        // 2. Find playoff matches
        $playoffs = $partidos->filter(fn($p) => empty($p->grupo));
        $hasUpdated = false;

        foreach ($playoffs as $p) {
            $pStats = $p->stats;
            if (is_string($pStats)) {
                $pStats = json_decode($pStats, true) ?? [];
            }

            $updateData = [];

            // Resolve local team if it's a group stage placeholder
            if (isset($pStats['placeholderLocal'])) {
                $code = $pStats['placeholderLocal'];
                $parts = explode('-', $code);
                if (count($parts) === 3 && $parts[0] === 'g') {
                    $g = $parts[1];
                    $pos = (int)$parts[2] - 1;
                    if (isset($groupStandings[$g][$pos])) {
                        $team = $groupStandings[$g][$pos]['model'];
                        if ($p->$localIdCol !== $team->id) {
                            $updateData[$localIdCol] = $team->id;
                            $p->$localIdCol = $team->id; // update in memory too
                            $hasUpdated = true;
                        }
                    }
                }
            }

            // Resolve visitante team if it's a group stage placeholder
            if (isset($pStats['placeholderVisitante'])) {
                $code = $pStats['placeholderVisitante'];
                $parts = explode('-', $code);
                if (count($parts) === 3 && $parts[0] === 'g') {
                    $g = $parts[1];
                    $pos = (int)$parts[2] - 1;
                    if (isset($groupStandings[$g][$pos])) {
                        $team = $groupStandings[$g][$pos]['model'];
                        if ($p->$visitanteIdCol !== $team->id) {
                            $updateData[$visitanteIdCol] = $team->id;
                            $p->$visitanteIdCol = $team->id; // update in memory too
                            $hasUpdated = true;
                        }
                    }
                }
            }

            if (!empty($updateData)) {
                $p->update($updateData);
            }
        }

        // 3. Propagate BYEs if any team resolved to a BYE or if we have BYEs in playoff matches
        if ($hasUpdated) {
            $this->propagarBYEs($playoffs, $isUt);
        }
    }

    /**
     * Generate initial playoff bracket based on group/league standings.
     */
    private function generarPlayoffsIniciales($comp, $partidos, $isUt)
    {
        $config = $comp->config;
        $numGroups = $config['cantidad_grupos'] ?? 1;
        $qualifiersPerGroup = $config['clasificados_por_grupo'] ?? 2;
        $modoPlayoff = $config['modo_playoff'] ?? 'doble'; // 'simple' (Solo Ida) | 'doble' (Ida y Vuelta)

        $clasificados = [];

        if ($numGroups == 1) {
            // Single league: get top X teams
            $standings = $this->computeStandings($comp->equipos, $partidos);
            $limit = min(count($standings), $qualifiersPerGroup);
            for ($i = 0; $i < $limit; $i++) {
                $clasificados[] = $standings[$i]['model'];
            }
        } else {
            // Multiple groups: get top X from each group
            $gruposMap = [];
            // Group stage matches have "grupo" column set
            $groupMatches = $partidos->filter(fn($p) => !empty($p->grupo));
            
            // Group teams by their matches
            $groupTeams = [];
            foreach ($groupMatches as $p) {
                $g = $p->grupo;
                $lid = $p->equipo_local_id ?? $p->equipo_ut_local_id;
                $vid = $p->equipo_visitante_id ?? $p->equipo_ut_visitante_id;
                if ($lid) $groupTeams[$g][$lid] = true;
                if ($vid) $groupTeams[$g][$vid] = true;
            }

            $groupNames = array_keys($groupTeams);
            sort($groupNames);

            foreach ($groupNames as $gName) {
                $teamIds = array_keys($groupTeams[$gName] ?? []);
                $teamsInGroup = $comp->equipos->filter(fn($t) => in_array($t->id, $teamIds));
                $groupMatchesFiltered = $groupMatches->filter(fn($p) => $p->grupo === $gName);
                
                $standings = $this->computeStandings($teamsInGroup, $groupMatchesFiltered);
                $limit = min(count($standings), $qualifiersPerGroup);
                for ($i = 0; $i < $limit; $i++) {
                    $clasificados[] = $standings[$i]['model'];
                }
            }
        }

        if (empty($clasificados)) {
            return;
        }

        // Generate full playoff bracket
        $this->construirEInsertarBracket($comp, $clasificados, $modoPlayoff, $isUt);
    }

    /**
     * Build and insert a full bracket of playoff matches.
     */
    private function construirEInsertarBracket($comp, $teamsList, $modoPlayoff, $isUt)
    {
        $totalTeams = count($teamsList);
        $power = 2;
        while ($power < $totalTeams) {
            $power *= 2;
        }

        $list = $teamsList;
        // Pad with BYEs if needed
        while (count($list) < $power) {
            $list[] = null; // null represents BYE
        }

        $partidoClass = $isUt ? PartidoUt::class : Partido::class;
        $relationId = $isUt ? 'competencia_ut_id' : 'competencia_id';
        $localIdCol = $isUt ? 'equipo_ut_local_id' : 'equipo_local_id';
        $visitanteIdCol = $isUt ? 'equipo_ut_visitante_id' : 'equipo_visitante_id';

        $currentPower = $power;
        $roundIndex = 0;
        $roundMatchups = [];
        $insertedMatches = [];

        // Determine first match date (e.g. today or tomorrow)
        $matchDate = date('Y-m-d');
        $matchTime = '22:00';

        while ($currentPower >= 2) {
            $roundName = $currentPower === 16 ? 'Octavos' : ($currentPower === 8 ? 'Cuartos' : ($currentPower === 4 ? 'Semis' : 'Final'));
            $numMatchups = $currentPower / 2;
            $matchupsInRound = [];

            for ($i = 0; $i < $numMatchups; $i++) {
                $isFirstRound = ($roundIndex === 0);
                
                $teamL = $isFirstRound ? $list[$i * 2] : null;
                $teamV = $isFirstRound ? $list[$i * 2 + 1] : null;

                // If one of the teams is a BYE, we can auto-advance
                $scoreL = null;
                $scoreV = null;
                if ($isFirstRound) {
                    if ($teamL === null && $teamV !== null) {
                        $scoreL = 0; $scoreV = 3;
                    } elseif ($teamL !== null && $teamV === null) {
                        $scoreL = 3; $scoreV = 0;
                    }
                }

                // Leg 1 (Ida)
                $statsIda = [
                    'leg' => 'Ida',
                    'matchupIndex' => $i,
                ];

                $p1 = $partidoClass::create([
                    $relationId => $comp->id,
                    $localIdCol => $teamL ? $teamL->id : null,
                    $visitanteIdCol => $teamV ? $teamV->id : null,
                    'jornada' => $roundName,
                    'grupo' => null,
                    'fecha' => $matchDate,
                    'hora' => $matchTime,
                    'goles_local' => $scoreL,
                    'goles_visitante' => $scoreV,
                    'stats' => $statsIda
                ]);
                $matchupsInRound[$i][] = $p1;
                $insertedMatches[] = $p1;

                // Leg 2 (Vuelta)
                if ($modoPlayoff === 'doble') {
                    $statsVuelta = [
                        'leg' => 'Vuelta',
                        'matchupIndex' => $i,
                    ];

                    $p2 = $partidoClass::create([
                        $relationId => $comp->id,
                        $localIdCol => $teamV ? $teamV->id : null,
                        $visitanteIdCol => $teamL ? $teamL->id : null,
                        'jornada' => $roundName,
                        'grupo' => null,
                        'fecha' => $matchDate,
                        'hora' => $matchTime,
                        'goles_local' => $scoreV,
                        'goles_visitante' => $scoreL,
                        'stats' => $statsVuelta
                    ]);
                    $matchupsInRound[$i][] = $p2;
                    $insertedMatches[] = $p2;
                }
            }

            $roundMatchups[] = $matchupsInRound;
            $currentPower /= 2;
            $roundIndex++;
        }

        // Link rounds in stats metadata to allow auto-advancement
        for ($r = 0; $r < count($roundMatchups) - 1; $r++) {
            $currentRound = $roundMatchups[$r];
            $nextRound = $roundMatchups[$r + 1];

            foreach ($currentRound as $mIdx => $matches) {
                $nextMatchupIdx = floor($mIdx / 2);
                $slot = ($mIdx % 2 === 0) ? 'local' : 'visitante';
                
                foreach ($matches as $p) {
                    $pStats = $p->stats;
                    if (is_string($pStats)) {
                        $pStats = json_decode($pStats, true) ?? [];
                    }
                    $pStats['siguienteMatchup'] = [
                        'jornada' => $nextRound[$nextMatchupIdx][0]->jornada,
                        'matchupIndex' => (int)$nextMatchupIdx,
                        'slot' => $slot
                    ];
                    $p->update(['stats' => $pStats]);
                }
            }
        }

        // Propagate BYEs dynamically
        $this->propagarBYEs($insertedMatches, $isUt);
    }

    /**
     * Auto-propagate BYEs through the newly created bracket.
     */
    private function propagarBYEs($matches, $isUt)
    {
        $localIdCol = $isUt ? 'equipo_ut_local_id' : 'equipo_local_id';
        $visitanteIdCol = $isUt ? 'equipo_ut_visitante_id' : 'equipo_visitante_id';

        // Precompute fallback leg and matchupIndex values if missing from stats JSON
        $matchesByRound = [];
        foreach ($matches as $p) {
            $matchesByRound[$p->jornada][] = $p;
        }

        $fallbackLegs = [];
        $fallbackMatchupIndices = [];

        foreach ($matches as $p) {
            $pStats = $p->stats;
            if (is_string($pStats)) {
                $pStats = json_decode($pStats, true) ?? [];
            }
            if (!isset($pStats['matchupIndex'])) {
                $roundMatches = $matchesByRound[$p->jornada] ?? [];
                usort($roundMatches, fn($a, $b) => $a->id - $b->id);
                $idxInRound = 0;
                foreach ($roundMatches as $rmIdx => $rm) {
                    if ($rm->id === $p->id) {
                        $idxInRound = $rmIdx;
                        break;
                    }
                }
                $isDoubleLeg = false;
                $jLower = strtolower($p->jornada);
                $numTeams = 2;
                if (str_contains($jLower, 'octavos')) $numTeams = 16;
                elseif (str_contains($jLower, 'cuartos')) $numTeams = 8;
                elseif (str_contains($jLower, 'semi')) $numTeams = 4;
                if (count($roundMatches) > ($numTeams / 2)) {
                    $isDoubleLeg = true;
                }
                
                $fallbackLegs[$p->id] = $isDoubleLeg ? (($idxInRound % 2 === 0) ? 'Ida' : 'Vuelta') : 'Ida';
                $fallbackMatchupIndices[$p->id] = $isDoubleLeg ? (int)floor($idxInRound / 2) : $idxInRound;
            } else {
                $fallbackLegs[$p->id] = $pStats['leg'] ?? 'Ida';
                $fallbackMatchupIndices[$p->id] = $pStats['matchupIndex'];
            }
        }

        $changed = true;
        while ($changed) {
            $changed = false;
            foreach ($matches as $p) {
                $pStats = $p->stats;
                if (is_string($pStats)) {
                    $pStats = json_decode($pStats, true) ?? [];
                }

                $lid = $p->$localIdCol;
                $vid = $p->$visitanteIdCol;

                // Check if this match is already resolved by BYE
                $hasBye = false;
                $winnerId = null;

                if ($lid !== null && $vid === null && $p->goles_local === 3) {
                    $hasBye = true;
                    $winnerId = $lid;
                } elseif ($lid === null && $vid !== null && $p->goles_visitante === 3) {
                    $hasBye = true;
                    $winnerId = $vid;
                }

                $nextJ = null;
                $nextMIdx = null;
                $slot = null;

                if (isset($pStats['siguienteMatchup'])) {
                    $nextJ = $pStats['siguienteMatchup']['jornada'];
                    $nextMIdx = $pStats['siguienteMatchup']['matchupIndex'];
                    $slot = $pStats['siguienteMatchup']['slot'];
                } else {
                    $jornadaLower = strtolower($p->jornada);
                    $mIdx = $pStats['matchupIndex'] ?? 0;
                    if (str_contains($jornadaLower, 'octavos')) {
                        $nextJ = str_contains($jornadaLower, 'playoff') ? 'Cuartos Playoff' : 'Cuartos';
                    } elseif (str_contains($jornadaLower, 'cuartos')) {
                        $nextJ = str_contains($jornadaLower, 'playoff') ? 'Semis Playoff' : 'Semis';
                    } elseif (str_contains($jornadaLower, 'semi')) {
                        $nextJ = str_contains($jornadaLower, 'playoff') ? 'Gran Final Playoff' : 'Final';
                    }

                    if ($nextJ !== null) {
                        $nextMIdx = (int)floor($mIdx / 2);
                        $slot = ($mIdx % 2 === 0) ? 'local' : 'visitante';
                    }
                }

                if ($hasBye && $winnerId && $nextJ !== null) {

                    foreach ($matches as $np) {
                         $npLeg = $fallbackLegs[$np->id] ?? ($np->stats['leg'] ?? 'Ida');
                         $npMIdx = $fallbackMatchupIndices[$np->id] ?? ($np->stats['matchupIndex'] ?? null);
 
                         if (strcasecmp($np->jornada, $nextJ) === 0 && $npMIdx === $nextMIdx) {
                            if ($npLeg === 'Ida') {
                                $col = ($slot === 'local') ? $localIdCol : $visitanteIdCol;
                                if ($np->$col !== $winnerId) {
                                    $np->update([$col => $winnerId]);
                                    $changed = true;
                                }
                            } else if ($npLeg === 'Vuelta') {
                                // Reverse local/visitor in Vuelta leg
                                $col = ($slot === 'local') ? $visitanteIdCol : $localIdCol;
                                if ($np->$col !== $winnerId) {
                                    $np->update([$col => $winnerId]);
                                    $changed = true;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Advance winners in existing playoff matches.
     */
    private function avanzarPlayoffsExistentes($comp, $partidos, $isUt)
    {
        $localIdCol = $isUt ? 'equipo_ut_local_id' : 'equipo_local_id';
        $visitanteIdCol = $isUt ? 'equipo_ut_visitante_id' : 'equipo_visitante_id';

        // Filter out group matches
        $playoffs = $partidos->filter(fn($p) => empty($p->grupo));

        // Precompute fallback leg and matchupIndex values if missing from stats JSON
        $playoffsByRound = [];
        foreach ($playoffs as $p) {
            $playoffsByRound[$p->jornada][] = $p;
        }

        $fallbackLegs = [];
        $fallbackMatchupIndices = [];

        // Group playoff matches by round (jornada) and matchupIndex
        $matchups = [];
        foreach ($playoffs as $p) {
            $pStats = $p->stats;
            if (is_string($pStats)) {
                $pStats = json_decode($pStats, true) ?? [];
            }
            
            $mIdx = null;
            $leg = null;

            if (isset($pStats['matchupIndex'])) {
                $mIdx = $pStats['matchupIndex'];
                $leg = $pStats['leg'] ?? 'Ida';
            } else {
                $roundMatches = $playoffsByRound[$p->jornada] ?? [];
                usort($roundMatches, fn($a, $b) => $a->id - $b->id);
                $idxInRound = 0;
                foreach ($roundMatches as $rmIdx => $rm) {
                    if ($rm->id === $p->id) {
                        $idxInRound = $rmIdx;
                        break;
                    }
                }
                $isDoubleLeg = false;
                $jLower = strtolower($p->jornada);
                $numTeams = 2;
                if (str_contains($jLower, 'octavos')) $numTeams = 16;
                elseif (str_contains($jLower, 'cuartos')) $numTeams = 8;
                elseif (str_contains($jLower, 'semi')) $numTeams = 4;
                if (count($roundMatches) > ($numTeams / 2)) {
                    $isDoubleLeg = true;
                }
                
                $mIdx = $isDoubleLeg ? (int)floor($idxInRound / 2) : $idxInRound;
                $leg = $isDoubleLeg ? (($idxInRound % 2 === 0) ? 'Ida' : 'Vuelta') : 'Ida';
            }

            $fallbackLegs[$p->id] = $leg;
            $fallbackMatchupIndices[$p->id] = $mIdx;

            $matchups[$p->jornada][$mIdx][] = $p;
        }

        foreach ($matchups as $jornada => $groups) {
            foreach ($groups as $mIdx => $matches) {
                // Determine if this matchup has finished
                $allFinished = true;
                foreach ($matches as $p) {
                    if ($p->goles_local === null || $p->goles_visitante === null) {
                        $allFinished = false;
                        break;
                    }
                }

                if (!$allFinished) continue;

                // Determine winner
                $winnerId = null;
                if (count($matches) === 1) {
                    // Solo Ida
                    $p = $matches[0];
                    if ($p->goles_local > $p->goles_visitante) {
                        $winnerId = $p->$localIdCol;
                    } elseif ($p->goles_local < $p->goles_visitante) {
                        $winnerId = $p->$visitanteIdCol;
                    }
                } else {
                    // Ida y Vuelta
                    $p1 = collect($matches)->first(fn($m) => ($fallbackLegs[$m->id] ?? $m->stats['leg'] ?? 'Ida') === 'Ida');
                    $p2 = collect($matches)->first(fn($m) => ($fallbackLegs[$m->id] ?? $m->stats['leg'] ?? 'Ida') === 'Vuelta');
                    if ($p1 && $p2) {
                        $scoreA = $p1->goles_local + $p2->goles_visitante;
                        $scoreB = $p1->goles_visitante + $p2->goles_local;
                        if ($scoreA > $scoreB) {
                            $winnerId = $p1->$localIdCol;
                        } elseif ($scoreA < $scoreB) {
                            $winnerId = $p1->$visitanteIdCol;
                        }
                    }
                }

                if ($winnerId) {
                    // Auto-advance this winner to the next round TBD match!
                    $leadMatch = $matches[0];
                    $leadStats = $leadMatch->stats;
                    if (is_string($leadStats)) {
                        $leadStats = json_decode($leadStats, true) ?? [];
                    }

                    $nextJ = null;
                    $nextMIdx = null;
                    $slot = null;

                    if (isset($leadStats['siguienteMatchup'])) {
                        $nextJ = $leadStats['siguienteMatchup']['jornada'];
                        $nextMIdx = $leadStats['siguienteMatchup']['matchupIndex'];
                        $slot = $leadStats['siguienteMatchup']['slot'];
                    } else {
                        $jornadaLower = strtolower($jornada);
                        if (str_contains($jornadaLower, 'octavos')) {
                            $nextJ = str_contains($jornadaLower, 'playoff') ? 'Cuartos Playoff' : 'Cuartos';
                        } elseif (str_contains($jornadaLower, 'cuartos')) {
                            $nextJ = str_contains($jornadaLower, 'playoff') ? 'Semis Playoff' : 'Semis';
                        } elseif (str_contains($jornadaLower, 'semi')) {
                            $nextJ = str_contains($jornadaLower, 'playoff') ? 'Gran Final Playoff' : 'Final';
                        }

                        if ($nextJ !== null) {
                            $nextMIdx = (int)floor($mIdx / 2);
                            $slot = ($mIdx % 2 === 0) ? 'local' : 'visitante';
                        }
                    }

                    if ($nextJ !== null) {

                        foreach ($playoffs as $np) {
                            $npStats = $np->stats;
                            if (is_string($npStats)) {
                                $npStats = json_decode($npStats, true) ?? [];
                            }
                            if (!is_array($npStats)) {
                                $npStats = [];
                            }
                            $npLeg = $fallbackLegs[$np->id] ?? ($npStats['leg'] ?? 'Ida');
                            $npMIdx = $fallbackMatchupIndices[$np->id] ?? ($npStats['matchupIndex'] ?? null);

                            if (strcasecmp($np->jornada, $nextJ) === 0 && $npMIdx === $nextMIdx) {
                                if ($npLeg === 'Ida') {
                                    $col = ($slot === 'local') ? $localIdCol : $visitanteIdCol;
                                    if ($np->$col !== $winnerId) {
                                        $np->update([$col => $winnerId]);
                                    }
                                } else if ($npLeg === 'Vuelta') {
                                    $col = ($slot === 'local') ? $visitanteIdCol : $localIdCol;
                                    if ($np->$col !== $winnerId) {
                                        $np->update([$col => $winnerId]);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Internal standings compute helper.
     */
    private function computeStandings($equipos, $partidos)
    {
        $standings = [];
        foreach ($equipos as $eq) {
            $standings[$eq->id] = [
                'id' => $eq->id,
                'nombre' => $eq->nombre,
                'model' => $eq,
                'pj' => 0, 'pg' => 0, 'pe' => 0, 'pp' => 0,
                'gf' => 0, 'gc' => 0, 'pts' => 0
            ];
        }

        foreach ($partidos as $p) {
            if ($p->goles_local === null || $p->goles_visitante === null) continue;
            
            $lid = $p->equipo_local_id ?? $p->equipo_ut_local_id;
            $vid = $p->equipo_visitante_id ?? $p->equipo_ut_visitante_id;
            
            if (!isset($standings[$lid]) || !isset($standings[$vid])) continue;
            
            $gl = $p->goles_local;
            $gv = $p->goles_visitante;
            
            $standings[$lid]['pj']++;
            $standings[$vid]['pj']++;
            $standings[$lid]['gf'] += $gl;
            $standings[$lid]['gc'] += $gv;
            $standings[$vid]['gf'] += $gv;
            $standings[$vid]['gc'] += $gl;
            
            if ($gl > $gv) {
                $standings[$lid]['pg']++;
                $standings[$lid]['pts'] += 3;
                $standings[$vid]['pp']++;
            } elseif ($gl < $gv) {
                $standings[$vid]['pg']++;
                $standings[$vid]['pts'] += 3;
                $standings[$lid]['pp']++;
            } else {
                $standings[$lid]['pe']++;
                $standings[$lid]['pts'] += 1;
                $standings[$vid]['pe']++;
                $standings[$vid]['pts'] += 1;
            }
        }

        usort($standings, function($a, $b) {
            if ($b['pts'] !== $a['pts']) return $b['pts'] - $a['pts'];
            $dgA = $a['gf'] - $a['gc'];
            $dgB = $b['gf'] - $b['gc'];
            if ($dgB !== $dgA) return $dgB - $dgA;
            return $b['gf'] - $a['gf'];
        });

        return $standings;
    }
}
