<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Temporada;
use App\Models\Organizacion;
use App\Models\CompetenciaUt;
use App\Models\EquipoUt;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompetenciaUtTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $organizador;
    protected $temporada;
    protected $competencia;

    protected function setUp(): void
    {
        parent::setUp();

        // Crear jugador de prueba
        $this->user = User::create([
            'name' => 'Jugador Test',
            'email' => 'jugadortest@torneosprofc.com',
            'password' => bcrypt('password123'),
            'role' => 'jugador',
            'status' => 'activo',
            'gamertag' => 'GamerTest',
            'id_ea' => '999999',
        ]);

        // Crear organizador de prueba
        $this->organizador = User::create([
            'name' => 'Organizador Test',
            'email' => 'organizadortest@torneosprofc.com',
            'password' => bcrypt('password123'),
            'role' => 'organizador',
            'status' => 'activo',
            'gamertag' => 'OrgTest',
            'id_ea' => '999998',
        ]);

        // Crear organización y temporada vinculada
        $organizacion = Organizacion::create([
            'owner_id' => $this->organizador->id,
            'nombre' => 'Organización Test',
            'slug' => 'organizacion-test',
            'estado' => 'activo',
        ]);

        $this->temporada = Temporada::create([
            'organizacion_id' => $organizacion->id,
            'nombre' => 'Temporada Test',
            'slug' => 'temporada-test',
            'fecha_inicio' => '2026-01-01',
            'fecha_fin' => '2026-12-31',
            'activa' => true,
        ]);

        // Crear competencia UT en estado de inscripciones para poder enrolar
        $this->competencia = CompetenciaUt::create([
            'temporada_id' => $this->temporada->id,
            'nombre' => 'Copa Test 1vs1 UT',
            'slug' => 'copa-test-1vs1-ut',
            'tipo' => '1vs1',
            'formato' => 'liga',
            'plataforma' => 'crossplay',
            'estado' => 'inscripciones',
            'max_participantes' => 8,
            'es_publico' => true,
        ]);
    }

    public function test_can_list_competencias_ut()
    {
        $response = $this->getJson('/api/competencias-ut');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data',
                     'current_page',
                     'last_page'
                 ]);
    }

    public function test_can_show_competencia_ut()
    {
        $response = $this->getJson("/api/competencias-ut/{$this->competencia->id}");

        $response->assertStatus(200)
                 ->assertJsonPath('data.nombre', 'Copa Test 1vs1 UT');
    }

    public function test_player_can_enroll_1v1()
    {
        // Inscribirse como jugador autenticado
        $response = $this->actingAs($this->user)
            ->postJson("/api/competencias-ut/{$this->competencia->id}/inscribir", [
                'nombre_equipo' => 'Mi Equipo UT',
                'club_id_ea' => '12345'
            ]);

        $response->assertStatus(201)
                 ->assertJsonPath('success', true);

        // Verificar que el equipo UT se creó correctamente
        $this->assertDatabaseHas('equipos_ut', [
            'nombre' => 'Mi Equipo UT',
            'id_capitan' => $this->user->id,
            'club_id_ea' => '12345'
        ]);

        // Verificar la vinculación pivot con la competencia
        $equipo = EquipoUt::where('id_capitan', $this->user->id)->first();
        $this->assertDatabaseHas('competencia_equipo_ut', [
            'competencia_ut_id' => $this->competencia->id,
            'equipo_ut_id' => $equipo->id,
            'estado_inscripcion' => 'aprobado'
        ]);
    }

    public function test_organizer_can_update_and_delete_inscription()
    {
        // 1. Inscribir previamente un equipo en estado pendiente
        $equipo = EquipoUt::create([
            'nombre' => 'Equipo Inscripto',
            'id_capitan' => $this->user->id,
            'plataforma' => 'crossplay',
        ]);
        $this->competencia->equipos()->attach($equipo->id, ['estado_inscripcion' => 'pendiente']);

        // 2. Aprobar inscripción como organizador
        $response = $this->actingAs($this->organizador)
            ->putJson("/api/inscripciones-ut/{$equipo->id}", [
                'estado_inscripcion' => 'aprobado',
                'competencia_ut_id' => $this->competencia->id
            ]);

        $response->assertStatus(200)
                 ->assertJsonPath('success', true);

        $this->assertDatabaseHas('competencia_equipo_ut', [
            'competencia_ut_id' => $this->competencia->id,
            'equipo_ut_id' => $equipo->id,
            'estado_inscripcion' => 'aprobado'
        ]);

        // 3. Eliminar (dar de baja) inscripción como organizador
        $responseDelete = $this->actingAs($this->organizador)
            ->deleteJson("/api/inscripciones-ut/{$equipo->id}");

        $responseDelete->assertStatus(204);

        // Verificar que la relación se eliminó de la base de datos
        $this->assertDatabaseMissing('competencia_equipo_ut', [
            'competencia_ut_id' => $this->competencia->id,
            'equipo_ut_id' => $equipo->id
        ]);
    }

    public function test_can_filter_players_by_ut_tipo()
    {
        // 1. Crear equipo UT 1vs1 para el jugador test
        $equipo = EquipoUt::create([
            'nombre' => 'Test Team 1v1',
            'id_capitan' => $this->user->id,
            'plataforma' => 'crossplay',
        ]);
        $this->competencia->equipos()->attach($equipo->id, ['estado_inscripcion' => 'aprobado']);

        // 2. Buscar usuarios con tipo_ut = '1vs1'
        $response1v1 = $this->getJson('/api/users?tipo_ut=1vs1');
        $response1v1->assertStatus(200);
        
        $data1v1 = $response1v1->json('data');
        $this->assertNotEmpty($data1v1);
        $this->assertEquals($this->user->id, $data1v1[0]['id']);

        // 3. Buscar usuarios con tipo_ut = '2vs2'
        $response2v2 = $this->getJson('/api/users?tipo_ut=2vs2');
        $response2v2->assertStatus(200);
        
        $data2v2 = $response2v2->json('data');
        $this->assertEmpty($data2v2);
    }
}
