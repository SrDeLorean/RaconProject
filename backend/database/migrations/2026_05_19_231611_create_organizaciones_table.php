<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organizaciones', function (Blueprint $table) {
            $table->id();

            // 1. RELACIÓN (Dueño de la organización)
            $table->foreignId('owner_id')->constrained('users')->onDelete('cascade');

            // 2. IDENTIDAD Y BRANDING
            $table->string('nombre')->unique();
            $table->string('slug')->unique(); // URL amigable: "liga-pro-fc26"
            $table->text('descripcion')->nullable(); // Biografía o reglas generales
            $table->string('logo')->nullable();
            $table->string('banner')->nullable(); // Imagen de portada para su perfil público
            $table->string('color_hex', 7)->nullable(); // Ej: #FF0044 para personalizar su perfil

            // 3. CONTACTO Y REDES (Clave en E-sports)
            $table->string('email_contacto')->nullable();
            $table->string('discord_url')->nullable();
            $table->string('twitter_url')->nullable();
            $table->string('twitch_url')->nullable();
            $table->string('website')->nullable();

            // 4. UBICACIÓN Y PREFERENCIAS
            $table->string('pais', 2)->nullable(); // Código ISO (CL, AR, ES, MX) para filtrar torneos por región

            // 5. ESTADO DEL SISTEMA
            $table->boolean('is_verified')->default(false); // Para el check azul/dorado de organización oficial
            $table->enum('estado', ['activo', 'inactivo', 'suspendido'])->default('activo');

            $table->timestamps();
            $table->softDeletes(); // Agrega la columna 'deleted_at' (Buena práctica)
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organizaciones');
    }
};
