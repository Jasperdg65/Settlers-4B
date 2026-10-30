<?php
// Eenmalig: haalt DEFAULT_IMGS en NATURE_IMGS uit het oude, ingebakken
// kolonie-fase1.html en schrijft losse webp's plus manifest.json.
//
//   php tools/extract-embedded.php [bron/kolonie-fase1.html]

$root = dirname(__DIR__);
$html = file_get_contents($argv[1] ?? "$root/bron/kolonie-fase1.html");
$assets = "$root/public/assets";

// Bron-PNG per sleutel (voor tools/build-images.php)
$src = [
    'bakkerij' => 'Bakkerij.png', 'burcht' => 'Burcht.png', 'woonhuis' => 'Woonhuis.png',
    'houthakker' => 'Houthakker.png', 'bosbouwer' => 'Bosbouwer.png', 'zagerij' => 'Houtzagerij.png',
    'kazerne' => 'Kazerne.png', 'kruidenhuis' => 'Kruidenhuis.png', 'pakhuis' => 'Pakhuis.png',
    'steenhouwer' => 'Steenhouwer.png', 'smidse' => 'Smidse.png', 'wachttoren' => 'Wachttoren.png',
    'molen' => 'Molen.png', 'boerderij' => 'Boerderij.png',
    'bloesem' => 'Struikbloesem.png', 'bes' => 'Struikbes.png', 'hazel' => 'Struikhazelnoot.png',
    'varen' => 'Varen.png', 'jong' => 'Boomjong.png', 'kiem' => 'Boomkiem.png', 'stronk' => 'Boomstronk.png',
    'rots0' => 'Rots1.png', 'rots1' => 'Rots4.png', 'rots2' => 'Rots3.png', 'rots3' => 'Rots2.png',
    // Bomen en rotsen: bepaald door beeldvergelijking met de ingebakken sprites
    'eik0' => 'Boom1.png', 'eik1' => 'Boom4.png', 'berk0' => 'Boom5.png', 'berk1' => 'Boom6.png',
    'den0' => 'Boom7.png', 'den1' => 'Boom9.png', 'beuk0' => 'Boom2.png', 'beuk1' => 'Boom3.png',
    'appel0' => 'Boom8.png', 'appel1' => 'Boom10.png',
];

$manifest = ['version' => 1, 'buildings' => [], 'nature' => []];

foreach (['DEFAULT_IMGS' => 'buildings', 'NATURE_IMGS' => 'nature'] as $var => $group) {
    if (!preg_match('/const ' . $var . '=(\{.*?\});?\n/s', $html, $m)) exit("$var niet gevonden\n");
    // Sleutels quoten zodat het geldige JSON wordt
    $json = preg_replace('/([{,])\s*([A-Za-z_]\w*)\s*:/', '$1"$2":', $m[1]);
    $obj = json_decode($json, true) ?? exit("$var: JSON-fout " . json_last_error_msg() . "\n");
    foreach ($obj as $key => $d) {
        $bin = base64_decode($d['data'], true);
        if ($bin === false || substr($bin, 8, 4) !== 'WEBP') exit("$key: geen webp\n");
        $file = "$group/$key.webp";
        file_put_contents("$assets/$file", $bin);
        [$pw, $ph] = getimagesize("$assets/$file");
        unset($d['data']);
        // px = doelmaat bij opnieuw genereren: breedte (gebouwen) of hoogte (natuur)
        // v  = inhoudshash, gaat als ?v= mee in de URL zodat assets lang gecachet kunnen worden
        $manifest[$group][$key] = ['file' => $file] + $d + ['src' => $src[$key] ?? null, 'px' => $group === 'buildings' ? $pw : $ph, 'v' => substr(md5($bin), 0, 8)];
        printf("%-28s %4dx%-4d %6d B\n", $file, $pw, $ph, strlen($bin));
    }
}

file_put_contents("$assets/manifest.json",
    json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n");
echo "manifest.json: ", count($manifest['buildings']), " gebouwen, ", count($manifest['nature']), " natuur\n";
