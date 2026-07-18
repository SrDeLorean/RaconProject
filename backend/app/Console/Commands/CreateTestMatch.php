<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Equipo;
use App\Models\Organizacion;
use App\Models\Competencia;
use App\Models\Temporada;
use App\Models\Partido;
use App\Models\CompetenciaEquipo;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;

class CreateTestMatch extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:create-match';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create test data (Teams, Players, Match) for Vision AI testing';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Iniciando creacion de datos de prueba...");

        // Owner de la organizacion
        $owner = User::firstOrCreate(
            ['email' => 'admin_test_ia@test.com'],
            [
                'name' => 'Admin Test IA',
                'gamertag' => 'AdminTestIA',
                'password' => Hash::make('password'),
                'rol' => 'administrador'
            ]
        );

        $capitanVisitante = User::firstOrCreate(
            ['email' => 'capitan_visit_ia@test.com'],
            [
                'name' => 'Capitan Visitante',
                'gamertag' => 'CapVisitante',
                'password' => Hash::make('password'),
                'rol' => 'jugador'
            ]
        );

        // 1. Organizacion (por defecto)
        $orgName = 'Organizacion Test IA';
        $org = Organizacion::firstOrCreate(
            ['nombre' => $orgName],
            [
                'slug' => Str::slug($orgName) . '-' . rand(10,99),
                'descripcion' => 'Organizacion para pruebas',
                'owner_id' => $owner->id
            ]
        );

        // 2. Temporada (por defecto)
        $temporadaName = 'Temporada Test IA';
        $temporada = Temporada::firstOrCreate(
            ['nombre' => $temporadaName],
            [
                'slug' => Str::slug($temporadaName) . '-' . rand(10,99),
                'organizacion_id' => $org->id,
                'fecha_inicio' => Carbon::now(), 
                'fecha_fin' => Carbon::now()->addMonths(2)
            ]
        );

        // 3. Crear Equipos
        $equipoLocalName = 'Successors';
        $equipoLocal = Equipo::firstOrCreate(
            ['nombre' => $equipoLocalName],
            [
                'slug' => Str::slug($equipoLocalName) . '-' . rand(10,99),
                'abreviatura' => 'SUC', 
                'organizacion_id' => $org->id,
                'id_capitan' => $owner->id
            ]
        );

        $equipoVisitanteName = 'Acople FC';
        $equipoVisitante = Equipo::firstOrCreate(
            ['nombre' => $equipoVisitanteName],
            [
                'slug' => Str::slug($equipoVisitanteName) . '-' . rand(10,99),
                'abreviatura' => 'ACO', 
                'organizacion_id' => $org->id,
                'id_capitan' => $capitanVisitante->id
            ]
        );

        $this->info("Equipos creados: {$equipoLocal->nombre} vs {$equipoVisitante->nombre}");

        // 4. Crear Jugadores Successors
        $jugadoresSuccessors = ['GATOSINBOTAS__', 'Bambin0__', 'Luka-M9', 'xHooD-', 'pablinho_0987_', 'f-u-l-i-v', 'Ramsesx_x', 'd11z_'];
        foreach ($jugadoresSuccessors as $gamertag) {
            $email = strtolower($gamertag) . '@test.com';
            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $gamertag,
                    'gamertag' => $gamertag,
                    'password' => Hash::make('password'),
                    'rol' => 'jugador'
                ]
            );

            // Insert into equipo_jugador
            $exists = DB::table('equipo_jugador')
                        ->where('equipo_id', $equipoLocal->id)
                        ->where('user_id', $user->id)
                        ->exists();
            if (!$exists) {
                DB::table('equipo_jugador')->insert([
                    'equipo_id' => $equipoLocal->id,
                    'user_id' => $user->id,
                    'estado_fichaje' => 'aprobado'
                ]);
            }
        }

        // 5. Crear Jugadores Acople FC
        $jugadoresAcople = ['Jugador_ACO_1', 'Jugador_ACO_2', 'Jugador_ACO_3'];
        foreach ($jugadoresAcople as $gamertag) {
            $email = strtolower($gamertag) . '@test.com';
            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $gamertag,
                    'gamertag' => $gamertag,
                    'password' => Hash::make('password'),
                    'rol' => 'jugador'
                ]
            );

            $exists = DB::table('equipo_jugador')
                        ->where('equipo_id', $equipoVisitante->id)
                        ->where('user_id', $user->id)
                        ->exists();
            if (!$exists) {
                DB::table('equipo_jugador')->insert([
                    'equipo_id' => $equipoVisitante->id,
                    'user_id' => $user->id,
                    'estado_fichaje' => 'aprobado'
                ]);
            }
        }

        $this->info("Jugadores asignados.");

        // 6. Crear Competencia
        $competenciaName = 'Torneo de Prueba IA';
        $competencia = Competencia::firstOrCreate(
            ['nombre' => $competenciaName],
            [
                'slug' => Str::slug($competenciaName) . '-' . rand(10,99),
                'organizacion_id' => $org->id,
                'temporada_id' => $temporada->id,
                'formato' => 'liga',
                'estado' => 'en_curso'
            ]
        );

        // Inscribir equipos
        CompetenciaEquipo::firstOrCreate([
            'competencia_id' => $competencia->id,
            'equipo_id' => $equipoLocal->id
        ]);

        CompetenciaEquipo::firstOrCreate([
            'competencia_id' => $competencia->id,
            'equipo_id' => $equipoVisitante->id
        ]);

        // 7. Crear Partido
        $partido = Partido::firstOrCreate(
            [
                'competencia_id' => $competencia->id,
                'equipo_local_id' => $equipoLocal->id,
                'equipo_visitante_id' => $equipoVisitante->id,
                'jornada' => 'Fecha 1'
            ],
            [
                'fecha' => Carbon::now()->toDateString(),
                'hora' => '22:00:00'
            ]
        );

        $this->info("Partido creado con ID: {$partido->id}. ¡Listo para probar!");
    }
}
