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
        Schema::create('temporada_divisiones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_temporada')->constrained('temporadas')->onDelete('cascade');
            $table->foreignId('id_division')->constrained('divisiones')->onDelete('cascade');
            $table->boolean('fichajes_abiertos')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('temporada_divisiones');
    }
};
