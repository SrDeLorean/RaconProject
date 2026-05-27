<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            // 1. Identificadores Base
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');

            // 2. Roles y Estados (Sincronizado con el Frontend)
            $table->enum('role', ['jugador', 'organizador', 'administrador'])->default('jugador');
            $table->enum('status', ['activo', 'inactivo', 'suspendido'])->default('activo'); // 🔥 NUEVO

            // 3. Identidades Gaming (E-Sports FC26)
            $table->string('gamertag')->nullable()->unique(); // 🔥 NUEVO: Nombre visible en torneos
            $table->string('id_ea')->nullable()->unique(); // Mejorado: Debe ser único
            $table->enum('plataforma', ['ps5', 'xbox', 'pc', 'crossplay'])->default('crossplay'); // 🔥 NUEVO

            // 4. Perfil Físico y Demográfico
            $table->string('foto')->default('images/users/default-user.png');
            $table->string('nacionalidad')->nullable();
            $table->string('posicion')->nullable(); // Ej: DFC, MC, DC
            $table->date('fecha_nacimiento')->nullable(); // 🔥 CORREGIDO: Antes era string
            $table->unsignedSmallInteger('altura')->nullable(); // 🔥 CORREGIDO: En centímetros (ej: 180)
            $table->unsignedSmallInteger('peso')->nullable(); // 🔥 CORREGIDO: En kilogramos (ej: 75)
            $table->string('telefono')->nullable();
            $table->text('biografia')->nullable(); // 🔥 NUEVO: Para que el jugador se describa

            // 5. Redes Sociales y Streaming
            $table->string('instagram')->nullable();
            $table->string('facebook')->nullable();
            $table->string('twitch')->nullable();
            $table->string('youtube')->nullable();
            $table->string('tiktok')->nullable();

            // 6. Trazabilidad
            $table->timestamp('last_login_at')->nullable(); // 🔥 NUEVO: Saber si un jugador está ausente
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes(); // Habilita deleted_at para suspensiones permanentes
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
