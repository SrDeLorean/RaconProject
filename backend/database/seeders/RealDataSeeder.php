<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Equipo;
use App\Models\Organizacion;
use App\Models\Competencia;
use App\Models\OrganizacionEquipoUsuario;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class RealDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Iniciando importación de datos reales...');

        // 1. Importar Usuarios
        $usersFile = base_path('users.sql');
        if (!file_exists($usersFile)) {
            $this->command->error("No se encontró el archivo users.sql en " . $usersFile);
            return;
        }

        $this->command->info('Parseando e importando usuarios reales...');
        $usersCount = 0;
        $handle = fopen($usersFile, "r");
        
        if ($handle) {
            DB::beginTransaction();
            try {
                while (($line = fgets($handle)) !== false) {
                    $row = $this->parseSqlValuesLine($line);
                    if ($row && count($row) >= 23) {
                        $id = (int)$row[0];
                        $name = $row[1];
                        $id_ea = $row[2];
                        $email = $row[3];
                        $password = $row[5] ?: Hash::make('password123');
                        $role = $row[6];
                        $foto = $row[7] ?: 'images/users/default-user.png';
                        $nacionalidad = $row[8];
                        $posicion = $row[9];
                        $fecha_nacimiento = $row[10];
                        $altura = $row[11] ? (int)$row[11] : null;
                        $peso = $row[12] ? (int)$row[12] : null;
                        $telefono = $row[13];
                        $instagram = $row[14];
                        $facebook = $row[15];
                        $twitch = $row[16];
                        $youtube = $row[17];
                        $tiktok = $row[18];

                        // Mapear rol si es necesario
                        if ($role === 'entrenador') {
                            $role = 'jugador';
                        }
                        if (!in_array($role, ['jugador', 'organizador', 'administrador'])) {
                            $role = 'jugador';
                        }

                        // Asegurar email único
                        if (empty($email) || DB::table('users')->where('email', $email)->exists()) {
                            $email = "user_{$id}_" . Str::random(4) . "@racon.com";
                        }

                        // Asegurar gamertag único (usamos id_ea si está disponible, o el nombre)
                        $gamertag = $id_ea ?: "Gamer_{$id}";
                        if (DB::table('users')->where('gamertag', $gamertag)->exists()) {
                            $gamertag = $gamertag . "_" . Str::random(3);
                        }

                        DB::table('users')->insertOrIgnore([
                            'id' => $id,
                            'name' => $name,
                            'email' => $email,
                            'password' => $password,
                            'role' => $role,
                            'status' => 'activo',
                            'gamertag' => $gamertag,
                            'id_ea' => $id_ea,
                            'plataforma' => 'crossplay',
                            'foto' => $foto,
                            'nacionalidad' => $nacionalidad,
                            'posicion' => $posicion,
                            'fecha_nacimiento' => ($fecha_nacimiento && $fecha_nacimiento !== 'NULL') ? date('Y-m-d', strtotime($fecha_nacimiento)) : null,
                            'altura' => $altura,
                            'peso' => $peso,
                            'telefono' => $telefono,
                            'instagram' => $instagram,
                            'facebook' => $facebook,
                            'twitch' => $twitch,
                            'youtube' => $youtube,
                            'tiktok' => $tiktok,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);

                        $usersCount++;
                    }
                }
                DB::commit();
                $this->command->info("Se importaron {$usersCount} usuarios reales exitosamente.");
            } catch (\Exception $e) {
                DB::rollBack();
                $this->command->error("Error al importar usuarios: " . $e->getMessage());
                fclose($handle);
                return;
            }
            fclose($handle);
        }

        // 2. Importar Equipos
        $equiposFile = base_path('equipos.sql');
        if (!file_exists($equiposFile)) {
            $this->command->error("No se encontró el archivo equipos.sql en " . $equiposFile);
            return;
        }

        $this->command->info('Parseando e importando equipos reales...');
        $equiposCount = 0;
        $handle = fopen($equiposFile, "r");

        if ($handle) {
            DB::beginTransaction();
            try {
                // Obtener organizaciones existentes para vincular los equipos
                $organizaciones = Organizacion::all();
                $competencias = Competencia::all();

                // Escanear previamente todos los IDs de usuario que serán capitanes para excluirlos de los rosters aleatorios
                $allCaptainsIds = [];
                $tempHandle = fopen($equiposFile, "r");
                if ($tempHandle) {
                    while (($line = fgets($tempHandle)) !== false) {
                        $row = $this->parseSqlValuesLine($line);
                        if ($row && count($row) >= 17) {
                            if ($row[12]) $allCaptainsIds[] = (int)$row[12];
                            if ($row[13]) $allCaptainsIds[] = (int)$row[13];
                        }
                    }
                    fclose($tempHandle);
                }

                while (($line = fgets($handle)) !== false) {
                    $row = $this->parseSqlValuesLine($line);
                    if ($row && count($row) >= 17) {
                        $id = (int)$row[0];
                        $nombre = $row[1];
                        $abreviatura = $row[2] ?: strtoupper(substr($nombre, 0, 3));
                        $descripcion = $row[3];
                        $clubId = $row[5]; // clubId -> club_id_ea
                        $logo = $row[7] ?: 'default.png';
                        $id_usuario = $row[12] ? (int)$row[12] : null;
                        $id_usuario2 = $row[13] ? (int)$row[13] : null;

                        // Asegurar Nombre único
                        $baseNombre = $nombre;
                        $nameCounter = 1;
                        while (DB::table('equipos')->where('nombre', $nombre)->exists()) {
                            $nombre = $baseNombre . " " . $nameCounter;
                            $nameCounter++;
                        }

                        // Asegurar Slug único
                        $slug = Str::slug($nombre);
                        if (DB::table('equipos')->where('slug', $slug)->exists()) {
                            $slug = $slug . "-" . $id;
                        }

                        // Asegurar Abreviatura única (nullable)
                        if ($row[2]) {
                            $abreviatura = $row[2];
                        } else {
                            $abreviatura = strtoupper(substr($nombre, 0, 3));
                        }
                        
                        if ($abreviatura) {
                            $baseAbrev = substr($abreviatura, 0, 7);
                            $checkAbrev = $baseAbrev;
                            $abrevCounter = 1;
                            while (DB::table('equipos')->where('abreviatura', $checkAbrev)->exists()) {
                                $checkAbrev = substr($baseAbrev, 0, 10 - strlen($abrevCounter)) . $abrevCounter;
                                $abrevCounter++;
                            }
                            $abreviatura = $checkAbrev;
                        }

                        // Obtener organización destino y competencia basándonos en la lista del usuario
                        $org = null;
                        $comp = null;
                        
                        $comunidadAMC = Organizacion::where('nombre', 'Comunidad AMC')->first();
                        $targetDivision = $this->findTeamDivision($nombre);

                        if ($targetDivision && $comunidadAMC) {
                            $org = $comunidadAMC;
                            // Buscar competencia correspondiente en Comunidad AMC
                            $compName = '';
                            if ($targetDivision === 'elite') $compName = 'Primera División';
                            elseif ($targetDivision === 'ascenso') $compName = 'Segunda División';
                            elseif ($targetDivision === 'anfa') $compName = 'Tercera División';
                            elseif ($targetDivision === 'prospect') $compName = 'Cuarta División';

                            $comp = Competencia::where('nombre', $compName)
                                ->whereHas('temporada', function($query) use ($comunidadAMC) {
                                    $query->where('organizacion_id', $comunidadAMC->id);
                                })->first();
                        }

                        // Fallback por si el equipo no está en las listas del usuario o no existe Comunidad AMC
                        if (!$org && $organizaciones->isNotEmpty()) {
                            $org = $organizaciones[$id % $organizaciones->count()];
                        }

                        // Resolver id_capitan único
                        $id_capitan = null;
                        
                        // Intentar con id_usuario
                        if ($id_usuario && DB::table('users')->where('id', $id_usuario)->exists()) {
                            // Validar que no sea capitán de otro equipo
                            if (!DB::table('equipos')->where('id_capitan', $id_usuario)->exists()) {
                                $id_capitan = $id_usuario;
                            }
                        }

                        // Intentar con id_usuario2
                        if (!$id_capitan && $id_usuario2 && DB::table('users')->where('id', $id_usuario2)->exists()) {
                            if (!DB::table('equipos')->where('id_capitan', $id_usuario2)->exists()) {
                                $id_capitan = $id_usuario2;
                            }
                        }

                        // Si no hay capitán disponible, buscamos un jugador libre
                        if (!$id_capitan) {
                            $freeUserQuery = User::where('role', 'jugador')
                                ->where('id', '>=', 944) // Solo usar usuarios reales importados
                                ->whereNotIn('id', $allCaptainsIds)
                                ->whereNotExists(function ($query) {
                                    $query->select(DB::raw(1))
                                        ->from('equipos')
                                        ->whereRaw('equipos.id_capitan = users.id');
                                });

                            if ($org) {
                                $freeUserQuery->whereNotExists(function ($query) use ($org) {
                                    $query->select(DB::raw(1))
                                        ->from('organizacion_equipo_usuario')
                                        ->whereRaw('organizacion_equipo_usuario.user_id = users.id')
                                        ->where('organizacion_equipo_usuario.organizacion_id', $org->id);
                                });
                            }

                            $freeUser = $freeUserQuery->first();

                            if ($freeUser) {
                                $id_capitan = $freeUser->id;
                            } else {
                                // Crear un capitán ficticio
                                $capName = "Capitán " . $nombre;
                                $capEmail = "capitan_real_" . $id . "@racon.com";
                                $newCap = User::create([
                                    'name' => $capName,
                                    'email' => $capEmail,
                                    'password' => Hash::make('password123'),
                                    'role' => 'jugador',
                                    'gamertag' => "Cap_" . Str::slug($nombre),
                                    'status' => 'activo',
                                ]);
                                $id_capitan = $newCap->id;
                            }
                        }

                        // Insertar el equipo preservando el ID original
                        DB::table('equipos')->insert([
                            'id' => $id,
                            'id_capitan' => $id_capitan,
                            'nombre' => $nombre,
                            'slug' => $slug,
                            'abreviatura' => substr($abreviatura, 0, 10),
                            'descripcion' => $descripcion ?: "Escuadra oficial compitiendo en el circuito de RaconPro.",
                            'logo' => $logo,
                            'banner' => 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=400&fit=crop',
                            'plataforma' => 'crossplay',
                            'club_id_ea' => $clubId,
                            'estado' => true,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);

                        // Vincular el equipo a una organización y registrar su capitán
                        if ($org) {
                            OrganizacionEquipoUsuario::create([
                                'organizacion_id' => $org->id,
                                'equipo_id' => $id,
                                'user_id' => $id_capitan,
                                'dorsal' => '10',
                                'posicion_bloque' => 'MCO',
                                'estado_fichaje' => 'activo',
                                'fecha_vinculacion' => now(),
                            ]);

                            // Inscribir este equipo en la competencia correspondiente
                            if (!$comp) {
                                $orgComps = $competencias->filter(function($c) use ($org) {
                                    return $c->temporada->organizacion_id === $org->id;
                                });
                                if ($orgComps->isNotEmpty()) {
                                    $comp = $orgComps->first();
                                }
                            }

                            if ($comp) {
                                DB::table('competencia_equipo')->insertOrIgnore([
                                    'competencia_id' => $comp->id,
                                    'equipo_id' => $id,
                                    'estado_inscripcion' => 'aprobado',
                                    'created_at' => now(),
                                    'updated_at' => now(),
                                ]);
                            }

                            // Asignar entre 10 y 14 jugadores aleatorios a este equipo para simular un roster completo
                            $rosterPlayers = User::where('role', 'jugador')
                                ->where('id', '>=', 944) // Solo usar usuarios reales importados
                                ->where('id', '!=', $id_capitan)
                                ->whereNotIn('id', $allCaptainsIds) // No usar capitanes de otros equipos reales como jugadores de roster
                                ->whereNotExists(function($q) use ($org) {
                                    $q->select(DB::raw(1))
                                        ->from('organizacion_equipo_usuario')
                                        ->whereRaw('organizacion_equipo_usuario.user_id = users.id')
                                        ->where('organizacion_equipo_usuario.estado_fichaje', 'activo');
                                })
                                ->inRandomOrder()
                                ->take(rand(10, 14))
                                ->get();

                            $posiciones = ['POR', 'DFC', 'DFI', 'DFD', 'MC', 'MCO', 'MD', 'MI', 'DEL'];

                            foreach ($rosterPlayers as $player) {
                                OrganizacionEquipoUsuario::create([
                                    'organizacion_id' => $org->id,
                                    'equipo_id' => $id,
                                    'user_id' => $player->id,
                                    'dorsal' => (string)rand(1, 99),
                                    'posicion_bloque' => $posiciones[rand(0, 8)],
                                    'estado_fichaje' => 'activo',
                                    'fecha_vinculacion' => now(),
                                ]);
                            }
                        }

                        $equiposCount++;
                    }
                }
                DB::commit();
                $this->command->info("Se importaron {$equiposCount} equipos reales exitosamente y se configuraron sus rosters.");
            } catch (\Exception $e) {
                DB::rollBack();
                $this->command->error("Error al importar equipos: " . $e->getMessage());
                fclose($handle);
                return;
            }
            fclose($handle);
        }
    }

    /**
     * Busca la división (competición) correspondiente para un equipo usando su nombre
     */
    private function findTeamDivision($name)
    {
        $elite = [
            'VIKINGS ESPORTS', 'CERRIYORK ESPORTS', 'ADNDROIDES ESP', 'FC CHANCHITOS',
            'GRIZZLEY GAMING', 'BLAUGRANAS ESPORTS', 'ORIENTE ESPORTS', 'A JUGAR FC',
            'TOXICOS AC', 'UM GAMING', 'CURICO ESPORTS', 'NIUPI ESPORTS', 'INFAMES ESP',
            'SL GAMING', 'TOROS ESP', 'REAL BALLESTERO PL'
        ];

        $ascenso = [
            'RR ESPORTS', 'RANGERS ESPORTS', 'ANTIFUTBOL FC', 'AUTOFAZUL FC',
            'HORIZON ESPORTS', 'GEN ESPORTS', 'SAN LORENZO ESP', 'GOLDEN CROSS FC',
            'NAVAL ESP', 'AURINEGRO ESPORTS', 'ALLBLACKS', 'RESISTENCIA SPS',
            'SUBVERSIVOS ESP', 'COBRESAL ESPORTS', 'AUDAX ESPORTS', 'PAPAYEROS RISING'
        ];

        $anfa = [
            'BLACK LYON FC', 'YAKUZA ESP', 'LOS DEVOTOS ESPORTS', 'INDICIPLINA FC',
            'SAN FELIPE FC', 'BSK ESPORTS', 'RED DEVILS SP', 'PISKOLA ESP',
            'BSG ESPORTS', 'T-ALBO ESPORTS', 'RACCOON REAPERS ESPORTS', 'LA ROJITA ESPORTS',
            'TOMAMENSERIOY10MAS', 'WANDERERS ESP', 'CONCEPCION CITY CLUB', 'IRBAN KNIGHT ESPORTS',
            'VORANIX ESP', 'THE BLACKSHEEP FC'
        ];

        $prospect = [
            'RECHAZADOS FC', 'SANGRE NUEVA', 'DEPORTES PUERTO MONTT', 'NEW PIRATS FC',
            'IMPACTO UNITED', 'TROPICONCE CF', 'LOSCACASFC', 'BOCASECA ESP',
            'LA PEQUEÑA ITALIA', 'AKATSUKI FC', 'VETERANS CHILE', 'RESET ESPORTS',
            'BLUELOCK ESPORTS', 'PCERDO ESP', 'LEGUAYORK ESP', 'ASADO Y FASITO FC',
            'ACOPLE FC', 'CD SAIYANS'
        ];

        $searchNormalized = $this->normalizeName($name);

        // 1. Intentar coincidencia exacta normalizada
        foreach (['elite' => $elite, 'ascenso' => $ascenso, 'anfa' => $anfa, 'prospect' => $prospect] as $div => $list) {
            foreach ($list as $item) {
                if ($this->normalizeName($item) === $searchNormalized) {
                    return $div;
                }
            }
        }

        // 2. Fallback Levenshtein para tolerancia a typos
        $bestDiv = null;
        $bestDist = 999;
        foreach (['elite' => $elite, 'ascenso' => $ascenso, 'anfa' => $anfa, 'prospect' => $prospect] as $div => $list) {
            foreach ($list as $item) {
                $dist = levenshtein($searchNormalized, $this->normalizeName($item));
                if ($dist < $bestDist && $dist <= 3) {
                    $bestDist = $dist;
                    $bestDiv = $div;
                }
            }
        }

        return $bestDiv;
    }

    /**
     * Normaliza los nombres para comparación difusa
     */
    private function normalizeName($name)
    {
        $normalized = strtolower($name);
        $normalized = str_replace(['á', 'é', 'í', 'ó', 'ú', 'ñ'], ['a', 'e', 'i', 'o', 'u', 'n'], $normalized);
        $normalized = preg_replace('/[^a-z0-9]/', '', $normalized);
        $normalized = str_replace(['esports', 'esport', 'esp', 'fc', 'cf', 'club'], '', $normalized);
        return trim($normalized);
    }

    /**
     * Helper para parsear una línea de valores SQL
     */
    private function parseSqlValuesLine($line)
    {
        $trimmed = trim($line);
        
        // Ignorar líneas que no son registros de valores
        if (!str_starts_with($trimmed, '(')) {
            return null;
        }

        // Buscar el último paréntesis de cierre de la tupla
        $lastParenthesis = strrpos($trimmed, ')');
        if ($lastParenthesis !== false) {
            $content = substr($trimmed, 1, $lastParenthesis - 1);
            
            // Usar str_getcsv para resolver strings con comas y comillas de forma segura
            $values = str_getcsv($content, ',', "'");
            
            return array_map(function($val) {
                $val = trim($val);
                if ($val === 'NULL' || $val === 'null' || $val === '') {
                    return null;
                }
                // Limpiar escapes de comillas simples si quedaron del volcado SQL
                if (str_starts_with($val, "\\'") && str_ends_with($val, "\\'")) {
                    $val = substr($val, 2, -2);
                }
                return stripslashes($val);
            }, $values);
        }
        
        return null;
    }
}
