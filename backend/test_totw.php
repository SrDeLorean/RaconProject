<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::create(
        '/api/analytics/totw-tots',
        'GET',
        ['active_tab' => 'totw']
    )
);
echo $response->getContent();
