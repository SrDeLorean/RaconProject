<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Arr; // Necesario para elegir roles al azar
use App\Models\User;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // --- 1. USUARIOS MANUALES (Tus registros definidos) ---

        User::create([
            'name'             => 'Super Admin',
            'email'            => 'admin@racon.com',
            'password'         => Hash::make('password123'),
            'role'             => 'administrador',
            'id_ea'            => 'EA_SUPER_001',
            'foto'             => 'images/users/default-user.png',
        ]);

        User::create([
            'name'             => 'Organizador Master',
            'email'            => 'organizador@racon.com',
            'password'         => Hash::make('password123'),
            'role'             => 'organizador', // Asegurado con el nuevo enum
            'id_ea'            => 'EA_ORG_001',
        ]);

        User::create([
            'name'             => 'Capitán FC',
            'email'            => 'capitan@racon.com',
            'password'         => Hash::make('password123'),
            'role'             => 'jugador',
            'posicion'         => 'MCO',
            'nacionalidad'     => 'Chile',
        ]);

        User::create([
            'name'             => 'Jugador Pro',
            'email'            => 'jugador@racon.com',
            'password'         => Hash::make('password123'),
            'role'             => 'jugador',
            'posicion'         => 'ST',
            'nacionalidad'     => 'Argentina',
        ]);

    }
}
