<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Equipo;
use App\Models\Organizacion;
use App\Models\Temporada;
use App\Models\Competencia;
use App\Models\OrganizacionEquipoUsuario;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AmcDatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $sqlPath = base_path('comunid6_comunidad_amc (4).sql');

        if (!file_exists($sqlPath)) {
            $this->command->error("No se encontró el archivo comunid6_comunidad_amc (4).sql en " . $sqlPath);
            return;
        }

        $this->command->info('Iniciando importación real de Comunidad AMC...');

        // 1. Limpiar base de datos para evitar colisiones de llaves primarias
        $this->command->info('Limpiando tablas existentes para importación limpia...');
        
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('estadisticas_jugadores_logs')->truncate();
        DB::table('estadisticas_jugadores')->truncate();
        DB::table('estadisticas_equipos')->truncate();
        DB::table('partidos')->truncate();
        DB::table('competencia_equipo')->truncate();
        DB::table('organizacion_equipo_usuario')->truncate();
        DB::table('competencias')->truncate();
        DB::table('temporadas')->truncate();
        DB::table('organizaciones')->truncate();
        DB::table('equipos')->truncate();
        DB::table('users')->truncate();
        DB::table('solicitudes_fichaje')->truncate();
        DB::table('equipo_jugador')->truncate();
        DB::table('competencia_equipo_usuario')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // 2. Crear la Organización "Comunidad AMC" y el Administrador
        $admin = User::create([
            'name' => 'Administrador General',
            'email' => 'admin@torneosprofc.com',
            'password' => Hash::make('password123'),
            'role' => 'administrador',
            'status' => 'activo',
            'gamertag' => 'AdminMaster',
            'id_ea' => '100000001',
        ]);

        $comunidadAMC = Organizacion::create([
            'owner_id' => $admin->id,
            'nombre' => 'Comunidad AMC',
            'slug' => 'comunidad-amc',
            'descripcion' => 'Organización oficial de Comunidad AMC para torneos virtuales Pro Clubs.',
            'logo' => 'https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=200&h=200&fit=crop',
            'banner' => 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=400&fit=crop',
            'estado' => 'activo',
            'color_hex' => '#3b82f6'
        ]);

        // 3. Cargar todo el archivo en memoria agrupado por tabla para ordenamiento lógico
        $this->command->info('Agrupando volcado SQL en memoria por tabla...');
        
        $handle = fopen($sqlPath, "r");
        if (!$handle) {
            $this->command->error("Error al abrir el archivo SQL.");
            return;
        }

        $currentTable = null;
        $tableRows = [];

        while (($line = fgets($handle)) !== false) {
            $trimmed = trim($line);

            if (str_starts_with($trimmed, 'INSERT INTO `')) {
                preg_match('/INSERT INTO `([^`]+)`/', $trimmed, $matches);
                $currentTable = $matches[1] ?? null;
                continue;
            }

            if ($currentTable && str_starts_with($trimmed, '(')) {
                $row = $this->parseSqlValuesLine($line);
                if ($row) {
                    $tableRows[$currentTable][] = $row;
                }
            }
        }
        fclose($handle);

        // 4. Ejecutar la importación en el ORDEN LÓGICO exacto de dependencias
        $logicalOrder = [
            'users',
            'equipos',
            'temporadas',
            'temporada_competencias',
            'temporada_equipos',
            'temporada_plantillas',
            'calendarios',
            'estadistica_jugadores',
            'estadistica_equipos',
            'estadistica_jugador_logs',
        ];

        $batchSize = 250;
        $competenciasMap = [];
        $temporadaEquiposMap = [];

        DB::beginTransaction();
        try {
            foreach ($logicalOrder as $table) {
                if (!isset($tableRows[$table]) || empty($tableRows[$table])) {
                    continue;
                }

                $this->command->info("Procesando tabla: {$table} (" . count($tableRows[$table]) . " registros)...");
                
                $chunk = [];
                foreach ($tableRows[$table] as $row) {
                    $chunk[] = $row;
                    if (count($chunk) >= $batchSize) {
                        $this->insertBatch($table, $chunk, $comunidadAMC, $competenciasMap, $temporadaEquiposMap, $admin->id);
                        $chunk = [];
                    }
                }

                if (!empty($chunk)) {
                    $this->insertBatch($table, $chunk, $comunidadAMC, $competenciasMap, $temporadaEquiposMap, $admin->id);
                }
            }

            DB::commit();
            $this->command->info('¡Importación de datos reales de Comunidad AMC finalizada con éxito!');
        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error("Error en la importación: " . $e->getMessage() . " en la línea " . $e->getLine());
        }
    }

    /**
     * Inserta un lote de filas según la tabla de origen
     */
    private function insertBatch(
        string $table,
        array $rows,
        Organizacion $organizacion,
        array &$competenciasMap,
        array &$temporadaEquiposMap,
        int $adminId
    ): void {
        switch ($table) {
            case 'users':
                $passwordHash = Hash::make('password123');
                foreach ($rows as $row) {
                    if (count($row) >= 23) {
                        $id = (int)$row[0];
                        $name = $row[1];
                        $id_ea = $row[2];
                        $email = $row[3];
                        $role = $row[6];
                        $foto = $row[7] ?: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop';
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

                        if ($role === 'entrenador') $role = 'jugador';
                        if (!in_array($role, ['jugador', 'organizador', 'administrador'])) $role = 'jugador';

                        // Asegurar email único
                        if (empty($email) || DB::table('users')->where('email', $email)->exists()) {
                            $email = "user_{$id}_" . Str::random(4) . "@torneosprofc.com";
                        }

                        // Asegurar gamertag único
                        $gamertag = $id_ea ?: "Gamer_{$id}";
                        if (DB::table('users')->where('gamertag', $gamertag)->exists()) {
                            $gamertag = $gamertag . "_" . Str::random(3);
                        }

                        DB::table('users')->insertOrIgnore([
                            'id' => $id,
                            'name' => $name,
                            'email' => $email,
                            'password' => $passwordHash,
                            'email_verified_at' => now(),
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
                    }
                }
                break;

            case 'equipos':
                foreach ($rows as $row) {
                    if (count($row) >= 17) {
                        $id = (int)$row[0];
                        $nombre = $row[1];
                        $abreviatura = $row[2] ?: strtoupper(substr($nombre, 0, 3));
                        $descripcion = $row[3];
                        $clubId = $row[5];
                        $logo = $row[7] ?: 'default.png';
                        $id_usuario = $row[12] ? (int)$row[12] : null;

                        $slug = Str::slug($nombre);
                        if (DB::table('equipos')->where('slug', $slug)->exists()) {
                            $slug = $slug . "-" . $id;
                        }

                        // Validar si el usuario existe para ser capitán, sino asignar el admin
                        $id_capitan = $adminId;
                        if ($id_usuario && DB::table('users')->where('id', $id_usuario)->exists()) {
                            // Si ya es capitán de otro equipo, creamos un clon para evitar romper el unique constraint
                            if (DB::table('equipos')->where('id_capitan', $id_usuario)->exists()) {
                                $originalUser = DB::table('users')->where('id', $id_usuario)->first();
                                $clonedUserId = DB::table('users')->insertGetId([
                                    'name' => $originalUser->name . ' (Co-Cap)',
                                    'email' => 'cap_' . $id . '_' . Str::random(4) . '@torneosprofc.com',
                                    'password' => Hash::make('password123'),
                                    'role' => 'jugador',
                                    'status' => 'activo',
                                    'gamertag' => $originalUser->gamertag . '_cap',
                                    'created_at' => now(),
                                    'updated_at' => now(),
                                ]);
                                $id_capitan = $clonedUserId;
                            } else {
                                $id_capitan = $id_usuario;
                            }
                        } else {
                            // Crear un capitán ficticio si el ID no existe en users para que el equipo no falle en unique key
                            $clonedUserId = DB::table('users')->insertGetId([
                                'name' => 'Capitán ' . $nombre,
                                'email' => 'cap_' . $id . '_' . Str::random(4) . '@torneosprofc.com',
                                'password' => Hash::make('password123'),
                                'role' => 'jugador',
                                'status' => 'activo',
                                'gamertag' => 'cap_' . Str::slug($nombre),
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                            $id_capitan = $clonedUserId;
                        }

                        DB::table('equipos')->insertOrIgnore([
                            'id' => $id,
                            'id_capitan' => $id_capitan,
                            'nombre' => $nombre,
                            'slug' => $slug,
                            'abreviatura' => substr($abreviatura, 0, 10),
                            'descripcion' => $descripcion ?: "Club oficial Comunidad AMC.",
                            'logo' => $logo,
                            'banner' => 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=400&fit=crop',
                            'plataforma' => 'crossplay',
                            'club_id_ea' => $clubId,
                            'estado' => true,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);

                        // Vincular el capitán al roster de Comunidad AMC de forma inmediata
                        DB::table('organizacion_equipo_usuario')->insertOrIgnore([
                            'organizacion_id' => $organizacion->id,
                            'equipo_id' => $id,
                            'user_id' => $id_capitan,
                            'dorsal' => '10',
                            'posicion_bloque' => 'MCO',
                            'estado_fichaje' => 'activo',
                            'fecha_vinculacion' => now(),
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
                break;

            case 'temporadas':
                foreach ($rows as $row) {
                    $id = (int)$row[0];
                    $nombre = $row[1];

                    DB::table('temporadas')->insertOrIgnore([
                        'id' => $id,
                        'organizacion_id' => $organizacion->id,
                        'nombre' => $nombre,
                        'slug' => Str::slug($nombre),
                        'fecha_inicio' => '2026-01-01',
                        'fecha_fin' => '2026-12-31',
                        'activa' => true,
                        'estado_mercado' => 'abierto',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
                break;

            case 'temporada_competencias':
                foreach ($rows as $row) {
                    if (count($row) >= 8) {
                        $id = (int)$row[0];
                        $nombre = $row[1];
                        $id_temporada = (int)$row[2];
                        $formato = $row[4] ?: 'liga';
                        $fecha_inicio = $row[5] ?: '2026-05-24';

                        DB::table('competencias')->insertOrIgnore([
                            'id' => $id,
                            'temporada_id' => $id_temporada,
                            'nombre' => $nombre,
                            'slug' => Str::slug($nombre . " " . $id),
                            'formato' => $formato,
                            'plataforma' => 'crossplay',
                            'max_participantes' => 20,
                            'es_publico' => true,
                            'estado' => 'activo',
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);

                        $competenciasMap[$id] = $id;
                    }
                }
                break;

            case 'temporada_equipos':
                foreach ($rows as $row) {
                    if (count($row) >= 3) {
                        $id = (int)$row[0];
                        $id_temporada_competencia = (int)$row[1];
                        $id_equipo = (int)$row[2];

                        $competenciaId = $competenciasMap[$id_temporada_competencia] ?? null;

                        if ($competenciaId) {
                            DB::table('competencia_equipo')->insertOrIgnore([
                                'competencia_id' => $competenciaId,
                                'equipo_id' => $id_equipo,
                                'estado_inscripcion' => 'aprobado',
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);

                            $temporadaEquiposMap[$id] = [
                                'equipo_id' => $id_equipo,
                                'competencia_id' => $competenciaId
                            ];
                        }
                    }
                }
                break;

            case 'temporada_plantillas':
                foreach ($rows as $row) {
                    if (count($row) >= 6) {
                        $id_temporada_equipo = (int)$row[1];
                        $id_jugador = (int)$row[2];
                        $posicion = $row[4] ?: 'Por definir';
                        $numero = (int)$row[5];

                        $mapping = $temporadaEquiposMap[$id_temporada_equipo] ?? null;

                        if ($mapping) {
                            $equipoId = $mapping['equipo_id'];

                            // Insertar en roster (organizacion_equipo_usuario)
                            DB::table('organizacion_equipo_usuario')->insertOrIgnore([
                                'organizacion_id' => $organizacion->id,
                                'equipo_id' => $equipoId,
                                'user_id' => $id_jugador,
                                'dorsal' => (string)$numero,
                                'posicion_bloque' => $posicion === 'Por definir' ? 'MC' : $posicion,
                                'estado_fichaje' => 'activo',
                                'fecha_vinculacion' => now(),
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        }
                    }
                }
                break;

            case 'calendarios':
                foreach ($rows as $row) {
                    if (count($row) >= 9) {
                        $id = (int)$row[0];
                        $id_temporada_competencia = (int)$row[1];
                        $id_equipo_local = (int)$row[2];
                        $id_equipo_visitante = (int)$row[3];
                        $goles_local = $row[4];
                        $goles_visitante = $row[5];
                        $fecha = $row[6];
                        $hora = $row[7];
                        $jornada = $row[8];

                        $competenciaId = $competenciasMap[$id_temporada_competencia] ?? null;

                        if ($competenciaId) {
                            DB::table('partidos')->insertOrIgnore([
                                'id' => $id,
                                'competencia_id' => $competenciaId,
                                'equipo_local_id' => $id_equipo_local,
                                'equipo_visitante_id' => $id_equipo_visitante,
                                'jornada' => $jornada,
                                'fecha' => $fecha,
                                'hora' => $hora,
                                'goles_local' => $goles_local !== null && $goles_local !== 'NULL' ? (int)$goles_local : null,
                                'goles_visitante' => $goles_visitante !== null && $goles_visitante !== 'NULL' ? (int)$goles_visitante : null,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        }
                    }
                }
                break;

            case 'estadistica_jugadores':
                foreach ($rows as $row) {
                    if (count($row) >= 28) {
                        $jugador_id = (int)$row[1];
                        $equipo_id = (int)$row[2];
                        $partido_id = (int)$row[3];
                        $competencia_id = (int)$row[4];
                        $posicion = $row[5];
                        $valoracion = (float)$row[7];
                        $goles = (int)$row[8];
                        $asistencias = (int)$row[9];
                        $tiros = (int)$row[10];
                        $rojas = (int)$row[11];
                        $mom = (bool)$row[12];
                        $precision_tiro = (float)$row[14];
                        $pases_intentados = (int)$row[15];
                        $pases_completados = (int)$row[16];
                        $precision_pases = (float)$row[17];
                        $entradas_intentadas = (int)$row[18];
                        $entradas_exitosas = (int)$row[19];
                        $tasa_exito_entradas = (float)$row[20];
                        $goles_recibidos = (int)$row[21];
                        $atajadas = (int)$row[22];

                        DB::table('estadisticas_jugadores')->insertOrIgnore([
                            'jugador_id' => $jugador_id,
                            'equipo_id' => $equipo_id,
                            'partido_id' => $partido_id,
                            'competencia_id' => $competencia_id,
                            'posicion' => $posicion,
                            'valoracion' => $valoracion,
                            'goles' => $goles,
                            'asistencias' => $asistencias,
                            'tiros' => $tiros,
                            'tarjetas_rojas' => $rojas,
                            'jugador_partido' => $mom,
                            'precision_tiro' => $precision_tiro,
                            'pases_intentados' => $pases_intentados,
                            'pases_completados' => $pases_completados,
                            'precision_pases' => $precision_pases,
                            'entradas_intentadas' => $entradas_intentadas,
                            'entradas_exitosas' => $entradas_exitosas,
                            'tasa_exito_entradas' => $tasa_exito_entradas,
                            'goles_recibidos' => $goles_recibidos,
                            'atajadas' => $atajadas,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
                break;

            case 'estadistica_equipos':
                foreach ($rows as $row) {
                    if (count($row) >= 28) {
                        $equipo_id = (int)$row[1];
                        $partido_id = (int)$row[2];
                        $competencia_id = (int)$row[3];
                        $goles_favor = (int)$row[4];
                        $goles_en_contra = (int)$row[5];
                        $asistencias = (int)$row[6];
                        $tiros = (int)$row[7];
                        $pases_intentados = (int)$row[8];
                        $pases_completados = (int)$row[9];
                        $precision_pases = (float)$row[10];
                        $entradas_intentadas = (int)$row[11];
                        $entradas_exitosas = (int)$row[12];
                        $tasa_exito_entradas = (float)$row[13];
                        $rojas = (int)$row[14];
                        $goles_contra_agregado = (int)$row[15];
                        $atajadas = (int)$row[16];
                        $valla_invicta_global = (bool)$row[23];
                        $valla_invicta_defensa = (bool)$row[24];
                        $valla_invicta_portero = (bool)$row[25];

                        DB::table('estadisticas_equipos')->insertOrIgnore([
                            'equipo_id' => $equipo_id,
                            'partido_id' => $partido_id,
                            'competencia_id' => $competencia_id,
                            'goles_favor' => $goles_favor,
                            'goles_en_contra' => $goles_en_contra,
                            'asistencias' => $asistencias,
                            'tiros' => $tiros,
                            'pases_intentados' => $pases_intentados,
                            'pases_completados' => $pases_completados,
                            'precision_pases' => $precision_pases,
                            'entradas_intentadas' => $entradas_intentadas,
                            'entradas_exitosas' => $entradas_exitosas,
                            'tasa_exito_entradas' => $tasa_exito_entradas,
                            'tarjetas_rojas' => $rojas,
                            'goles_contra_agregado' => $goles_contra_agregado,
                            'atajadas' => $atajadas,
                            'valla_invicta_global' => $valla_invicta_global,
                            'valla_invicta_defensa' => $valla_invicta_defensa,
                            'valla_invicta_portero' => $valla_invicta_portero,
                            'procesado' => true,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
                break;

            case 'estadistica_jugador_logs':
                foreach ($rows as $row) {
                    if (count($row) >= 10) {
                        $playername = $row[1];
                        $partido_id = (int)$row[2];
                        $jugador_id = $row[3] !== 'NULL' && $row[3] !== null ? (int)$row[3] : null;
                        $equipo_id = (int)$row[4];
                        $competencia_id = (int)$row[5];
                        $jugo = (bool)$row[6];
                        $procesado = (bool)$row[7];
                        $estado = $row[8];

                        DB::table('estadisticas_jugadores_logs')->insertOrIgnore([
                            'playername' => $playername,
                            'partido_id' => $partido_id,
                            'jugador_id' => $jugador_id,
                            'equipo_id' => $equipo_id,
                            'competencia_id' => $competencia_id,
                            'jugo' => $jugo,
                            'procesado' => $procesado,
                            'estado' => $estado ?: 'unknown',
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
                break;
        }
    }

    /**
     * Helper para parsear una línea de valores SQL
     */
    private function parseSqlValuesLine(string $line): ?array
    {
        $trimmed = trim($line);
        
        if (!str_starts_with($trimmed, '(')) {
            return null;
        }

        $lastParenthesis = strrpos($trimmed, ')');
        if ($lastParenthesis !== false) {
            $content = substr($trimmed, 1, $lastParenthesis - 1);
            $values = str_getcsv($content, ',', "'");
            
            return array_map(function($val) {
                $val = trim($val);
                if ($val === 'NULL' || $val === 'null' || $val === '') {
                    return null;
                }
                if (str_starts_with($val, "\\'") && str_ends_with($val, "\\'")) {
                    $val = substr($val, 2, -2);
                }
                return stripslashes($val);
            }, $values);
        }
        
        return null;
    }
}
