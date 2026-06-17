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
        // 1. Alter competencias table
        Schema::table('competencias', function (Blueprint $table) {
            $table->foreignId('campeon_id')->nullable()->after('estado')->constrained('equipos')->onDelete('set null');
            $table->foreignId('subcampeon_id')->nullable()->after('campeon_id')->constrained('equipos')->onDelete('set null');
            $table->foreignId('tercer_lugar_id')->nullable()->after('subcampeon_id')->constrained('equipos')->onDelete('set null');
            $table->json('config')->nullable()->after('tercer_lugar_id');
        });

        // 2. Alter competencias_ut table
        if (Schema::hasTable('competencias_ut')) {
            Schema::table('competencias_ut', function (Blueprint $table) {
                $table->foreignId('campeon_id')->nullable()->after('estado')->constrained('equipos_ut')->onDelete('set null');
                $table->foreignId('subcampeon_id')->nullable()->after('campeon_id')->constrained('equipos_ut')->onDelete('set null');
                $table->foreignId('tercer_lugar_id')->nullable()->after('subcampeon_id')->constrained('equipos_ut')->onDelete('set null');
                $table->json('config')->nullable()->after('tercer_lugar_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('competencias', function (Blueprint $table) {
            $table->dropForeign(['campeon_id']);
            $table->dropForeign(['subcampeon_id']);
            $table->dropForeign(['tercer_lugar_id']);
            $table->dropColumn(['campeon_id', 'subcampeon_id', 'tercer_lugar_id', 'config']);
        });

        if (Schema::hasTable('competencias_ut')) {
            Schema::table('competencias_ut', function (Blueprint $table) {
                $table->dropForeign(['campeon_id']);
                $table->dropForeign(['subcampeon_id']);
                $table->dropForeign(['tercer_lugar_id']);
                $table->dropColumn(['campeon_id', 'subcampeon_id', 'tercer_lugar_id', 'config']);
            });
        }
    }
};
