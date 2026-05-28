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
        // 1. Administrador General
        User::create([
            'name' => 'Administrador General',
            'email' => 'admin@racon.com',
            'password' => Hash::make('password123'),
            'role' => 'administrador',
            'status' => 'activo',
            'gamertag' => 'AdminMaster',
            'id_ea' => 'EA_ADMIN_001',
        ]);

        // 2. Crear 4 Organizadores y sus respectivas Organizaciones, Temporadas y Competencias
        $organizaciones = [];
        $competencias = [];
        for ($i = 1; $i <= 4; $i++) {
            $organizador = User::create([
                'name' => "Organizador Circuito $i",
                'email' => "organizador$i@racon.com",
                'password' => Hash::make('password123'),
                'role' => 'organizador',
                'status' => 'activo',
                'gamertag' => "OrgCircuito$i",
                'id_ea' => "EA_ORG_00$i",
            ]);

            $organizacion = Organizacion::create([
                'owner_id' => $organizador->id,
                'nombre' => "Liga Esports Circuito $i",
                'slug' => "liga-esports-circuito-$i",
                'descripcion' => "Circuito oficial número $i para ligas de alto rendimiento y competidores de élite.",
                'estado' => 'activo',
            ]);
            $organizaciones[] = $organizacion;

            $temporada = Temporada::create([
                'organizacion_id' => $organizacion->id,
                'nombre' => "Temporada Inaugural 2026 - Circuito $i",
                'slug' => "temporada-inaugural-2026-circuito-$i",
                'fecha_inicio' => '2026-01-01',
                'fecha_fin' => '2026-12-31',
                'activa' => true,
            ]);

            // 4 competencias por organización
            $formatos = ['liga', 'copa', 'eliminatoria'];
            $plataformas = ['crossplay', 'ps5', 'pc', 'crossplay'];
            for ($j = 1; $j <= 4; $j++) {
                $comp = Competencia::create([
                    'temporada_id' => $temporada->id,
                    'nombre' => "Copa Pro Circuito $i - División $j",
                    'slug' => "copa-pro-circuito-$i-division-$j",
                    'formato' => $formatos[($j - 1) % count($formatos)],
                    'plataforma' => $plataformas[($j - 1) % count($plataformas)],
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
                'email' => "capitan$i@racon.com",
                'password' => Hash::make('password123'),
                'role' => 'jugador',
                'status' => 'activo',
                'gamertag' => "CapFC$i",
                'id_ea' => "EA_CAP_0$i",
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
                'descripcion' => "Escuadra táctica profesional compitiendo en el máximo circuito de RaconPro.",
                'plataforma' => $plataformasEquipos[$i % 3],
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
                    'email' => "jugador_eq{$i}_j{$j}@racon.com",
                    'password' => Hash::make('password123'),
                    'role' => 'jugador',
                    'status' => 'activo',
                    'gamertag' => "Gamertag_{$i}_{$j}",
                    'id_ea' => "EA_JUG_{$i}_{$j}",
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
    }
}
