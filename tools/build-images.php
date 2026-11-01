<?php
// Maakt de webp's in public/assets/ opnieuw vanuit de PNG's in bron/,
// op basis van public/assets/manifest.json:
//   src  bron-PNG in bron/
//   file doelbestand onder public/assets/
//   px   doelmaat in pixels: breedte voor gebouwen (standaard 420),
//        hoogte voor natuur (standaard 4× h)
//   keep handmatig bewerkte webp (bv. wimpel eruit geknipt): wordt overgeslagen
// Effecten (effects, bv. rook): src is een spriteblad (cols × rows cellen van cell px) in bron/<map>/.
// Alle cellen worden op hetzelfde kader bijgesneden (de vereniging van wat zichtbaar is), zodat het
// anker (ax, ay in pixels van een bron-cel) overal gelijk blijft, en geschaald naar px breed per beeld.
// In het manifest komen fw, fh (beeldmaat in het blad), sw (bijgesneden breedte / celbreedte) en
// fx, fy (anker als fractie van het bijgesneden beeld).
// Gebouwen en natuur worden bijgesneden op de zichtbare inhoud (alfa boven
// de drempel). Texturen (naadloos) worden vierkant geschaald naar px×px
// zonder bijsnijden, met behoud van de naadloze randen.
// Na afloop wordt v (inhoudshash) in het manifest bijgewerkt.
//
//   php tools/build-images.php [opties] [sleutel ...]
//     --quality=N    WebP-kwaliteit 0–100 (standaard 80, texturen 78)
//     --alpha=8      alfadrempel 0–255 voor het bijsnijden
//     --out=map      schrijf naar een andere map, manifest blijft ongewijzigd
//     --dry-run      alleen tonen wat er zou gebeuren
//     --force        ook afbeeldingen met keep opnieuw maken (overschrijft de bewerking)
//   Zonder sleutels worden alle afbeeldingen gemaakt.

$root = dirname(__DIR__);
$opt = ['quality' => null, 'alpha' => 8, 'out' => null, 'dry-run' => false, 'force' => false];
$only = [];
foreach (array_slice($argv, 1) as $a) {
    if (preg_match('/^--([a-z-]+)(?:=(.*))?$/', $a, $m)) {
        if (!array_key_exists($m[1], $opt)) exit("Onbekende optie --$m[1]\n");
        $opt[$m[1]] = $m[2] ?? true;
    } else {
        $only[] = $a;
    }
}
$alpha = max(0, min(255, (int) $opt['alpha']));
$out = $opt['out'] ? rtrim($opt['out'], '/') : "$root/public/assets";

$manifestFile = "$root/public/assets/manifest.json";
$manifest = json_decode(file_get_contents($manifestFile), true) ?? exit("manifest.json is geen geldige JSON\n");

$done = 0;
$skipped = 0;
$errors = 0;
foreach (['buildings', 'nature', 'textures'] as $group) {
    $manifest[$group] ??= [];   // ?? [] in de foreach zelf zou een kopie geven: dan komt v nooit in het manifest
    foreach ($manifest[$group] as $key => &$d) {
        if ($only && !in_array($key, $only, true)) continue;
        if (!empty($d['keep']) && !$opt['force']) {
            echo "$key: overgeslagen ({$d['keep']}; --force om toch te maken)\n";
            $skipped++;
            continue;
        }
        $src = "$root/bron/" . basename($d['src'] ?? '');
        if (empty($d['src']) || !is_file($src)) {
            echo "$key: bron ontbreekt ($src)\n";
            $errors++;
            continue;
        }
        $px = (int) ($d['px'] ?? match ($group) { 'buildings' => 420, 'nature' => 4 * ($d['h'] ?? 10), 'textures' => 512 });
        $quality = max(0, min(100, (int) ($opt['quality'] ?? ($group === 'textures' ? 78 : 80))));

        $img = new Imagick($src);
        if ($group === 'textures') {
            // 3×3 tegelen, schalen en het midden nemen: de filter ziet aan elke
            // rand de overkant, zodat de textuur naadloos blijft
            $img->setImageAlphaChannel(Imagick::ALPHACHANNEL_REMOVE);
            $cw = $img->getImageWidth();
            $ch = $img->getImageHeight();
            $tile = new Imagick();
            $tile->newImage($cw * 3, $ch * 3, 'black');
            for ($ty = 0; $ty < 3; $ty++) for ($tx = 0; $tx < 3; $tx++) {
                $tile->compositeImage($img, Imagick::COMPOSITE_COPY, $tx * $cw, $ty * $ch);
            }
            $tile->resizeImage($px * 3, $px * 3, Imagick::FILTER_LANCZOS, 1);
            $tile->cropImage($px, $px, $px, $px);
            $tile->setImagePage(0, 0, 0, 0);
            $img = $tile;
        } else {
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
        }

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

$manifest['effects'] ??= [];
foreach ($manifest['effects'] as $key => &$d) {
    if ($only && !in_array($key, $only, true)) continue;
    $src = "$root/bron/" . $d['src'];
    if (!is_file($src)) { echo "$key: bron ontbreekt ($src)\n"; $errors++; continue; }
    $sheet = new Imagick($src);
    $sheet->setImageAlphaChannel(Imagick::ALPHACHANNEL_ACTIVATE);
    [$cols, $rows, $cell, $px] = [$d['cols'], $d['rows'], $d['cell'], $d['px']];
    $x0 = $y0 = $cell; $x1 = $y1 = 0;
    for ($i = 0; $i < $cols * $rows; $i++) {
        $c = clone $sheet;
        $c->cropImage($cell, $cell, ($i % $cols) * $cell, intdiv($i, $cols) * $cell);
        $c->setImagePage(0, 0, 0, 0);
        $c->separateImageChannel(Imagick::CHANNEL_ALPHA);
        $c->thresholdImage($alpha / 255 * Imagick::getQuantum());
        $c->trimImage(0);
        $g = $c->getImagePage();
        if ($c->getImageWidth() < 2) continue;   // leeg beeld
        $x0 = min($x0, $g['x']); $y0 = min($y0, $g['y']);
        $x1 = max($x1, $g['x'] + $c->getImageWidth()); $y1 = max($y1, $g['y'] + $c->getImageHeight());
    }
    $cw = $x1 - $x0; $ch = $y1 - $y0;
    $fw = $px; $fh = (int) round($ch * $px / $cw);
    $out_img = new Imagick();
    $out_img->newImage($fw * $cols, $fh * $rows, 'transparent');
    for ($i = 0; $i < $cols * $rows; $i++) {
        $c = clone $sheet;
        $c->cropImage($cw, $ch, ($i % $cols) * $cell + $x0, intdiv($i, $cols) * $cell + $y0);
        $c->setImagePage(0, 0, 0, 0);
        $c->resizeImage($fw, $fh, Imagick::FILTER_LANCZOS, 1);
        $out_img->compositeImage($c, Imagick::COMPOSITE_COPY, ($i % $cols) * $fw, intdiv($i, $cols) * $fh);
    }
    $out_img->setImageFormat('webp');
    $out_img->setImageCompressionQuality((int) ($opt['quality'] ?? 80));
    $out_img->setOption('webp:alpha-quality', '100');
    $out_img->setOption('webp:method', '6');
    $blob = $out_img->getImageBlob();
    printf("%-12s %-22s kader %dx%d+%d+%d -> %dx%d per beeld %6d B\n", $key, basename($src), $cw, $ch, $x0, $y0, $fw, $fh, strlen($blob));
    if (!$opt['dry-run']) {
        $dest = "$out/" . $d['file'];
        @mkdir(dirname($dest), 0775, true);
        file_put_contents($dest, $blob);
        if (!$opt['out']) {
            $d['fw'] = $fw; $d['fh'] = $fh; $d['sw'] = round($cw / $cell, 4);
            $d['fx'] = round(($d['ax'] - $x0) / $cw, 4); $d['fy'] = round(($d['ay'] - $y0) / $ch, 4);
            $d['v'] = substr(md5($blob), 0, 8);
        }
    }
    $done++;
}
unset($d);

if (!$opt['dry-run'] && !$opt['out'] && $done) {
    file_put_contents($manifestFile, json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n");
}
echo "$done gemaakt, $skipped overgeslagen, $errors fouten\n";
exit($errors ? 1 : 0);
