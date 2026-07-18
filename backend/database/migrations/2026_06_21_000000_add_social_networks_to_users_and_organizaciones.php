<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Add to users table
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'discord')) {
                $table->string('discord')->nullable()->after('tiktok');
            }
            if (!Schema::hasColumn('users', 'twitter')) {
                $table->string('twitter')->nullable()->after('discord');
            }
            if (!Schema::hasColumn('users', 'website')) {
                $table->string('website')->nullable()->after('twitter');
            }
            if (!Schema::hasColumn('users', 'whatsapp')) {
                $table->string('whatsapp')->nullable()->after('website');
            }
        });

        // Add to organizaciones table
        Schema::table('organizaciones', function (Blueprint $table) {
            if (!Schema::hasColumn('organizaciones', 'instagram_url')) {
                $table->string('instagram_url')->nullable()->after('twitch_url');
            }
            if (!Schema::hasColumn('organizaciones', 'facebook_url')) {
                $table->string('facebook_url')->nullable()->after('instagram_url');
            }
            if (!Schema::hasColumn('organizaciones', 'youtube_url')) {
                $table->string('youtube_url')->nullable()->after('facebook_url');
            }
            if (!Schema::hasColumn('organizaciones', 'tiktok_url')) {
                $table->string('tiktok_url')->nullable()->after('youtube_url');
            }
            if (!Schema::hasColumn('organizaciones', 'whatsapp')) {
                $table->string('whatsapp')->nullable()->after('tiktok_url');
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['discord', 'twitter', 'website', 'whatsapp']);
        });

        Schema::table('organizaciones', function (Blueprint $table) {
            $table->dropColumn(['instagram_url', 'facebook_url', 'youtube_url', 'tiktok_url', 'whatsapp']);
        });
    }
};
