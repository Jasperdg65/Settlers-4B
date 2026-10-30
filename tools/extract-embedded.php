<?php
// Haalt DEFAULT_IMGS, NATURE_IMGS en TEX_IMGS uit een ingebakken kolonie-fase1.html en
// schrijft losse webp's plus manifest.json. Metadata (w, h, ax, ay, flag, hub,
// sail) komt uit de HTML; src, px en keep uit een bestaand manifest blijven staan.
//
//   php tools/extract-embedded.php [bron/kolonie-fase1.html]

function fail(string $msg): never
{
    fwrite(STDERR, "$msg\n");
    exit(1);
}

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
    'kolenmijn' => 'Kolenmijn.png', 'ijzermijn' => 'Ijzerertsmijn.png', 'goudmijn' => 'Goudertsmijn.png',
    'ijzersmelterij' => 'Staalsmelterij.png', 'goudsmelterij' => 'Goudsmelterij.png', 'wapensmid' => 'Wapensmidse.png',
    'bloesem' => 'Struikbloesem.png', 'bes' => 'Struikbes.png', 'hazel' => 'Struikhazelnoot.png',
    'varen' => 'Varen.png', 'jong' => 'Boomjong.png', 'kiem' => 'Boomkiem.png', 'stronk' => 'Boomstronk.png',
    'rots0' => 'Rots1.png', 'rots1' => 'Rots4.png', 'rots2' => 'Rots3.png', 'rots3' => 'Rots2.png',
    // Bomen en rotsen: bepaald door beeldvergelijking met de ingebakken sprites
    'eik0' => 'Boom1.png', 'eik1' => 'Boom4.png', 'berk0' => 'Boom5.png', 'berk1' => 'Boom6.png',
    'den0' => 'Boom7.png', 'den1' => 'Boom9.png', 'beuk0' => 'Boom2.png', 'beuk1' => 'Boom3.png',
    'appel0' => 'Boom8.png', 'appel1' => 'Boom10.png',
    // Grondtexturen
    'aarde' => 'Aarde.png', 'grass' => 'gras.png', 'deep' => 'Diepwater.png',
    'shallow' => 'Ondiepwater.png', 'rock' => 'Rotsgrond.png', 'sand' => 'Zand.png',
];

// Bewerkte webp's (rode wimpels eruit geknipt): wijken af van de PNG in bron/,
// tools/build-images.php slaat ze over
$keep = [
    'burcht' => 'wimpel uit de webp geknipt', 'kazerne' => 'wimpel uit de webp geknipt',
    'wachttoren' => 'wimpel uit de webp geknipt',
];

$manifestFile = "$assets/manifest.json";
$prev = is_file($manifestFile) ? json_decode(file_get_contents($manifestFile), true) : [];
$manifest = ['version' => 1, 'buildings' => [], 'nature' => [], 'textures' => []];

foreach (['DEFAULT_IMGS' => 'buildings', 'NATURE_IMGS' => 'nature', 'TEX_IMGS' => 'textures'] as $var => $group) {
    // Object staat op één regel; geen regex over de hele regel (PCRE-backtracklimiet bij >1 MB)
    $start = strpos($html, "const $var=") ?: fail("$var niet gevonden");
    $start += strlen("const $var=");
    $line = rtrim(substr($html, $start, strpos($html, "\n", $start) - $start), "; \r");
    // Sleutels quoten zodat het geldige JSON wordt (base64 bevat geen { , of :)
    $json = preg_replace('/([{,])\s*([A-Za-z_]\w*)\s*:/', '$1"$2":', $line);
    $obj = json_decode($json, true) ?? fail("$var: JSON-fout " . json_last_error_msg());
    foreach ($obj as $key => $d) {
        if (is_string($d)) $d = ['data' => $d];   // TEX_IMGS: alleen base64
        $bin = base64_decode($d['data'], true);
        if ($bin === false || substr($bin, 8, 4) !== 'WEBP') fail("$key: geen webp");
        $file = "$group/$key.webp";
        file_put_contents("$assets/$file", $bin);
        [$pw, $ph] = getimagesize("$assets/$file");
        unset($d['data']);
        // px = doelmaat bij opnieuw genereren: breedte (gebouwen) of hoogte (natuur)
        // v  = inhoudshash, gaat als ?v= mee in de URL zodat assets lang gecachet kunnen worden
        $old = $prev[$group][$key] ?? [];
        $e = ['file' => $file] + $d + [
            'src' => $old['src'] ?? $src[$key] ?? null,
            'px' => $old['px'] ?? ($group === 'buildings' ? $pw : $ph),   // textures: vierkant
        ];
        if ($k = $old['keep'] ?? $keep[$key] ?? null) $e['keep'] = $k;
        $manifest[$group][$key] = $e + ['v' => substr(md5($bin), 0, 8)];
        printf("%-28s %4dx%-4d %6d B\n", $file, $pw, $ph, strlen($bin));
    }
}

file_put_contents($manifestFile,
    json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n");
echo "manifest.json: ", count($manifest['buildings']), " gebouwen, ", count($manifest['nature']), " natuur, ",
    count($manifest['textures']), " texturen\n";
