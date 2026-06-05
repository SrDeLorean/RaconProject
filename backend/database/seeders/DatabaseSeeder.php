<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Organizacion;
use App\Models\Temporada;
use App\Models\Competencia;
use App\Models\Equipo;
use App\Models\OrganizacionEquipoUsuario;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 0. Imágenes por Defecto de Alta Calidad (Unsplash Premium Gaming)
        $defaultUserPhoto = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop';
        
        $orgLogos = [
            'https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?w=200&h=200&fit=crop', // Espacio Gamer
            'https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=200&h=200&fit=crop', // Comunidad AMC
            'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&h=200&fit=crop', // Virtual Pro Network
            'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&h=200&fit=crop', // GamerCup
        ];

        $orgBanners = [
            'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=400&fit=crop',
            'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&h=400&fit=crop',
            'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&h=400&fit=crop',
            'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&h=400&fit=crop',
        ];

        $teamLogos = [
            'https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?w=150&h=150&fit=crop',
            'https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=150&h=150&fit=crop',
            'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=150&h=150&fit=crop',
            'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=150&h=150&fit=crop'
        ];

        // 1. Administrador General
        User::create([
            'name' => 'Administrador General',
            'email' => 'admin@torneosprofc.com',
            'password' => Hash::make('password123'),
            'role' => 'administrador',
            'status' => 'activo',
            'gamertag' => 'AdminMaster',
            'id_ea' => '100000001',
            'foto' => $defaultUserPhoto
        ]);

        // 2. Nombres personalizados solicitados para Organizaciones y Competencias
        $nombresOrgs = [
            'Espacio Gamer',
            'Comunidad AMC',
            'Virtual Pro Network',
            'GamerCup'
        ];

        $competenciasPorOrg = [
            0 => ['División Profesional', 'División Élite', 'División Ascenso', 'Copa ANFA'],
            1 => ['Primera División', 'Segunda División', 'Tercera División', 'Cuarta División'],
            2 => ['Superliga Pro', 'Liga Nacional', 'Copa Federación', 'Torneo de Ascenso'],
            3 => ['Champions Cup', 'Challengers League', 'Master Cup', 'Copa de Plata']
        ];

        $organizaciones = [];
        $competencias = [];
        $temporadas = [];

        for ($i = 0; $i < 4; $i++) {
            $orgName = $nombresOrgs[$i];
            
            $organizador = User::create([
                'name' => "Organizador - " . $orgName,
                'email' => "organizador" . ($i + 1) . "@torneosprofc.com",
                'password' => Hash::make('password123'),
                'role' => 'organizador',
                'status' => 'activo',
                'gamertag' => "Org_" . str_replace(' ', '', $orgName),
                'id_ea' => (string)(200000000 + $i),
                'foto' => $defaultUserPhoto
            ]);

            $organizacion = Organizacion::create([
                'owner_id' => $organizador->id,
                'nombre' => $orgName,
                'slug' => Str::slug($orgName),
                'descripcion' => "Circuito oficial de " . $orgName . " para ligas de alto rendimiento y competidores de élite.",
                'logo' => $orgLogos[$i],
                'banner' => $orgBanners[$i],
                'estado' => 'activo',
                'color_hex' => $i === 0 ? '#ef4444' : ($i === 1 ? '#3b82f6' : ($i === 2 ? '#10b981' : '#f59e0b'))
            ]);
            $organizaciones[] = $organizacion;

            $temporada = Temporada::create([
                'organizacion_id' => $organizacion->id,
                'nombre' => "Temporada Inaugural 2026 - " . $orgName,
                'slug' => Str::slug("Temporada Inaugural 2026 " . $orgName),
                'fecha_inicio' => '2026-01-01',
                'fecha_fin' => '2026-12-31',
                'activa' => true,
            ]);
            $temporadas[] = $temporada;

            // 4 competencias específicas por organización
            $formatos = ['liga', 'copa', 'eliminatoria', 'liga'];
            $plataformas = ['crossplay', 'ps5', 'pc', 'crossplay'];
            
            for ($j = 0; $j < 4; $j++) {
                $compName = $competenciasPorOrg[$i][$j];
                
                $comp = Competencia::create([
                    'temporada_id' => $temporada->id,
                    'nombre' => $compName,
                    'slug' => Str::slug($compName . " " . $orgName),
                    'formato' => $formatos[$j],
                    'plataforma' => $plataformas[$j],
                    'max_participantes' => 16,
                    'es_publico' => true,
                    'estado' => 'inscripciones',
                ]);
                $competencias[] = $comp;
            }
        }

        // 3. Crear 24 Capitanes de equipo (usuarios con rol jugador)
        $capitanes = [];
        for ($i = 1; $i <= 24; $i++) {
            $capitan = User::create([
                'name' => "Capitán Equipo $i",
                'email' => "capitan$i@torneosprofc.com",
                'password' => Hash::make('password123'),
                'role' => 'jugador',
                'status' => 'activo',
                'gamertag' => "CapFC$i",
                'id_ea' => (string)(300000000 + $i),
                'foto' => $defaultUserPhoto
            ]);
            $capitanes[] = $capitan;
        }

        // 4. Crear 24 Equipos asignados a cada capitán
        $equipos = [];
        $nombresEquipos = [
            'Valhalla', 'Krypton', 'Spartans', 'Lions', 'Dragons', 'Phoenix',
            'Titans', 'Vipers', 'Ninjas', 'Knights', 'Monarchs', 'Astrals',
            'Rebels', 'Sentinels', 'Tempest', 'Royals', 'Shadows', 'Blades',
            'Raptors', 'Grizzlies', 'Wolves', 'Wizards', 'Outlaws', 'Ravens'
        ];
        $plataformasEquipos = ['crossplay', 'ps5', 'pc'];

        for ($i = 0; $i < 24; $i++) {
            $equipo = Equipo::create([
                'id_capitan' => $capitanes[$i]->id,
                'nombre' => $nombresEquipos[$i] . ' Esports',
                'slug' => Str::slug($nombresEquipos[$i] . ' Esports'),
                'abreviatura' => strtoupper(substr($nombresEquipos[$i], 0, 3)),
                'descripcion' => "Escuadra táctica profesional compitiendo en el máximo circuito de Torneos Pro FC.",
                'plataforma' => $plataformasEquipos[$i % 3],
                'logo' => $teamLogos[$i % 4],
                'banner' => $orgBanners[$i % 4],
                'club_id_ea' => (string) (50000 + $i),
                'estado' => true,
            ]);
            $equipos[] = $equipo;

            // Inscribir al propio capitán en la primera organización en la que participa
            $orgIndex = $i % 4; // Distribuir entre las 4 organizaciones
            $org = $organizaciones[$orgIndex];

            OrganizacionEquipoUsuario::create([
                'organizacion_id' => $org->id,
                'equipo_id' => $equipo->id,
                'user_id' => $capitanes[$i]->id,
                'dorsal' => '10',
                'posicion_bloque' => 'MCO',
                'estado_fichaje' => 'activo',
                'fecha_vinculacion' => now(),
            ]);

            // Inscribir este equipo en 2 competencias de esa organización
            $compsCircuito = array_filter($competencias, function ($c) use ($org) {
                return $c->temporada->organizacion_id === $org->id;
            });
            $compsCircuito = array_values($compsCircuito);

            if (count($compsCircuito) >= 2) {
                $equipo->competencias()->attach([$compsCircuito[0]->id, $compsCircuito[1]->id], ['estado_inscripcion' => 'aprobado']);
            }
        }

        // 5. Crear jugadores adicionales para rellenar los equipos (11 a 15 jugadores por equipo)
        $posiciones = ['POR', 'DFC', 'DFI', 'DFD', 'MC', 'MCO', 'MD', 'MI', 'DEL'];
        $nombres = ['Mateo', 'Santiago', 'Sebastián', 'Alejandro', 'Nicolás', 'Felipe', 'Benjamín', 'Tomás', 'Joaquín', 'Ignacio', 'Diego', 'Gabriel', 'Lucas', 'Daniel', 'David', 'Martín', 'Agustín', 'Javier', 'Francisco', 'Manuel'];
        $apellidos = ['González', 'Muñoz', 'Rojas', 'Díaz', 'Pérez', 'Soto', 'Silva', 'Contreras', 'Martínez', 'Sepúlveda', 'Morales', 'Rodríguez', 'López', 'Fuentes', 'Hernández', 'Torres', 'Araya', 'Flores', 'Espinoza', 'Valenzuela'];

        for ($i = 0; $i < 24; $i++) {
            $equipo = $equipos[$i];
            $orgIndex = $i % 4;
            $org = $organizaciones[$orgIndex];

            // Determinar aleatoriamente cuántos jugadores agregar (entre 10 y 14 más, para llegar a 11-15 total incluyendo al capitán)
            $cantJugadores = rand(10, 14);

            for ($j = 1; $j <= $cantJugadores; $j++) {
                $nombreCompleto = $nombres[rand(0, 19)] . ' ' . $apellidos[rand(0, 19)];

                $jugador = User::create([
                    'name' => $nombreCompleto,
                    'email' => "jugador_eq{$i}_j{$j}@torneosprofc.com",
                    'password' => Hash::make('password123'),
                    'role' => 'jugador',
                    'status' => 'activo',
                    'gamertag' => "Gamertag_{$i}_{$j}",
                    'id_ea' => (string)(400000000 + ($i * 100) + $j),
                    'foto' => $defaultUserPhoto
                ]);

                // Registrar en la misma organización y equipo
                OrganizacionEquipoUsuario::create([
                    'organizacion_id' => $org->id,
                    'equipo_id' => $equipo->id,
                    'user_id' => $jugador->id,
                    'dorsal' => (string)rand(1, 99),
                    'posicion_bloque' => $posiciones[rand(0, 8)],
                    'estado_fichaje' => 'activo',
                    'fecha_vinculacion' => now(),
                ]);
            }
        }

        // 6. Seed Approved Transfers
        $jugadoresParaFichar = User::where('role', 'jugador')->where('id', '>', 50)->take(6)->get();
        if ($jugadoresParaFichar->count() >= 6) {
            $solicitudesFichajesData = [
                [
                    'user_id' => $jugadoresParaFichar[0]->id,
                    'organizacion_id' => $organizaciones[0]->id,
                    'temporada_id' => $temporadas[0]->id,
                    'equipo_id' => $equipos[0]->id,       // Valhalla
                    'equipo_origen_id' => $equipos[4]->id, // Dragons
                    'posicion' => 'DEL',
                    'dorsal' => '9',
                    'estado' => 'aprobado',
                    'created_at' => now()->subDays(2),
                    'updated_at' => now()->subDays(2),
                ],
                [
                    'user_id' => $jugadoresParaFichar[1]->id,
                    'organizacion_id' => $organizaciones[0]->id,
                    'temporada_id' => $temporadas[0]->id,
                    'equipo_id' => $equipos[1]->id,       // Krypton
                    'equipo_origen_id' => null,            // Agente Libre
                    'posicion' => 'MC',
                    'dorsal' => '8',
                    'estado' => 'aprobado',
                    'created_at' => now()->subDays(1),
                    'updated_at' => now()->subDays(1),
                ],
                [
                    'user_id' => $jugadoresParaFichar[2]->id,
                    'organizacion_id' => $organizaciones[1]->id,
                    'temporada_id' => $temporadas[1]->id,
                    'equipo_id' => $equipos[5]->id,       // Phoenix
                    'equipo_origen_id' => $equipos[9]->id, // Knights
                    'posicion' => 'DFC',
                    'dorsal' => '4',
                    'estado' => 'aprobado',
                    'created_at' => now()->subHours(12),
                    'updated_at' => now()->subHours(12),
                ],
                [
                    'user_id' => $jugadoresParaFichar[3]->id,
                    'organizacion_id' => $organizaciones[1]->id,
                    'temporada_id' => $temporadas[1]->id,
                    'equipo_id' => $equipos[6]->id,       // Titans
                    'equipo_origen_id' => null,            // Agente Libre
                    'posicion' => 'POR',
                    'dorsal' => '1',
                    'estado' => 'aprobado',
                    'created_at' => now()->subHours(6),
                    'updated_at' => now()->subHours(6),
                ],
                [
                    'user_id' => $jugadoresParaFichar[4]->id,
                    'organizacion_id' => $organizaciones[2]->id,
                    'temporada_id' => $temporadas[2]->id,
                    'equipo_id' => $equipos[10]->id,      // Monarchs
                    'equipo_origen_id' => $equipos[14]->id,// Tempest
                    'posicion' => 'MCO',
                    'dorsal' => '10',
                    'estado' => 'aprobado',
                    'created_at' => now()->subHours(2),
                    'updated_at' => now()->subHours(2),
                ],
                [
                    'user_id' => $jugadoresParaFichar[5]->id,
                    'organizacion_id' => $organizaciones[3]->id,
                    'temporada_id' => $temporadas[3]->id,
                    'equipo_id' => $equipos[15]->id,      // Royals
                    'equipo_origen_id' => $equipos[19]->id,// Grizzlies
                    'posicion' => 'DEL',
                    'dorsal' => '11',
                    'estado' => 'aprobado',
                    'created_at' => now()->subMinutes(30),
                    'updated_at' => now()->subMinutes(30),
                ]
            ];

            foreach ($solicitudesFichajesData as $sf) {
                \App\Models\SolicitudFichaje::create($sf);
            }
        }

        $this->call(RealDataSeeder::class);
    }
}
