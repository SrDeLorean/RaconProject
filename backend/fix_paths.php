<?php
$files = [
    'C:/xampp/htdocs/RaconProject/frontend/src/features/public/pages/TacticVisualizer3D.jsx',
    'C:/xampp/htdocs/RaconProject/frontend/src/features/public/pages/TotwTots.jsx',
    'C:/xampp/htdocs/RaconProject/frontend/src/components/ui/PlayerCard.jsx'
];
foreach ($files as $f) {
    $c = file_get_contents($f);
    $c = str_replace("path.includes('default.png')", "path === 'default.png'", $c);
    file_put_contents($f, $c);
}
echo "Done\n";
