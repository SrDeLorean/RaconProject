<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('id_ea')->nullable(); // Nuevo campo
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');

            // Enum definido según tu requerimiento
            $table->enum('role', ['jugador', 'organizador', 'administrador'])->default('jugador');

            // Campos de perfil
            $table->string('foto')->default('images/users/default-user.png');
            $table->string('nacionalidad')->nullable();
            $table->string('posicion')->nullable();
            $table->string('fecha_nacimiento')->nullable();
            $table->string('altura')->nullable();
            $table->string('peso')->nullable();
            $table->string('telefono')->nullable();

            // Redes Sociales
            $table->string('instagram')->nullable();
            $table->string('facebook')->nullable();
            $table->string('twitch')->nullable();
            $table->string('youtube')->nullable();
            $table->string('tiktok')->nullable();

            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes(); // Habilita deleted_at
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
