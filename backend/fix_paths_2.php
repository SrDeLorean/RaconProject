<?php
$totwFile = 'C:/xampp/htdocs/RaconProject/frontend/src/features/public/pages/TotwTots.jsx';
$content = file_get_contents($totwFile);

$content = preg_replace(
    "/const getCORSImageUrl = \\(path\\) => \\{\\s*if \\(!path\\) return null;\\s*if \\(path\\.includes\\('default-user\\.png'\\) \\|\\| path === 'default\\.png'\\) \\{\\s*return '\\/images\\/users\\/default-user\\.png\\?v=2';\\s*\\}/m",
    "const getCORSImageUrl = (path, type = 'user') => {\n      if (!path) return null;\n      if (path.includes('default-user.png') || (path === 'default.png' && type === 'user')) {\n        return '/images/users/default-user.png?v=2';\n      }\n      if (path === 'default.png' && type === 'team') {\n        return '/images/default-team-logo.svg';\n      }",
    $content
);

$content = str_replace(
    "const clubBadgeUrl = getCORSImageUrl(player.clubBadge);",
    "const clubBadgeUrl = getCORSImageUrl(player.clubBadge, 'team');",
    $content
);

file_put_contents($totwFile, $content);

$tacticFile = 'C:/xampp/htdocs/RaconProject/frontend/src/features/public/pages/TacticVisualizer3D.jsx';
$content = file_get_contents($tacticFile);

$content = preg_replace(
    "/const getImageUrl = \\(path\\) => \\{\\s*if \\(!path\\) return null;\\s*if \\(path\\.includes\\('default-user\\.png'\\) \\|\\| path === 'default\\.png'\\) \\{\\s*return '\\/images\\/users\\/default-user\\.png\\?v=2';\\s*\\}/m",
    "const getImageUrl = (path, type = 'user') => {\n    if (!path) return null;\n    if (path.includes('default-user.png') || (path === 'default.png' && type === 'user')) {\n      return '/images/users/default-user.png?v=2';\n    }\n    if (path === 'default.png' && type === 'team') {\n      return '/images/default-team-logo.svg';\n    }",
    $content
);

$content = str_replace(
    "badgeObj.src = getImageUrl(p.clubBadge);",
    "badgeObj.src = getImageUrl(p.clubBadge, 'team');",
    $content
);

file_put_contents($tacticFile, $content);

$cardFile = 'C:/xampp/htdocs/RaconProject/frontend/src/components/ui/PlayerCard.jsx';
$content = file_get_contents($cardFile);

$content = preg_replace(
    "/const getImageUrl = \\(path\\) => \\{\\s*if \\(!path\\) return null;\\s*if \\(path\\.includes\\('default-user\\.png'\\) \\|\\| path === 'default\\.png'\\) \\{\\s*return '\\/images\\/users\\/default-user\\.png\\?v=2';\\s*\\}/m",
    "const getImageUrl = (path, type = 'user') => {\n      if (!path) return null;\n      if (path.includes('default-user.png') || (path === 'default.png' && type === 'user')) {\n        return '/images/users/default-user.png?v=2';\n      }\n      if (path === 'default.png' && type === 'team') {\n        return '/images/default-team-logo.svg';\n      }",
    $content
);

file_put_contents($cardFile, $content);
echo "Done replacing paths.\n";
