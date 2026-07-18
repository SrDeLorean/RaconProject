<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$apiKey = env('GEMINI_API_KEY');
$ch = curl_init('https://generativelanguage.googleapis.com/v1beta/models?key=' . $apiKey);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$res = curl_exec($ch);
curl_close($ch);
$data = json_decode($res, true);
if (isset($data['models'])) {
    foreach ($data['models'] as $m) {
        if (strpos($m['name'], 'flash') !== false) {
            echo $m['name'] . "\n";
        }
    }
} else {
    echo $res;
}
