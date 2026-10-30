<?php
// Maakt de webp's in public/assets/ opnieuw vanuit de PNG's in bron/,
// op basis van public/assets/manifest.json:
//   src  bron-PNG in bron/
//   file doelbestand onder public/assets/
//   px   doelmaat in pixels: breedte voor gebouwen, hoogte voor natuur
// Bijsnijden gebeurt op de zichtbare inhoud (alfa boven de drempel).
// Na afloop wordt v (inhoudshash) in het manifest bijgewerkt.
//
//   php tools/build-images.php [opties] [sleutel ...]
//     --quality=80   WebP-kwaliteit 0–100
//     --alpha=8      alfadrempel 0–255 voor het bijsnijden
//     --out=map      schrijf naar een andere map, manifest blijft ongewijzigd
//     --dry-run      alleen tonen wat er zou gebeuren
//   Zonder sleutels worden alle afbeeldingen gemaakt.

$root = dirname(__DIR__);
$opt = ['quality' => 80, 'alpha' => 8, 'out' => null, 'dry-run' => false];
$only = [];
foreach (array_slice($argv, 1) as $a) {
    if (preg_match('/^--([a-z-]+)(?:=(.*))?$/', $a, $m)) {
        if (!array_key_exists($m[1], $opt)) exit("Onbekende optie --$m[1]\n");
        $opt[$m[1]] = $m[2] ?? true;
    } else {
        $only[] = $a;
    }
}
$quality = max(0, min(100, (int) $opt['quality']));
$alpha = max(0, min(255, (int) $opt['alpha']));
$out = $opt['out'] ? rtrim($opt['out'], '/') : "$root/public/assets";

$manifestFile = "$root/public/assets/manifest.json";
$manifest = json_decode(file_get_contents($manifestFile), true) ?? exit("manifest.json is geen geldige JSON\n");

$done = 0;
$errors = 0;
foreach (['buildings', 'nature'] as $group) {
    foreach ($manifest[$group] as $key => &$d) {
        if ($only && !in_array($key, $only, true)) continue;
        $src = "$root/bron/" . basename($d['src'] ?? '');
        if (empty($d['src']) || !is_file($src)) {
            echo "$key: bron ontbreekt ($src)\n";
            $errors++;
            continue;
        }
        $px = (int) ($d['px'] ?? ($group === 'buildings' ? 400 : 4 * ($d['h'] ?? 40)));

        $img = new Imagick($src);
        $img->setImageAlphaChannel(Imagick::ALPHACHANNEL_ACTIVATE);

        // Kader van de zichtbare pixels: alfakanaal -> zwart/wit -> trim
        $mask = clone $img;
        $mask->separateImageChannel(Imagick::CHANNEL_ALPHA);
        $mask->thresholdImage($alpha / 255 * Imagick::getQuantum());
        $mask->trimImage(0);
        $g = $mask->getImagePage();
        $cw = $mask->getImageWidth();
        $ch = $mask->getImageHeight();
        $img->cropImage($cw, $ch, $g['x'], $g['y']);
        $img->setImagePage(0, 0, 0, 0);

        if ($group === 'buildings') $img->resizeImage($px, 0, Imagick::FILTER_LANCZOS, 1);
        else $img->resizeImage(0, $px, Imagick::FILTER_LANCZOS, 1);

        $img->setImageFormat('webp');
        $img->setImageCompressionQuality($quality);
        $img->setOption('webp:alpha-quality', '100');
        $img->setOption('webp:method', '6');
        $blob = $img->getImageBlob();

        $dest = "$out/" . $d['file'];
        printf("%-12s %-22s bijgesneden %4dx%-4d -> %4dx%-4d %6d B\n",
            $key, basename($src), $cw, $ch, $img->getImageWidth(), $img->getImageHeight(), strlen($blob));
        if (!$opt['dry-run']) {
            @mkdir(dirname($dest), 0775, true);
            file_put_contents($dest, $blob);
            if (!$opt['out']) $d['v'] = substr(md5($blob), 0, 8);
        }
        $done++;
    }
    unset($d);
}

if (!$opt['dry-run'] && !$opt['out'] && $done) {
    file_put_contents($manifestFile, json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n");
}
echo "$done gemaakt, $errors fouten\n";
exit($errors ? 1 : 0);
