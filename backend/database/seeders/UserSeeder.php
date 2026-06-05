<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Super Admin
        User::create([
            'name'             => 'Super Admin',
            'email'            => 'admin@torneosprofc.com',
            'password'         => Hash::make('password123'),
            'role'             => 'administrador',
            'status'           => 'activo',
            'gamertag'         => 'AdminMaster',
            'id_ea'            => 'EA_SUPER_001',
            'foto'             => 'images/users/default-user.png',
        ]);

        // 2. Organizador
        User::create([
            'name'             => 'Organizador Master',
            'email'            => 'organizador@torneosprofc.com',
            'password'         => Hash::make('password123'),
            'role'             => 'organizador',
            'status'           => 'activo',
            'gamertag'         => 'OrgPro',
            'id_ea'            => 'EA_ORG_001',
        ]);

        // 3. Jugador con datos completos
        User::create([
            'name'             => 'Carlos Silva',
            'email'            => 'capitan@torneosprofc.com',
            'password'         => Hash::make('password123'),
            'role'             => 'jugador',
            'status'           => 'activo',
            'gamertag'         => 'CapitanFC',
            'id_ea'            => 'EA_JUG_001',
            'plataforma'       => 'ps5',
            'posicion'         => 'MCO',
            'nacionalidad'     => 'Chile',
            'fecha_nacimiento' => '1998-05-15',
            'altura'           => 178,
            'peso'             => 72,
        ]);

        // 4. Jugador Pro
        User::create([
            'name'             => 'Jugador Pro',
            'email'            => 'jugador@torneosprofc.com',
            'password'         => Hash::make('password123'),
            'role'             => 'jugador',
            'status'           => 'activo',
            'gamertag'         => 'ProPlayer99',
            'id_ea'            => 'EA_JUG_002',
            'plataforma'       => 'crossplay',
            'posicion'         => 'ST',
            'nacionalidad'     => 'Argentina',
            'fecha_nacimiento' => '2000-10-20',
            'altura'           => 185,
            'peso'             => 80,
        ]);

        // 5. Jugador Suspendido (Para probar que el filtro de estados funcione)
        User::create([
            'name'             => 'Jugador Tramposo',
            'email'            => 'tramposo@torneosprofc.com',
            'password'         => Hash::make('password123'),
            'role'             => 'jugador',
            'status'           => 'suspendido',
            'gamertag'         => 'BanMe123',
            'id_ea'            => 'EA_BAN_001',
            'plataforma'       => 'pc',
        ]);
    }
}
