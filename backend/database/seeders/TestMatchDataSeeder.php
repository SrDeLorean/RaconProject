<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Equipo;
use App\Models\Competencia;
use App\Models\Partido;
use App\Models\EstadisticaEquipo;
use App\Models\EstadisticaJugador;
use App\Models\EstadisticaJugadorLog;
use App\Models\OrganizacionEquipoUsuario;
use App\Models\Temporada;
use App\Models\CompetenciaUt;
use App\Models\EquipoUt;
use App\Models\PartidoUt;
use App\Models\EstadisticaEquipoUt;
use App\Models\EstadisticaJugadorUt;
use App\Models\EstadisticaJugadorUtLog;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TestMatchDataSeeder extends Seeder
{
    /**
     * Posiciones disponibles para jugadores de campo (11v11)
     */
    private array $posicionesCampo = ['DFC', 'DFI', 'DFD', 'MC', 'MCO', 'MD', 'MI', 'DEL', 'EI', 'ED'];

    /**
     * Arquetipos de jugador para ClubPro
     */
    private array $arquetipos = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('========================================');
        $this->command->info('  GENERANDO DATOS DE PRUEBA COMPLETOS  ');
        $this->command->info('========================================');

        $this->seedClubPro11v11();
        $this->seedUltimateTeam();

        $this->command->info('');
        $this->command->info('✅ Todos los datos de prueba han sido generados exitosamente.');
    }

    // =========================================================================
    // CLUBPRO 11v11 — PARTIDOS Y ESTADÍSTICAS
    // =========================================================================

    private function seedClubPro11v11(): void
    {
        $this->command->info('');
        $this->command->info('⚽ [CLUBPRO 11v11] Generando partidos y estadísticas...');

        // Obtener competencias que tengan equipos inscritos
        $competencias = Competencia::whereHas('equipos', function ($q) {
            $q->where('estado_inscripcion', 'aprobado');
        })->get();

        if ($competencias->isEmpty()) {
            $this->command->warn('  ⚠️ No se encontraron competencias con equipos inscritos. Saltando ClubPro 11v11.');
            return;
        }

        $totalPartidos = 0;

        foreach ($competencias as $competencia) {
            // Obtener equipos inscritos y aprobados
            $equipos = $competencia->equipos()
                ->wherePivot('estado_inscripcion', 'aprobado')
                ->get();

            if ($equipos->count() < 2) {
                continue;
            }

            // Poner competencia en_curso
            $competencia->update(['estado' => 'en_curso']);

            $partidosComp = $this->generateClubProFixture($competencia, $equipos);
            $totalPartidos += $partidosComp;

            $this->command->info("  📋 {$competencia->nombre}: {$partidosComp} partidos generados ({$equipos->count()} equipos)");
        }

        $this->command->info("  ✅ Total ClubPro 11v11: {$totalPartidos} partidos con estadísticas completas.");
    }

    /**
     * Genera el fixture round-robin para una competencia ClubPro 11v11.
     */
    private function generateClubProFixture(Competencia $competencia, $equipos): int
    {
        $equipoIds = $equipos->pluck('id')->toArray();
        $n = count($equipoIds);
        $partidosCreados = 0;

        // Round Robin: Si n es impar, agregar un "bye"
        $ids = $equipoIds;
        if ($n % 2 !== 0) {
            $ids[] = null; // bye
        }
        $numTeams = count($ids);
        $totalRounds = $numTeams - 1;
        $matchesPerRound = $numTeams / 2;

        // Generar jornadas
        $baseDate = now()->subDays($totalRounds + 2); // Empezar en el pasado

        for ($round = 0; $round < $totalRounds; $round++) {
            $jornada = 'Jornada ' . ($round + 1);
            $fechaJornada = $baseDate->copy()->addDays($round);
            $hora = '22:00';

            // Determinar si esta jornada ya fue "jugada"
            $isPlayed = $fechaJornada->lt(now()->subDay());
            $isToday = $fechaJornada->isToday();

            for ($match = 0; $match < $matchesPerRound; $match++) {
                // Circle method para round robin
                $home = ($match === 0) ? 0 : (($round + $match) % ($numTeams - 1) + 1);
                $away = ($numTeams - 1 - $match === 0) ? 0 : (($round + $numTeams - 1 - $match) % ($numTeams - 1) + 1);

                // Swap para variar
                if ($round % 2 === 0) {
                    [$home, $away] = [$away, $home];
                }

                $localId = $ids[$home] ?? null;
                $visitanteId = $ids[$away] ?? null;

                // Saltar si alguno es bye
                if ($localId === null || $visitanteId === null) {
                    continue;
                }

                $golesLocal = null;
                $golesVisitante = null;
                $stats = null;

                if ($isPlayed || ($isToday && $match === 0)) {
                    // Partido jugado → generar resultado
                    $golesLocal = $this->weightedGoals();
                    $golesVisitante = $this->weightedGoals();
                    $stats = $this->generateMatchStatsJson();
                }

                $horaPartido = date('H:i', strtotime($hora) + ($match * 1800)); // Cada 30 min

                $partido = Partido::create([
                    'competencia_id' => $competencia->id,
                    'equipo_local_id' => $localId,
                    'equipo_visitante_id' => $visitanteId,
                    'jornada' => $jornada,
                    'grupo' => null,
                    'fecha' => $fechaJornada->format('Y-m-d'),
                    'hora' => $horaPartido,
                    'goles_local' => $golesLocal,
                    'goles_visitante' => $golesVisitante,
                    'stats' => $stats,
                ]);

                // Generar estadísticas si el partido fue jugado
                if ($golesLocal !== null) {
                    $this->generateClubProMatchStats($partido, $competencia, $localId, $visitanteId, $golesLocal, $golesVisitante);
                }

                $partidosCreados++;
            }
        }

        return $partidosCreados;
    }

    /**
     * Genera estadísticas de equipo y jugador para un partido ClubPro 11v11.
     */
    private function generateClubProMatchStats(Partido $partido, Competencia $competencia, int $localId, int $visitanteId, int $gl, int $gv): void
    {
        // === ESTADÍSTICAS DE EQUIPO ===
        foreach ([[$localId, $gl, $gv], [$visitanteId, $gv, $gl]] as [$equipoId, $golesFavor, $golesContra]) {
            $shotsTeam = rand(8, 18);
            $passesTeam = rand(180, 350);
            $passesCompTeam = intval($passesTeam * rand(72, 92) / 100);
            $tacklesTeam = rand(15, 30);
            $tacklesSuccTeam = intval($tacklesTeam * rand(55, 80) / 100);
            $atajadas = $golesContra === 0 ? rand(3, 8) : rand(1, 6);
            $isWin = $golesFavor > $golesContra;

            EstadisticaEquipo::create([
                'equipo_id' => $equipoId,
                'partido_id' => $partido->id,
                'competencia_id' => $competencia->id,
                'goles_favor' => $golesFavor,
                'goles_en_contra' => $golesContra,
                'asistencias' => max(0, $golesFavor - rand(0, 1)),
                'tiros' => $shotsTeam,
                'pases_intentados' => $passesTeam,
                'pases_completados' => $passesCompTeam,
                'precision_pases' => round(($passesCompTeam / max(1, $passesTeam)) * 100, 2),
                'entradas_intentadas' => $tacklesTeam,
                'entradas_exitosas' => $tacklesSuccTeam,
                'tasa_exito_entradas' => round(($tacklesSuccTeam / max(1, $tacklesTeam)) * 100, 2),
                'tarjetas_rojas' => rand(0, 10) > 8 ? 1 : 0,
                'goles_contra_agregado' => $golesContra,
                'atajadas' => $atajadas,
                'atajadas_buena_colocacion' => intval($atajadas * 0.4),
                'atajadas_volada' => intval($atajadas * 0.3),
                'atajadas_reflejos' => intval($atajadas * 0.3),
                'centros_cortados' => rand(2, 8),
                'despejes_punos' => rand(0, 4),
                'desvios' => rand(0, 3),
                'valla_invicta_global' => $golesContra === 0,
                'valla_invicta_defensa' => $golesContra === 0,
                'valla_invicta_portero' => $golesContra === 0,
                'valoracion_agregada' => $isWin ? round(rand(700, 800) / 100, 2) : round(rand(580, 700) / 100, 2),
                'jugador_partido' => $isWin,
                'segundos_jugados_agregado' => 720,
                'tiempo_juego_motor' => 720,
                'tiempo_inactivo_agregado' => rand(10, 60),
                'tiempo_real_lag' => rand(0, 5),
                'procesado' => true,
            ]);
        }

        // === ESTADÍSTICAS DE JUGADORES ===
        foreach ([[$localId, $gl, $gv], [$visitanteId, $gv, $gl]] as [$equipoId, $golesFavor, $golesContra]) {
            $orgId = $competencia->temporada->organizacion_id;

            // Obtener jugadores del roster de este equipo en esta organización
            $rosterJugadores = OrganizacionEquipoUsuario::where('equipo_id', $equipoId)
                ->where('organizacion_id', $orgId)
                ->where('estado_fichaje', 'activo')
                ->with('jugador')
                ->take(11) // 11 jugadores por partido
                ->get();

            if ($rosterJugadores->isEmpty()) {
                continue;
            }

            // Distribuir goles entre jugadores de campo
            $golesRestantes = $golesFavor;
            $asistenciasRestantes = max(0, $golesFavor - rand(0, 1));
            $isWin = $golesFavor > $golesContra;

            foreach ($rosterJugadores as $idx => $rosterEntry) {
                $jugadorId = $rosterEntry->user_id;
                $posicion = $rosterEntry->posicion_bloque ?: $this->posicionesCampo[array_rand($this->posicionesCampo)];
                $esPrimero = $idx === 0;

                // El portero
                $esPortero = $posicion === 'POR' || $idx === 0;
                if ($esPortero) {
                    $posicion = 'POR';
                }

                // Repartir goles
                $golesJugador = 0;
                $asistJugador = 0;
                if (!$esPortero && $golesRestantes > 0 && rand(0, 3) > 0) {
                    $golesJugador = min($golesRestantes, rand(1, 2));
                    $golesRestantes -= $golesJugador;
                }
                if (!$esPortero && $asistenciasRestantes > 0 && rand(0, 3) > 0) {
                    $asistJugador = min($asistenciasRestantes, rand(1, 2));
                    $asistenciasRestantes -= $asistJugador;
                }

                $pasesJug = rand(15, 45);
                $pasesCompJug = intval($pasesJug * rand(70, 95) / 100);
                $tacklesJug = rand(2, 10);
                $tacklesSuccJug = intval($tacklesJug * rand(50, 85) / 100);
                $tirosJug = $esPortero ? 0 : rand(0, 5);

                // Valoración basada en rendimiento
                $baseVal = $isWin ? 7.0 : 6.2;
                $valoracion = round($baseVal + ($golesJugador * 0.5) + ($asistJugador * 0.3) + (rand(-10, 10) / 10), 2);
                $valoracion = min(10, max(4, $valoracion));

                // Atajadas del portero
                $atajadas = $esPortero ? rand(2, 8) : 0;

                $esJDP = $golesJugador >= 2 || ($golesJugador >= 1 && $asistJugador >= 1 && $valoracion >= 8);

                EstadisticaJugador::create([
                    'jugador_id' => $jugadorId,
                    'equipo_id' => $equipoId,
                    'partido_id' => $partido->id,
                    'competencia_id' => $competencia->id,
                    'posicion' => $posicion,
                    'id_arquetipo' => $this->arquetipos[array_rand($this->arquetipos)],
                    'valoracion' => $valoracion,
                    'goles' => $golesJugador,
                    'asistencias' => $asistJugador,
                    'tiros' => $tirosJug,
                    'tarjetas_rojas' => rand(0, 30) === 0 ? 1 : 0,
                    'jugador_partido' => $esJDP,
                    'resultado_usuario' => $isWin ? '3' : ($golesFavor === $golesContra ? '1' : '0'),
                    'precision_tiro' => $tirosJug > 0 ? round(rand(20, 80), 2) : 0,
                    'pases_intentados' => $pasesJug,
                    'pases_completados' => $pasesCompJug,
                    'precision_pases' => round(($pasesCompJug / max(1, $pasesJug)) * 100, 2),
                    'entradas_intentadas' => $tacklesJug,
                    'entradas_exitosas' => $tacklesSuccJug,
                    'tasa_exito_entradas' => round(($tacklesSuccJug / max(1, $tacklesJug)) * 100, 2),
                    'goles_recibidos' => $esPortero ? $golesContra : 0,
                    'atajadas' => $atajadas,
                    'atajadas_buena_colocacion' => intval($atajadas * 0.4),
                    'atajadas_volada' => intval($atajadas * 0.3),
                    'atajadas_reflejos' => intval($atajadas * 0.3),
                    'centros_cortados' => $esPortero ? rand(1, 5) : 0,
                    'despejes_punos' => $esPortero ? rand(0, 3) : 0,
                    'desvios' => $esPortero ? rand(0, 2) : 0,
                    'segundos_jugados' => 720,
                    'tiempo_juego_motor' => 720,
                    'tiempo_inactivo' => rand(5, 30),
                    'tiempo_real_lag' => rand(0, 3),
                ]);

                // Log del jugador
                EstadisticaJugadorLog::create([
                    'playername' => $rosterEntry->jugador->gamertag ?? $rosterEntry->jugador->name,
                    'partido_id' => $partido->id,
                    'jugador_id' => $jugadorId,
                    'equipo_id' => $equipoId,
                    'competencia_id' => $competencia->id,
                    'jugo' => true,
                    'procesado' => true,
                    'estado' => 'vinculado',
                ]);
            }
        }
    }

    // =========================================================================
    // ULTIMATE TEAM — PARTIDOS Y ESTADÍSTICAS (1vs1 y 2vs2)
    // =========================================================================

    private function seedUltimateTeam(): void
    {
        $this->command->info('');
        $this->command->info('🎮 [ULTIMATE TEAM] Generando competencias, equipos, partidos y estadísticas...');

        $temporadas = Temporada::with('organizacion')->get();
        $players = User::where('role', 'jugador')->get();

        if ($temporadas->isEmpty() || $players->count() < 20) {
            $this->command->warn('  ⚠️ No hay suficientes temporadas o jugadores. Saltando UT.');
            return;
        }

        // Limpiar datos UT previos para evitar duplicados
        $this->command->info('  🗑️  Limpiando datos UT anteriores...');
        DB::table('estadisticas_jugadores_ut_logs')->delete();
        DB::table('estadisticas_jugadores_ut')->delete();
        DB::table('estadisticas_equipos_ut')->delete();
        DB::table('partidos_ut')->delete();
        DB::table('competencia_equipo_ut')->delete();
        DB::table('equipos_ut')->delete();
        DB::table('competencias_ut')->delete();

        $total1v1 = 0;
        $total2v2 = 0;

        // Tomar solo las primeras 2 temporadas para no generar datos excesivos
        $temporadasSlice = $temporadas->take(2);

        foreach ($temporadasSlice as $temporada) {
            $orgName = $temporada->organizacion->nombre ?? 'Organización';

            // Separar jugadores para 1v1 y 2v2 (sin solapamiento)
            $shuffled = $players->shuffle();
            $players1v1 = $shuffled->slice(0, 8)->values();
            $players2v2 = $shuffled->slice(8, 16)->values();

            // ==========================================
            // COMPETENCIA 1vs1 UT — EN CURSO (con partidos)
            // ==========================================
            $comp1v1 = CompetenciaUt::create([
                'temporada_id' => $temporada->id,
                'nombre' => "Liga 1vs1 UT - " . $orgName,
                'slug' => \Illuminate\Support\Str::slug("Liga 1vs1 UT " . $orgName . "-" . uniqid()),
                'descripcion' => "Torneo individual 1vs1 de Ultimate Team organizado por " . $orgName . ". ¡Demuestra tu habilidad en el mano a mano!",
                'reglas' => "1. Duración: 12 min (6 min por lado)\n2. Plantillas UT sin restricciones de valoración.\n3. Prohibido el uso de tácticas AFK o de explotación.\n4. En caso de desconexión antes del minuto 30 in-game, replay.\n5. Captura de pantalla obligatoria del resultado final.",
                'logo' => 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&h=200&fit=crop',
                'banner' => 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=400&fit=crop',
                'color_tema' => '#ef4444',
                'tipo' => '1vs1',
                'formato' => 'liga',
                'plataforma' => 'crossplay',
                'prize_pool' => 500.00,
                'entry_fee' => 0.00,
                'max_participantes' => 8,
                'es_publico' => true,
                'estado' => 'en_curso',
                'fecha_inicio_inscripciones' => now()->subDays(14),
                'fecha_fin_inscripciones' => now()->subDays(5),
                'fecha_inicio_competencia' => now()->subDays(4),
            ]);

            // Crear equipos 1vs1
            $equipos1v1 = [];
            foreach ($players1v1 as $player) {
                $equipo = EquipoUt::create([
                    'nombre' => $player->gamertag ?: "Player " . $player->id,
                    'logo' => 'default.png',
                    'club_id_ea' => (string)(60000 + $player->id),
                    'plataforma' => 'crossplay',
                    'id_capitan' => $player->id,
                    'id_companero' => null,
                    'estado' => true,
                ]);
                $equipos1v1[] = $equipo;
                $comp1v1->equipos()->attach($equipo->id, ['estado_inscripcion' => 'aprobado']);
            }

            $partidos1v1 = $this->generateUtFixture($comp1v1, $equipos1v1, '1vs1');
            $total1v1 += $partidos1v1;
            $this->command->info("  📋 Liga 1vs1 UT ({$orgName}): {$partidos1v1} partidos | {$players1v1->count()} jugadores");

            // ==========================================
            // COMPETENCIA 2vs2 UT — EN CURSO (con partidos)
            // ==========================================
            $comp2v2 = CompetenciaUt::create([
                'temporada_id' => $temporada->id,
                'nombre' => "Copa Duos 2vs2 UT - " . $orgName,
                'slug' => \Illuminate\Support\Str::slug("Copa Duos 2vs2 UT " . $orgName . "-" . uniqid()),
                'descripcion' => "Torneo cooperativo 2vs2 de Ultimate Team en " . $orgName . ". ¡La química de tu dupla lo es todo!",
                'reglas' => "1. Ambos jugadores deben estar registrados en la plataforma.\n2. Se juega en modo cooperativo de Ultimate Team.\n3. Conexión de voz recomendada.\n4. Prohibida la sustitución de compañero durante el torneo.",
                'logo' => 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&h=200&fit=crop',
                'banner' => 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&h=400&fit=crop',
                'color_tema' => '#3b82f6',
                'tipo' => '2vs2',
                'formato' => 'liga',
                'plataforma' => 'crossplay',
                'prize_pool' => 1000.00,
                'entry_fee' => 15.00,
                'max_participantes' => 8,
                'es_publico' => true,
                'estado' => 'en_curso',
                'fecha_inicio_inscripciones' => now()->subDays(12),
                'fecha_fin_inscripciones' => now()->subDays(4),
                'fecha_inicio_competencia' => now()->subDays(3),
            ]);

            // Crear equipos 2vs2 (parejas)
            $equipos2v2 = [];
            $paresDisponibles = $players2v2->count();
            $numParejas = min(8, intval($paresDisponibles / 2));

            for ($k = 0; $k < $numParejas; $k++) {
                $capitan = $players2v2[$k * 2];
                $companero = $players2v2[$k * 2 + 1];

                $equipo2v2 = EquipoUt::create([
                    'nombre' => ($capitan->gamertag ?: "P" . $capitan->id) . " & " . ($companero->gamertag ?: "P" . $companero->id),
                    'logo' => 'default.png',
                    'club_id_ea' => (string)(70000 + $capitan->id),
                    'plataforma' => 'crossplay',
                    'id_capitan' => $capitan->id,
                    'id_companero' => $companero->id,
                    'estado' => true,
                ]);
                $equipos2v2[] = $equipo2v2;
                $comp2v2->equipos()->attach($equipo2v2->id, ['estado_inscripcion' => 'aprobado']);
            }

            $partidos2v2 = $this->generateUtFixture($comp2v2, $equipos2v2, '2vs2');
            $total2v2 += $partidos2v2;
            $this->command->info("  📋 Copa 2vs2 UT ({$orgName}): {$partidos2v2} partidos | {$numParejas} duplas");

            // ==========================================
            // COMPETENCIA EXTRA 1vs1 UT — INSCRIPCIONES (sin partidos, para probar la vista)
            // ==========================================
            $comp1v1Extra = CompetenciaUt::create([
                'temporada_id' => $temporada->id,
                'nombre' => "Copa Élite 1vs1 UT - " . $orgName,
                'slug' => \Illuminate\Support\Str::slug("Copa Elite 1vs1 UT " . $orgName . "-" . uniqid()),
                'descripcion' => "Torneo eliminatorio 1vs1 próximamente en " . $orgName . ". ¡Inscripciones abiertas!",
                'reglas' => "Formato eliminatoria directa. Más detalles próximamente.",
                'logo' => 'https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=200&h=200&fit=crop',
                'banner' => 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&h=400&fit=crop',
                'color_tema' => '#10b981',
                'tipo' => '1vs1',
                'formato' => 'eliminatoria',
                'plataforma' => 'crossplay',
                'prize_pool' => 300.00,
                'entry_fee' => 5.00,
                'max_participantes' => 16,
                'es_publico' => true,
                'estado' => 'inscripciones',
                'fecha_inicio_inscripciones' => now()->subDays(1),
                'fecha_fin_inscripciones' => now()->addDays(5),
                'fecha_inicio_competencia' => now()->addDays(7),
            ]);

            // Inscribir algunos jugadores (mezcla de aprobados y pendientes)
            $extraPlayers = $shuffled->slice(24, 6)->values();
            foreach ($extraPlayers as $pi => $ep) {
                $extraEq = EquipoUt::create([
                    'nombre' => $ep->gamertag ?: "Player " . $ep->id,
                    'logo' => 'default.png',
                    'club_id_ea' => (string)(80000 + $ep->id),
                    'plataforma' => 'crossplay',
                    'id_capitan' => $ep->id,
                    'id_companero' => null,
                    'estado' => true,
                ]);
                $comp1v1Extra->equipos()->attach($extraEq->id, [
                    'estado_inscripcion' => $pi < 3 ? 'aprobado' : 'pendiente'
                ]);
            }
            $this->command->info("  📋 Copa Élite 1vs1 UT ({$orgName}): En inscripciones ({$extraPlayers->count()} registrados)");
        }

        $this->command->info("  ✅ Total UT 1vs1: {$total1v1} partidos con estadísticas.");
        $this->command->info("  ✅ Total UT 2vs2: {$total2v2} partidos con estadísticas.");
    }

    /**
     * Genera fixture round-robin para competencia UT.
     */
    private function generateUtFixture(CompetenciaUt $competencia, array $equipos, string $tipo): int
    {
        $n = count($equipos);
        if ($n < 2) return 0;

        $ids = range(0, $n - 1);
        if ($n % 2 !== 0) {
            $ids[] = -1; // bye
        }
        $numTeams = count($ids);
        $totalRounds = $numTeams - 1;
        $matchesPerRound = $numTeams / 2;
        $partidosCreados = 0;

        $baseDate = now()->subDays($totalRounds + 1);

        for ($round = 0; $round < $totalRounds; $round++) {
            $jornada = 'Jornada ' . ($round + 1);
            $fechaJornada = $baseDate->copy()->addDays($round);

            // Jornadas pasadas están jugadas, jornadas futuras no
            $isPlayed = $fechaJornada->lt(now()->subDay());
            $isToday = $fechaJornada->isToday();

            for ($match = 0; $match < $matchesPerRound; $match++) {
                $home = ($match === 0) ? 0 : (($round + $match) % ($numTeams - 1) + 1);
                $away = ($numTeams - 1 - $match === 0) ? 0 : (($round + $numTeams - 1 - $match) % ($numTeams - 1) + 1);

                if ($round % 2 === 0) {
                    [$home, $away] = [$away, $home];
                }

                $localIdx = $ids[$home];
                $visitanteIdx = $ids[$away];

                if ($localIdx === -1 || $visitanteIdx === -1) continue;

                $equipoLocal = $equipos[$localIdx];
                $equipoVisitante = $equipos[$visitanteIdx];

                $golesLocal = null;
                $golesVisitante = null;
                $stats = null;

                if ($isPlayed || ($isToday && $match === 0)) {
                    $golesLocal = $this->weightedGoals();
                    $golesVisitante = $this->weightedGoals();
                    $stats = json_encode([
                        'possession' => [rand(40, 60), rand(40, 60)],
                        'shots' => [rand(6, 16), rand(6, 16)],
                        'passes' => [rand(100, 200), rand(100, 200)],
                        'tackles' => [rand(8, 20), rand(8, 20)],
                    ]);
                }

                $horaPartido = date('H:i', strtotime('22:00') + ($match * 1800));

                $partido = PartidoUt::create([
                    'competencia_ut_id' => $competencia->id,
                    'equipo_ut_local_id' => $equipoLocal->id,
                    'equipo_ut_visitante_id' => $equipoVisitante->id,
                    'jornada' => $jornada,
                    'grupo' => null,
                    'fecha' => $fechaJornada->format('Y-m-d'),
                    'hora' => $horaPartido,
                    'goles_local' => $golesLocal,
                    'goles_visitante' => $golesVisitante,
                    'stats' => $stats,
                ]);

                if ($golesLocal !== null) {
                    $this->generateUtMatchStats($partido, $equipoLocal, $equipoVisitante, $golesLocal, $golesVisitante, $tipo);
                }

                $partidosCreados++;
            }
        }

        return $partidosCreados;
    }

    /**
     * Genera estadísticas UT (equipo + jugadores) para un partido.
     */
    private function generateUtMatchStats(PartidoUt $partido, EquipoUt $local, EquipoUt $visitante, int $gl, int $gv, string $tipo): void
    {
        $compId = $partido->competencia_ut_id;

        // === ESTADÍSTICAS DE EQUIPO ===
        foreach ([[$local, $gl, $gv], [$visitante, $gv, $gl]] as [$equipo, $golesFavor, $golesContra]) {
            $shots = rand(7, 16);
            $passes = rand(120, 200);
            $passesComp = intval($passes * rand(72, 90) / 100);
            $tackles = rand(10, 22);
            $tacklesSucc = intval($tackles * rand(55, 80) / 100);
            $isWin = $golesFavor > $golesContra;

            EstadisticaEquipoUt::create([
                'equipo_ut_id' => $equipo->id,
                'partido_ut_id' => $partido->id,
                'competencia_ut_id' => $compId,
                'goles_favor' => $golesFavor,
                'goles_en_contra' => $golesContra,
                'asistencias' => max(0, $golesFavor - rand(0, 1)),
                'tiros' => $shots,
                'pases_intentados' => $passes,
                'pases_completados' => $passesComp,
                'precision_pases' => round(($passesComp / max(1, $passes)) * 100, 2),
                'entradas_intentadas' => $tackles,
                'entradas_exitosas' => $tacklesSucc,
                'tasa_exito_entradas' => round(($tacklesSucc / max(1, $tackles)) * 100, 2),
                'tarjetas_rojas' => rand(0, 10) > 8 ? 1 : 0,
                'valla_invicta_global' => $golesContra === 0,
                'valoracion_agregada' => $isWin ? round(rand(720, 850) / 100, 2) : round(rand(590, 710) / 100, 2),
                'segundos_jugados_agregado' => 540,
                'tiempo_juego_motor' => 540,
                'procesado' => true,
            ]);
        }

        // === ESTADÍSTICAS DE JUGADORES ===
        foreach ([[$local, $gl, $gv], [$visitante, $gv, $gl]] as [$equipo, $golesFavor, $golesContra]) {
            $isWin = $golesFavor > $golesContra;

            // En 1vs1, solo hay capitán. En 2vs2, capitán + compañero
            $jugadores = [['id' => $equipo->id_capitan, 'pos' => 'MCO']];
            if ($tipo === '2vs2' && $equipo->id_companero) {
                $jugadores[] = ['id' => $equipo->id_companero, 'pos' => 'DEL'];
            }

            $golesRestantes = $golesFavor;
            $asistRestantes = max(0, $golesFavor - rand(0, 1));

            foreach ($jugadores as $jIdx => $jug) {
                // Distribuir goles
                $golesJug = 0;
                $asistJug = 0;
                if ($golesRestantes > 0) {
                    if (count($jugadores) === 1) {
                        $golesJug = $golesRestantes;
                        $asistJug = 0; // No hay a quién asistir en 1vs1
                    } else {
                        $golesJug = $jIdx === 0 ? intval(ceil($golesRestantes / 2)) : $golesRestantes - intval(ceil($golesRestantes / 2));
                        $golesRestantes -= $golesJug;
                    }
                }
                if ($asistRestantes > 0 && count($jugadores) > 1) {
                    $asistJug = $jIdx === 0 ? intval(floor($asistRestantes / 2)) : $asistRestantes - intval(floor($asistRestantes / 2));
                    $asistRestantes -= $asistJug;
                }

                $pases = rand(40, 70);
                $pasesComp = intval($pases * rand(75, 92) / 100);
                $tackles = rand(4, 12);
                $tacklesSucc = intval($tackles * rand(55, 80) / 100);
                $tiros = rand(2, 8);

                $baseVal = $isWin ? 7.2 : 6.0;
                $valoracion = round($baseVal + ($golesJug * 0.4) + ($asistJug * 0.25) + (rand(-8, 8) / 10), 2);
                $valoracion = min(10, max(4, $valoracion));

                $esJDP = ($golesJug >= 2) || ($valoracion >= 8.5);

                EstadisticaJugadorUt::create([
                    'jugador_id' => $jug['id'],
                    'equipo_ut_id' => $equipo->id,
                    'partido_ut_id' => $partido->id,
                    'competencia_ut_id' => $compId,
                    'posicion' => $jug['pos'],
                    'valoracion' => $valoracion,
                    'goles' => $golesJug,
                    'asistencias' => $asistJug,
                    'tiros' => $tiros,
                    'tarjetas_rojas' => rand(0, 20) === 0 ? 1 : 0,
                    'jugador_partido' => $esJDP,
                    'pases_intentados' => $pases,
                    'pases_completados' => $pasesComp,
                    'precision_pases' => round(($pasesComp / max(1, $pases)) * 100, 2),
                    'entradas_intentadas' => $tackles,
                    'entradas_exitosas' => $tacklesSucc,
                    'tasa_exito_entradas' => round(($tacklesSucc / max(1, $tackles)) * 100, 2),
                    'segundos_jugados' => 540,
                ]);

                // Log
                $user = User::find($jug['id']);
                EstadisticaJugadorUtLog::create([
                    'playername' => $user->gamertag ?? $user->name ?? "Player",
                    'partido_ut_id' => $partido->id,
                    'jugador_id' => $jug['id'],
                    'equipo_ut_id' => $equipo->id,
                    'competencia_ut_id' => $compId,
                    'jugo' => true,
                    'procesado' => true,
                    'estado' => 'vinculado',
                ]);
            }
        }
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    /**
     * Genera un número de goles con distribución realista (más probable 0-2).
     */
    private function weightedGoals(): int
    {
        $rand = rand(1, 100);
        if ($rand <= 15) return 0;       // 15% → 0 goles
        if ($rand <= 40) return 1;       // 25% → 1 gol
        if ($rand <= 65) return 2;       // 25% → 2 goles
        if ($rand <= 82) return 3;       // 17% → 3 goles
        if ($rand <= 92) return 4;       // 10% → 4 goles
        if ($rand <= 97) return 5;       //  5% → 5 goles
        return rand(6, 8);               //  3% → 6-8 goles (paliza)
    }

    /**
     * Genera JSON de stats generales del partido.
     */
    private function generateMatchStatsJson(): string
    {
        return json_encode([
            'possession' => [rand(38, 62), rand(38, 62)],
            'shots' => [rand(6, 18), rand(6, 18)],
            'shots_on_target' => [rand(3, 10), rand(3, 10)],
            'passes' => [rand(150, 380), rand(150, 380)],
            'pass_accuracy' => [rand(70, 92), rand(70, 92)],
            'tackles' => [rand(10, 25), rand(10, 25)],
            'fouls' => [rand(5, 18), rand(5, 18)],
            'corners' => [rand(1, 8), rand(1, 8)],
            'offsides' => [rand(0, 5), rand(0, 5)],
        ]);
    }
}
