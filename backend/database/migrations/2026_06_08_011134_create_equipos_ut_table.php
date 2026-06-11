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
        Schema::create('equipos_ut', function (Blueprint $table) {
            $table->id();
            $table->string('nombre'); // Ej: "Gamertag1" (1v1) o "Gamertag1 / Gamertag2" (2v2)
            $table->string('logo')->default('default.png');
            $table->string('club_id_ea')->nullable(); // Para conexión con la API de EA
            $table->enum('plataforma', ['ps5', 'xbox', 'pc', 'crossplay'])->default('crossplay');
            
            // Integrantes
            $table->foreignId('id_capitan')->constrained('users')->cascadeOnDelete();
            $table->foreignId('id_companero')->nullable()->constrained('users')->nullOnDelete(); // Solo para 2v2
            
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
        Schema::dropIfExists('equipos_ut');
    }
};
