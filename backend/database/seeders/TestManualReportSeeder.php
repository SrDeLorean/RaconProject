<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Equipo;
use App\Models\Organizacion;
use App\Models\Temporada;
use App\Models\Competencia;
use App\Models\Partido;
use App\Models\OrganizacionEquipoUsuario;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class TestManualReportSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('⚽ Creando datos para prueba de Reporte Manual...');

        // 1. Crear Organización de prueba
        $organizador = User::create([
            'name' => 'Organizador Manual Test',
            'email' => 'org_manual@torneosprofc.com',
            'password' => Hash::make('password123'),
            'role' => 'organizador',
            'status' => 'activo',
            'gamertag' => 'OrgManual',
            'id_ea' => '990000001',
            'foto' => 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop'
        ]);

        $organizacion = Organizacion::create([
            'owner_id' => $organizador->id,
            'nombre' => 'Liga de Prueba Manual',
            'slug' => Str::slug('Liga de Prueba Manual-' . uniqid()),
            'descripcion' => 'Organización creada para probar reportes manuales y confirmaciones de partidos en empates.',
            'logo' => 'https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=200&h=200&fit=crop',
            'banner' => 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=400&fit=crop',
            'estado' => 'activo',
            'color_hex' => '#8b5cf6'
        ]);

        // 2. Crear Temporada y Competencia
        $temporada = Temporada::create([
            'organizacion_id' => $organizacion->id,
            'nombre' => 'Temporada Manual 2026',
            'slug' => Str::slug('Temporada Manual 2026-' . uniqid()),
            'fecha_inicio' => '2026-01-01',
            'fecha_fin' => '2026-12-31',
            'activa' => true,
        ]);

        $competencia = Competencia::create([
            'temporada_id' => $temporada->id,
            'nombre' => 'Copa Manual 11v11',
            'slug' => Str::slug('Copa Manual 11v11-' . uniqid()),
            'formato' => 'liga',
            'plataforma' => 'crossplay',
            'max_participantes' => 8,
            'es_publico' => true,
            'estado' => 'en_curso',
        ]);

        // 3. Crear 2 Equipos
        $equiposInfo = [
            [
                'nombre' => 'Real Madrid Manual',
                'abreviatura' => 'RMM',
                'ea_id' => '999901',
                'capitan' => [
                    'name' => 'Capitán Madrid',
                    'email' => 'madrid_cap@torneosprofc.com',
                    'gamertag' => 'MadridCap'
                ],
                'plantilla' => [
                    ['name' => 'Jugador Madrid Uno', 'email' => 'madrid1@torneosprofc.com', 'gamertag' => 'MadridP1', 'pos' => 'DEL', 'dorsal' => '9'],
                    ['name' => 'Jugador Madrid Dos', 'email' => 'madrid2@torneosprofc.com', 'gamertag' => 'MadridP2', 'pos' => 'MC', 'dorsal' => '8'],
                    ['name' => 'Jugador Madrid Tres', 'email' => 'madrid3@torneosprofc.com', 'gamertag' => 'MadridP3', 'pos' => 'POR', 'dorsal' => '1'],
                ]
            ],
            [
                'nombre' => 'Barcelona Manual',
                'abreviatura' => 'BCM',
                'ea_id' => '999902',
                'capitan' => [
                    'name' => 'Capitán Barcelona',
                    'email' => 'barca_cap@torneosprofc.com',
                    'gamertag' => 'BarcaCap'
                ],
                'plantilla' => [
                    ['name' => 'Jugador Barca Uno', 'email' => 'barca1@torneosprofc.com', 'gamertag' => 'BarcaP1', 'pos' => 'DEL', 'dorsal' => '10'],
                    ['name' => 'Jugador Barca Dos', 'email' => 'barca2@torneosprofc.com', 'gamertag' => 'BarcaP2', 'pos' => 'MC', 'dorsal' => '6'],
                    ['name' => 'Jugador Barca Tres', 'email' => 'barca3@torneosprofc.com', 'gamertag' => 'BarcaP3', 'pos' => 'POR', 'dorsal' => '13'],
                ]
            ]
        ];

        $dbEquipos = [];

        foreach ($equiposInfo as $info) {
            // Crear Capitán
            $capDb = User::create([
                'name' => $info['capitan']['name'],
                'email' => $info['capitan']['email'],
                'password' => Hash::make('password123'),
                'role' => 'jugador',
                'status' => 'activo',
                'gamertag' => $info['capitan']['gamertag'],
                'id_ea' => (string)rand(900000, 999999),
                'foto' => 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop'
            ]);

            // Crear Equipo
            $equipoDb = Equipo::create([
                'id_capitan' => $capDb->id,
                'nombre' => $info['nombre'],
                'slug' => Str::slug($info['nombre'] . '-' . uniqid()),
                'abreviatura' => $info['abreviatura'],
                'descripcion' => 'Equipo para pruebas de reportes manuales.',
                'plataforma' => 'crossplay',
                'logo' => 'https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=150&h=150&fit=crop',
                'banner' => 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=400&fit=crop',
                'club_id_ea' => $info['ea_id'],
                'estado' => true
            ]);

            $dbEquipos[] = $equipoDb;

            // Inscribir Capitán
            OrganizacionEquipoUsuario::create([
                'organizacion_id' => $organizacion->id,
                'equipo_id' => $equipoDb->id,
                'user_id' => $capDb->id,
                'dorsal' => '10',
                'posicion_bloque' => 'MCO',
                'estado_fichaje' => 'activo',
                'fecha_vinculacion' => now()
            ]);

            // Crear Roster (3 jugadores adicionales + Capitán = 4 jugadores)
            foreach ($info['plantilla'] as $p) {
                $userDb = User::create([
                    'name' => $p['name'],
                    'email' => $p['email'],
                    'password' => Hash::make('password123'),
                    'role' => 'jugador',
                    'status' => 'activo',
                    'gamertag' => $p['gamertag'],
                    'id_ea' => (string)rand(900000, 999999),
                    'foto' => 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop'
                ]);

                OrganizacionEquipoUsuario::create([
                    'organizacion_id' => $organizacion->id,
                    'equipo_id' => $equipoDb->id,
                    'user_id' => $userDb->id,
                    'dorsal' => $p['dorsal'],
                    'posicion_bloque' => $p['pos'],
                    'estado_fichaje' => 'activo',
                    'fecha_vinculacion' => now()
                ]);
            }

            // Inscribir Equipo en la Competencia
            $equipoDb->competencias()->attach($competencia->id, ['estado_inscripcion' => 'aprobado']);
        }

        // 4. Crear Calendario de Ida y Vuelta (2 Jornadas)
        // Jornada 1: Real Madrid (Local) vs Barcelona (Visitante)
        Partido::create([
            'competencia_id' => $competencia->id,
            'equipo_local_id' => $dbEquipos[0]->id,
            'equipo_visitante_id' => $dbEquipos[1]->id,
            'jornada' => 'Jornada 1 (Ida)',
            'grupo' => null,
            'fecha' => now()->format('Y-m-d'),
            'hora' => '22:00',
            'goles_local' => null,
            'goles_visitante' => null,
            'stats' => null,
        ]);

        // Jornada 2: Barcelona (Local) vs Real Madrid (Visitante)
        Partido::create([
            'competencia_id' => $competencia->id,
            'equipo_local_id' => $dbEquipos[1]->id,
            'equipo_visitante_id' => $dbEquipos[0]->id,
            'jornada' => 'Jornada 2 (Vuelta)',
            'grupo' => null,
            'fecha' => now()->addDay()->format('Y-m-d'),
            'hora' => '22:30',
            'goles_local' => null,
            'goles_visitante' => null,
            'stats' => null,
        ]);

        $this->command->info('✅ Datos generados exitosamente.');
        $this->command->info('==================================================');
        $this->command->info('  Detalles del Seeder:');
        $this->command->info('  - Organización: ' . $organizacion->nombre);
        $this->command->info('  - Competencia: ' . $competencia->nombre);
        $this->command->info('  - Equipos: ' . $dbEquipos[0]->nombre . ' (' . $dbEquipos[0]->abreviatura . ') y ' . $dbEquipos[1]->nombre . ' (' . $dbEquipos[1]->abreviatura . ')');
        $this->command->info('  - Roster: 4 jugadores por equipo.');
        $this->command->info('  - Calendario: 2 partidos programados (Ida y Vuelta).');
        $this->command->info('==================================================');
    }
}
