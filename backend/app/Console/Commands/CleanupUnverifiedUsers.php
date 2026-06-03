<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class CleanupUnverifiedUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:cleanup-unverified-users';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Elimina de forma física las cuentas de usuario no verificadas creadas hace más de 24 horas.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $count = \App\Models\User::whereNull('email_verified_at')
            ->where('created_at', '<', now()->subHours(24))
            ->forceDelete();

        $this->info("Se han eliminado {$count} usuarios no verificados creados hace más de 24 horas.");
    }
}
