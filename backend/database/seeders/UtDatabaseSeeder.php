<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Temporada;
use App\Models\CompetenciaUt;
use App\Models\EquipoUt;
use App\Models\PartidoUt;
use App\Models\EstadisticaEquipoUt;
use App\Models\EstadisticaJugadorUt;
use App\Models\EstadisticaJugadorUtLog;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class UtDatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Obtener todas las temporadas y jugadores disponibles
        $temporadas = Temporada::all();
        $players = User::where('role', 'jugador')->get();

        if ($temporadas->isEmpty() || $players->count() < 16) {
            return;
        }

        foreach ($temporadas as $temporada) {
            $orgName = $temporada->organizacion ? $temporada->organizacion->nombre : 'Organización';
            
            // 2. Crear Competencia 1vs1 UT (En Curso, con partidos jugados)
            $comp1v1 = CompetenciaUt::create([
                'temporada_id' => $temporada->id,
                'nombre' => "Supercopa 1vs1 UT - " . $orgName,
                'slug' => Str::slug("Supercopa 1vs1 UT " . $orgName . "-" . uniqid()),
                'descripcion' => "Torneo estrella 1vs1 de Ultimate Team en " . $orgName . ". Demuestra quién manda en la cancha.",
                'reglas' => "1. Duración: 12 min (6 min por lado)\n2. Plantillas UT libres sin restricciones de valoración.\n3. Prohibido el uso de jugadores préstamo.\n4. En caso de desconexión, reportar inmediatamente con captura.",
                'logo' => 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&h=200&fit=crop',
                'banner' => 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=400&fit=crop',
                'color_tema' => '#ef4444',
                'tipo' => '1vs1',
                'formato' => 'liga',
                'plataforma' => 'crossplay',
                'prize_pool' => 250.00,
                'entry_fee' => 0.00,
                'max_participantes' => 8,
                'es_publico' => true,
                'estado' => 'en_curso',
                'fecha_inicio_inscripciones' => now()->subDays(10),
                'fecha_fin_inscripciones' => now()->subDays(2),
                'fecha_inicio_competencia' => now()->subDay(),
            ]);

            // 3. Crear Competencia 2vs2 UT (En Inscripciones, para probar aprobaciones)
            $comp2v2 = CompetenciaUt::create([
                'temporada_id' => $temporada->id,
                'nombre' => "Copa Duos 2vs2 UT - " . $orgName,
                'slug' => Str::slug("Copa Duos 2vs2 UT " . $orgName . "-" . uniqid()),
                'descripcion' => "Torneo cooperativo en parejas (2vs2) de Ultimate Team. Coordinación y química perfecta en el campo.",
                'reglas' => "1. Ambos jugadores de la dupla deben estar registrados.\n2. Conexión de voz requerida para mejor comunicación.\n3. Se juega en modo cooperativo de Ultimate Team.",
                'logo' => 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&h=200&fit=crop',
                'banner' => 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&h=400&fit=crop',
                'color_tema' => '#3b82f6',
                'tipo' => '2vs2',
                'formato' => 'eliminatoria',
                'plataforma' => 'crossplay',
                'prize_pool' => 500.00,
                'entry_fee' => 10.00,
                'max_participantes' => 8,
                'es_publico' => true,
                'estado' => 'inscripciones',
                'fecha_inicio_inscripciones' => now()->subDays(2),
                'fecha_fin_inscripciones' => now()->addDays(3),
                'fecha_inicio_competencia' => now()->addDays(5),
            ]);

            // 4. Inscribir equipos para el torneo 1vs1 UT (6 equipos en total)
            $equipos1v1 = [];
            $players1v1 = $players->slice(0, 6)->values();

            foreach ($players1v1 as $idx => $player) {
                $equipo = EquipoUt::create([
                    'nombre' => "UT " . $player->gamertag ?: "Player " . $player->id,
                    'logo' => 'default.png',
                    'club_id_ea' => (string) (60000 + $player->id),
                    'plataforma' => 'crossplay',
                    'id_capitan' => $player->id,
                    'id_companero' => null,
                    'estado' => true,
                ]);
                $equipos1v1[] = $equipo;

                // Asociar a la competencia
                $comp1v1->equipos()->attach($equipo->id, ['estado_inscripcion' => 'aprobado']);
            }

            // 5. Inscribir equipos para el torneo 2vs2 UT
            $players2v2 = $players->slice(6, 8)->values();
            // Creamos 4 parejas
            for ($k = 0; $k < 4; $k++) {
                $capitan = $players2v2[$k * 2];
                $companero = $players2v2[$k * 2 + 1];

                $equipo2v2 = EquipoUt::create([
                    'nombre' => ($capitan->gamertag ?: "Player " . $capitan->id) . " / " . ($companero->gamertag ?: "Player " . $companero->id),
                    'logo' => 'default.png',
                    'club_id_ea' => (string) (70000 + $capitan->id),
                    'plataforma' => 'crossplay',
                    'id_capitan' => $capitan->id,
                    'id_companero' => $companero->id,
                    'estado' => true,
                ]);

                // 2 aprobados y 2 pendientes para probar la aprobación del organizador
                $estadoInscripcion = $k < 2 ? 'aprobado' : 'pendiente';
                $comp2v2->equipos()->attach($equipo2v2->id, ['estado_inscripcion' => $estadoInscripcion]);
            }

            // 6. Generar Partidos (Fixture Round Robin de 5 Jornadas) para el Torneo 1vs1
            // Usamos un fixture precalculado para 6 equipos (indices 0 a 5)
            $rounds = [
                // Jornada 1
                'Jornada 1' => [
                    [0, 5, '2026-06-06', '22:00', 3, 1],
                    [1, 4, '2026-06-06', '22:30', 2, 2],
                    [2, 3, '2026-06-06', '23:00', 0, 1]
                ],
                // Jornada 2
                'Jornada 2' => [
                    [0, 4, '2026-06-07', '22:00', 1, 0],
                    [5, 3, '2026-06-07', '22:30', 4, 2],
                    [1, 2, '2026-06-07', '23:00', 1, 3]
                ],
                // Jornada 3 (Hoy, se juega una y dos quedan programadas)
                'Jornada 3' => [
                    [0, 3, '2026-06-08', '22:00', 2, 2], // Jugado
                    [4, 2, '2026-06-08', '22:30', null, null], // Programado
                    [5, 1, '2026-06-08', '23:00', null, null]  // Programado
                ],
                // Jornada 4 (Futuras)
                'Jornada 4' => [
                    [0, 2, '2026-06-09', '22:00', null, null],
                    [3, 1, '2026-06-09', '22:30', null, null],
                    [4, 5, '2026-06-09', '23:00', null, null]
                ],
                // Jornada 5 (Futuras)
                'Jornada 5' => [
                    [0, 1, '2026-06-10', '22:00', null, null],
                    [2, 5, '2026-06-10', '22:30', null, null],
                    [3, 4, '2026-06-10', '23:00', null, null]
                ]
            ];

            foreach ($rounds as $jornadaName => $matches) {
                foreach ($matches as $matchInfo) {
                    $localIdx = $matchInfo[0];
                    $visitanteIdx = $matchInfo[1];
                    $fecha = $matchInfo[2];
                    $hora = $matchInfo[3];
                    $golesLocal = $matchInfo[4];
                    $golesVisitante = $matchInfo[5];

                    $equipoLocal = $equipos1v1[$localIdx];
                    $equipoVisitante = $equipos1v1[$visitanteIdx];

                    $partido = PartidoUt::create([
                        'competencia_ut_id' => $comp1v1->id,
                        'equipo_ut_local_id' => $equipoLocal->id,
                        'equipo_ut_visitante_id' => $equipoVisitante->id,
                        'jornada' => $jornadaName,
                        'grupo' => null,
                        'fecha' => $fecha,
                        'hora' => $hora,
                        'goles_local' => $golesLocal,
                        'goles_visitante' => $golesVisitante,
                        'stats' => $golesLocal !== null ? json_encode([
                            'possession' => [rand(45, 55), rand(45, 55)],
                            'shots' => [rand(8, 16), rand(8, 16)],
                            'passes' => [rand(120, 180), rand(120, 180)],
                            'tackles' => [rand(10, 20), rand(10, 20)],
                        ]) : null,
                    ]);

                    // Si tiene resultado, generar estadísticas
                    if ($golesLocal !== null) {
                        $this->createMatchStats($partido, $equipoLocal, $equipoVisitante, $golesLocal, $golesVisitante);
                    }
                }
            }
        }
    }

    /**
     * Crear estadísticas realistas de un partido para equipos y jugadores.
     */
    private function createMatchStats(PartidoUt $partido, EquipoUt $local, EquipoUt $visitante, int $gl, int $gv): void
    {
        $shotsL = rand(8, 15);
        $shotsV = rand(8, 15);
        
        $passesL = rand(130, 190);
        $passesCompL = intval($passesL * rand(75, 88) / 100);
        
        $passesV = rand(130, 190);
        $passesCompV = intval($passesV * rand(75, 88) / 100);

        $tacklesL = rand(12, 22);
        $tacklesSuccL = intval($tacklesL * rand(55, 75) / 100);
        
        $tacklesV = rand(12, 22);
        $tacklesSuccV = intval($tacklesV * rand(55, 75) / 100);

        // 1. Estadísticas agregadas de Equipo Local
        EstadisticaEquipoUt::create([
            'equipo_ut_id' => $local->id,
            'partido_ut_id' => $partido->id,
            'competencia_ut_id' => $partido->competencia_ut_id,
            'goles_favor' => $gl,
            'goles_en_contra' => $gv,
            'asistencias' => max(0, $gl - 1),
            'tiros' => $shotsL,
            'pases_intentados' => $passesL,
            'pases_completados' => $passesCompL,
            'precision_pases' => round(($passesCompL / $passesL) * 100, 2),
            'entradas_intentadas' => $tacklesL,
            'entradas_exitosas' => $tacklesSuccL,
            'tasa_exito_entradas' => round(($tacklesSuccL / $tacklesL) * 100, 2),
            'tarjetas_rojas' => rand(0, 10) > 8 ? 1 : 0,
            'valla_invicta_global' => $gv === 0,
            'valoracion_agregada' => $gl > $gv ? 7.60 : ($gl < $gv ? 6.20 : 6.90),
            'segundos_jugados_agregado' => 540,
            'tiempo_juego_motor' => 540,
            'procesado' => true,
        ]);

        // 2. Estadísticas agregadas de Equipo Visitante
        EstadisticaEquipoUt::create([
            'equipo_ut_id' => $visitante->id,
            'partido_ut_id' => $partido->id,
            'competencia_ut_id' => $partido->competencia_ut_id,
            'goles_favor' => $gv,
            'goles_en_contra' => $gl,
            'asistencias' => max(0, $gv - 1),
            'tiros' => $shotsV,
            'pases_intentados' => $passesV,
            'pases_completados' => $passesCompV,
            'precision_pases' => round(($passesCompV / $passesV) * 100, 2),
            'entradas_intentadas' => $tacklesV,
            'entradas_exitosas' => $tacklesSuccV,
            'tasa_exito_entradas' => round(($tacklesSuccV / $tacklesV) * 100, 2),
            'tarjetas_rojas' => rand(0, 10) > 8 ? 1 : 0,
            'valla_invicta_global' => $gl === 0,
            'valoracion_agregada' => $gv > $gl ? 7.60 : ($gv < $gl ? 6.20 : 6.90),
            'segundos_jugados_agregado' => 540,
            'tiempo_juego_motor' => 540,
            'procesado' => true,
        ]);

        // 3. Estadísticas de Jugador del Capitán Local (en 1vs1, el capitán es el único jugador)
        $pJugL = rand(45, 60);
        $pCompL = intval($pJugL * rand(78, 90) / 100);
        $tJugL = rand(5, 10);
        $tSuccL = intval($tJugL * rand(60, 80) / 100);

        EstadisticaJugadorUt::create([
            'jugador_id' => $local->id_capitan,
            'equipo_ut_id' => $local->id,
            'partido_ut_id' => $partido->id,
            'competencia_ut_id' => $partido->competencia_ut_id,
            'posicion' => 'MCO',
            'valoracion' => $gl > $gv ? 8.20 : ($gl < $gv ? 6.10 : 7.10),
            'goles' => $gl,
            'asistencias' => max(0, $gl - 1),
            'tiros' => rand(3, 7),
            'tarjetas_rojas' => 0,
            'jugador_partido' => $gl > $gv,
            'pases_intentados' => $pJugL,
            'pases_completados' => $pCompL,
            'precision_pases' => round(($pCompL / $pJugL) * 100, 2),
            'entradas_intentadas' => $tJugL,
            'entradas_exitosas' => $tSuccL,
            'tasa_exito_entradas' => round(($tSuccL / $tJugL) * 100, 2),
            'segundos_jugados' => 540,
        ]);

        // 4. Estadísticas de Jugador del Capitán Visitante
        $pJugV = rand(45, 60);
        $pCompV = intval($pJugV * rand(78, 90) / 100);
        $tJugV = rand(5, 10);
        $tSuccV = intval($tJugV * rand(60, 80) / 100);

        EstadisticaJugadorUt::create([
            'jugador_id' => $visitante->id_capitan,
            'equipo_ut_id' => $visitante->id,
            'partido_ut_id' => $partido->id,
            'competencia_ut_id' => $partido->competencia_ut_id,
            'posicion' => 'DEL',
            'valoracion' => $gv > $gl ? 8.20 : ($gv < $gl ? 6.10 : 7.10),
            'goles' => $gv,
            'asistencias' => max(0, $gv - 1),
            'tiros' => rand(3, 7),
            'tarjetas_rojas' => 0,
            'jugador_partido' => $gv > $gl,
            'pases_intentados' => $pJugV,
            'pases_completados' => $pCompV,
            'precision_pases' => round(($pCompV / $pJugV) * 100, 2),
            'entradas_intentadas' => $tJugV,
            'entradas_exitosas' => $tSuccV,
            'tasa_exito_entradas' => round(($tSuccV / $tJugV) * 100, 2),
            'segundos_jugados' => 540,
        ]);

        // 5. Logs de jugador para ambos capitanes
        EstadisticaJugadorUtLog::create([
            'playername' => $local->capitan ? $local->capitan->gamertag : "PlayerL",
            'partido_ut_id' => $partido->id,
            'jugador_id' => $local->id_capitan,
            'equipo_ut_id' => $local->id,
            'competencia_ut_id' => $partido->competencia_ut_id,
            'jugo' => true,
            'procesado' => true,
            'estado' => 'vinculado',
        ]);

        EstadisticaJugadorUtLog::create([
            'playername' => $visitante->capitan ? $visitante->capitan->gamertag : "PlayerV",
            'partido_ut_id' => $partido->id,
            'jugador_id' => $visitante->id_capitan,
            'equipo_ut_id' => $visitante->id,
            'competencia_ut_id' => $partido->competencia_ut_id,
            'jugo' => true,
            'procesado' => true,
            'estado' => 'vinculado',
        ]);
    }
}
