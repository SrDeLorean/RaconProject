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
        Schema::table('partidos', function (Blueprint $table) {
            $table->unsignedBigInteger('equipo_local_id')->nullable()->change();
            $table->unsignedBigInteger('equipo_visitante_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('partidos', function (Blueprint $table) {
            $table->unsignedBigInteger('equipo_local_id')->nullable(false)->change();
            $table->unsignedBigInteger('equipo_visitante_id')->nullable(false)->change();
        });
    }
};
