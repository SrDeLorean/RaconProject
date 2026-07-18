<?php

require 'c:/xampp/htdocs/RaconProject/backend/vendor/autoload.php';
$app = require_once 'c:/xampp/htdocs/RaconProject/backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$u = App\Models\User::where('email', 'admin_test_ia@test.com')->first();
$u->role = 'administrador';
$u->email_verified_at = now();
$u->password = \Illuminate\Support\Facades\Hash::make('password');
$u->save();

echo "Usuario actualizado: " . $u->toJson();
