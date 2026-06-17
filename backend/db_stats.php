<?php
require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$partido = DB::table('partidos')->where('id', 2)->first();
echo "REPORTE VISITANTE STATS:\n";
print_r(json_decode($partido->reporte_visitante_stats, true));
