<?php
require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$competencias = DB::table('competencias')->get();
foreach ($competencias as $c) {
    $jornadas = DB::table('partidos')
        ->where('competencia_id', $c->id)
        ->select('jornada', DB::raw('count(*) as qty'))
        ->groupBy('jornada')
        ->get();
        
    if ($jornadas->count() > 0) {
        echo "Comp ID: {$c->id} | Name: {$c->nombre} | Format: {$c->formato}\n";
        foreach ($jornadas as $j) {
            echo "  - '{$j->jornada}' (qty: {$j->qty})\n";
        }
    }
}
