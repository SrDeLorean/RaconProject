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
        Schema::create('divisiones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_competencia')->constrained('competencias')->onDelete('cascade');
            $table->string('nombre'); // Ej: "Primera División", "Ascenso"
            $table->integer('nivel')->default(1); // 1 = Más alto, 2 = Segunda, etc.
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('divisiones');
    }
};
