<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class TestUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Admin
        User::updateOrCreate(
            ['email' => 'admin@racon.com'],
            [
                'name' => 'Admin Racon',
                'password' => Hash::make('password123'),
                'role' => 'administrador',
                'status' => 'activo',
                'gamertag' => 'AdminRacon',
                'id_ea' => 'EA_ADMIN_RACON',
            ]
        );

        // 2. Organizador
        User::updateOrCreate(
            ['email' => 'organizador@racon.com'],
            [
                'name' => 'Organizador Racon',
                'password' => Hash::make('password123'),
                'role' => 'organizador',
                'status' => 'activo',
                'gamertag' => 'OrgRacon',
                'id_ea' => 'EA_ORG_RACON',
            ]
        );

        // 3. Jugador 1
        User::updateOrCreate(
            ['email' => 'jugador1@racon.com'],
            [
                'name' => 'Jugador Uno',
                'password' => Hash::make('password123'),
                'role' => 'jugador',
                'status' => 'activo',
                'gamertag' => 'JugadorUno',
                'id_ea' => 'EA_JUG_UNO',
                'plataforma' => 'ps5',
                'posicion' => 'DEL',
                'nacionalidad' => 'Chile',
            ]
        );

        // 4. Jugador 2
        User::updateOrCreate(
            ['email' => 'jugador2@racon.com'],
            [
                'name' => 'Jugador Dos',
                'password' => Hash::make('password123'),
                'role' => 'jugador',
                'status' => 'activo',
                'gamertag' => 'JugadorDos',
                'id_ea' => 'EA_JUG_DOS',
                'plataforma' => 'xbox',
                'posicion' => 'MCO',
                'nacionalidad' => 'Argentina',
            ]
        );

        // 5. Jugador 3
        User::updateOrCreate(
            ['email' => 'jugador3@racon.com'],
            [
                'name' => 'Jugador Tres',
                'password' => Hash::make('password123'),
                'role' => 'jugador',
                'status' => 'activo',
                'gamertag' => 'JugadorTres',
                'id_ea' => 'EA_JUG_TRES',
                'plataforma' => 'pc',
                'posicion' => 'DFC',
                'nacionalidad' => 'Colombia',
            ]
        );

        // 6. Jugador 4
        User::updateOrCreate(
            ['email' => 'jugador4@racon.com'],
            [
                'name' => 'Jugador Cuatro',
                'password' => Hash::make('password123'),
                'role' => 'jugador',
                'status' => 'activo',
                'gamertag' => 'JugadorCuatro',
                'id_ea' => 'EA_JUG_CUATRO',
                'plataforma' => 'crossplay',
                'posicion' => 'PO',
                'nacionalidad' => 'México',
            ]
        );
    }
}
