<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('equipos', function (Blueprint $table) {
            $table->id();
            // 🔥 UNIQUE: Un usuario solo puede ser capitán de un único equipo
            $table->foreignId('id_capitan')->unique()->constrained('users')->onDelete('cascade');
            $table->string('nombre')->unique();
            $table->string('slug')->unique();
            $table->string('abreviatura', 10)->unique()->nullable();
            $table->text('descripcion')->nullable();
            $table->string('logo')->default('default.png');
            $table->string('banner')->nullable();
            $table->string('plataforma')->nullable();
            $table->json('redes_sociales')->nullable();
            $table->boolean('estado')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('equipos');
    }
};
