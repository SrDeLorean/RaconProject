<?php
$content = file_get_contents('app/Http/Controllers/Api/UserController.php');

$content = str_replace(
    "'eq.nombre as equipo_nombre',", 
    "'eq.nombre as equipo_nombre',\n              'eq.logo as clubBadge',", 
    $content
);

$content = str_replace(
    "->groupBy('u.id', 'u.name', 'u.foto', 'eq.nombre')", 
    "->groupBy('u.id', 'u.name', 'u.foto', 'eq.nombre', 'eq.logo')", 
    $content
);

$content = str_replace(
    "->groupBy('u.id', 'u.name', 'u.foto', 'eq.nombre', 'ej.posicion')", 
    "->groupBy('u.id', 'u.name', 'u.foto', 'eq.nombre', 'eq.logo', 'ej.posicion')", 
    $content
);

file_put_contents('app/Http/Controllers/Api/UserController.php', $content);
echo "Done\n";
