# Settlers 4B – Kolonie

Browsergame "Kolonie", een Settlers-achtig bouwspel, op https://doc.dgol.eu/settlers4b/.
Plain HTML, CSS en JavaScript, met een kleine PHP-API (SQLite) voor maps en savegames.

## Structuur

```
public/                 webroot (Apache-alias /settlers4b)
  index.html            het spel
  css/kolonie.css
  js/                   gewone <script>-tags, vaste volgorde (zie index.html)
    core.js             tekenhulpen ($, spr, poly, …)
    config.js           CFG: alle getallen voor de balans (tickrate, stapels, startvoorraad, …)
    nature.js           getekende bomen, struiken, rotsen, dieren (reserve-sprites)
    units.js            inwoners
    buildings.js        gebouwtypes (BTYPES), getekende gebouwen, spelerkleuren
    goods.js            goederensoorten (GOODS) en getekende stapels
    terrain.js          seeded random, ruis, mapgenerator (incl. mijnen, paden)
    render.js           canvas, camera, chunks (renderChunk met resolutie cres)
    colonists.js        kolonisten en dieren
    stock.js            stapels op de grond, stapelplekken per gebouw, paneel Voorraad
    path.js             A* over het tegelraster, wachtrij met knopenbudget per tick, routecache
    transport.js        planner vraag/aanbod en dragers
    loop.js             hoofdlus en tekenen
    input.js            overzichtskaart, muis, toetsen
    assets.js           laadt assets/manifest.json
    textures.js         grondtexturen: loadTextures(), renderTexTiles()
    custom.js           geschilderde sprites laden, galerij en werkbank
    ui.js               bediening en opstarten
  assets/
    manifest.json       metadata van alle geschilderde sprites
    buildings/*.webp    20 gebouwen
    nature/*.webp       21 bomen, struiken, rotsen
    textures/*.webp     6 naadloze grondtexturen, 512×512
  api/
    maps.php            maps (generator-instelling, later editor-data)
    saves.php           savegames
lib/api.php             gedeelde API-code (buiten de webroot)
data/                   NIET publiek: config.php (token) en kolonie.sqlite
tools/
  build-images.php      webp's opnieuw maken uit bron/
  extract-embedded.php  afbeeldingen uit een ingebakken kolonie-fase1.html halen
  split-html.py         eenmalig: eerste HTML gesplitst in index/css/js
bron/                   NIET publiek: originele PNG's (niet in git) en de
                        laatst verwerkte kolonie-fase1.html (referentie)
```

Apache-config: repo `server-beheer`, `apache/doc-dgol-projects.conf`
(geïnstalleerd als `/etc/apache2/snippets/doc-dgol-projects.conf`).

## Afbeeldingen

Het spel tekent eerst alle sprites en de grond zelf (reserve). Daarna haalt het
`assets/manifest.json` op en vervangt het per afbeelding de getekende versie.
Ontbreekt een webp of mislukt het laden, dan blijft op die plek de getekende
sprite staan. De grondtexturen gaan alleen aan als alle zes geladen zijn;
anders blijft de getekende grond. Een eigen afbeelding die een speler in de werkbank kiest
(IndexedDB) gaat voor op de ingebouwde.

Een regel in het manifest:

```json
"molen": {
  "file": "buildings/molen.webp",
  "w": 48, "ax": 0.48, "ay": 0.92,
  "hub": [0.464, 0.37], "sail": 1.45,
  "src": "Molen.png",
  "px": 320,
  "v": "ae543821"
}
```

| Veld | Betekenis |
| --- | --- |
| `file` | pad onder `assets/` |
| `w` (gebouwen) / `h` (natuur) | breedte/hoogte op de kaart in spel-eenheden |
| `ax`, `ay` | ankerpunt als fractie van breedte/hoogte (voet van het gebouw/de boom) |
| `flag`, `hub`, `sail` | vlagpositie, molenas en wiekgrootte (fracties van het beeld) |
| `src` | bron-PNG in `bron/` |
| `px` | doelmaat bij genereren: breedte in pixels (gebouwen) of hoogte (natuur) |
| `v` | inhoudshash; wordt door `build-images.php` gezet, voor cache-busting |
| `keep` | webp is met de hand bewerkt; `build-images.php` slaat hem over (reden als tekst) |

Texturen (`textures`) hebben alleen `file`, `src`, `px` (512) en `v`. De
sleutels deep, shallow, sand, grass, rock en aarde (paden) zijn alle zes nodig.

**Bewerkte webp's:** bij burcht, kazerne en wachttoren zijn de rode wimpels
uit de webp geknipt (het spel tekent de vlag zelf in spelerkleur). Ze hebben
daarom `keep` en worden niet opnieuw uit `bron/` gemaakt. Lever je een nieuwe
PNG zonder wimpel aan, haal dan `keep` weg of gebruik `--force`.
Gebouwsleutels moeten bestaan in `BTYPES` (`js/buildings.js`). Voor natuur
gebruikt `loadNature()` in `js/custom.js` vaste sleutels (eik0/1, berk0/1,
den0/1, beuk0/1, appel0/1, bes, hazel, varen, bloesem, rots0–3, kiem, jong,
stronk).

### Een afbeelding vervangen of toevoegen

1. Zet de PNG (transparante achtergrond) in `bron/`.
2. Nieuw? Voeg een regel toe aan `public/assets/manifest.json` met `file`,
   `w`/`h`, `ax`, `ay`, `src` en `px`. Bestaand? Pas zo nodig `src` aan.
3. Draai het script (alleen die sleutel, of zonder sleutel voor alles):

   ```
   php tools/build-images.php molen
   php tools/build-images.php --quality=85 --dry-run
   ```

   Opties: `--quality=N` (WebP 0–100; standaard 80, texturen 78), `--alpha=8`
   (alfadrempel voor het bijsnijden), `--out=map` (proefbuild, manifest blijft
   ongewijzigd), `--dry-run`, `--force` (ook `keep`-afbeeldingen).
   Gebouwen en natuur: bijsnijden op de zichtbare pixels en schalen naar `px`
   (gebouwen standaard 420 breed, natuur 4× `h` hoog). Texturen: vierkant naar
   `px` (512) zonder bijsnijden, naadloos (3×3 getegeld geschaald). Daarna
   schrijft het de webp en zet de nieuwe hash `v` in het manifest.
4. Controleer in het spel of het ankerpunt klopt (werkbank "Geschilderde
   gebouwen" toont dit live) en neem de waarden over in het manifest.

Let op: `ax`, `ay`, `flag` en `hub` zijn relatief aan het bijgesneden beeld.
Wordt de PNG anders bijgesneden (andere marge), controleer ze dan opnieuw.

### Een nieuwe kolonie-fase1.html verwerken

1. Vergelijk het script met de vorige versie in `bron/` (zonder de base64-regels)
   en neem de verschillen over in de modules in `public/js/`. Laat de laadcode
   (`assets.js`, `loadNature`, `loadTextures`, `loadCustom`, opstartregel in
   `ui.js`) staan: die haalt de afbeeldingen uit het manifest i.p.v. base64.
2. `php tools/extract-embedded.php pad/naar/kolonie-fase1.html` schrijft alle
   ingebakken webp's naar `public/assets/` en werkt het manifest bij (metadata
   uit de HTML; `src`, `px` en `keep` blijven behouden). Nieuwe sleutels krijgen
   hun bron-PNG via de tabel bovenin het script.
3. Zet de HTML in `bron/` als nieuwe referentie.

## Economie

Modus *Economie* (standaard) of *Stresstest* (de oude test met duizenden rondlopende
kolonisten, zonder goederen). De simulatie loopt met `CFG.ticksPerSec` (20) ticks per seconde,
los van het tekenen.

- **Goederen** (`GOODS` in `js/goods.js`): bouwmaterialen, voedsel, grondstoffen, metalen,
  gereedschap en wapens; elk met een eigen getekende sprite.
- **Stapels**: alles ligt als stapel op de grond, max `CFG.stackMax` (8) per stapel, één per tegel
  (`world.stk[tegel]` = stapel+1). Stapels staan in compacte arrays (`G.tile`, `G.good`, `G.cnt`,
  `G.pl`, `G.bld`). Ook de voorraad van burcht en pakhuis ligt zo, op hun stapelplekken
  (`bldSlots`: vrije tegels rond het gebouw, dichtst bij de deur; ingang en paden blijven vrij).
- **Startvoorraad** in de burcht: `CFG.startStock`, keuze Weinig/Normaal/Veel in het paneel.
- **Paneel Voorraad**: totaal per goed per speler, inclusief wat dragers onderweg vasthouden.
- **Dragers** (`js/transport.js`): in economiemodus zijn alle kolonisten vrije dragers zonder beroep;
  zonder opdracht lopen ze rond hun laatste plek. Een centrale planner (elke `CFG.carry.plannerEvery`
  ticks) kijkt per gebouw wat ontbreekt (`b.want − b.has − b.coming`), kiest de dichtstbijzijnde stapel
  met een vrij stuk (bij een gebouw dat dat goed zelf niet vraagt), reserveert het (`G.res`) en geeft
  de opdracht aan de dichtstbijzijnde vrije drager. Die haalt het, draagt het zichtbaar in zijn handen
  en legt het bij de deur neer; past het daar niet, dan gaat het naar de dichtstbijzijnde opslag.
- **Routes** (`js/path.js`): A* over de tegels in 8 richtingen, met kosten voor terrein, bomen,
  stenen, voetpaden en hoogteverschil (`CFG.path`). Zoekopdrachten staan in een wachtrij met een
  vast knopenbudget per tick, dus geen Web Worker nodig en de simulatie blijft deterministisch.
  Routes en 'onbereikbaar' gaan in een LRU-cache; `world.walkVer` verhogen maakt die leeg.
- **Tijdelijk** (`CFG.temp`): zolang er geen productie en bouw is, vragen gebouwen een vaste
  hoeveelheid goederen en verbruiken ze elke 30 s één stuk voedsel, water of boomstam.

## Prestaties

- `?prof=1` achter de URL toont rechtsboven fps, frametijd en ms per tekenonderdeel;
  toetsen 1, 2, 3 zetten de zoom. De ms zijn CPU-tijd: GPU-werk zie je alleen in fps/frametijd.
  Daarvoor zetten G (grond), N (natuur), K (kolonisten) een onderdeel uit en Q schaalt de
  grondchunks met 'low'; het fps-verschil is wat dat onderdeel buiten de JavaScript kost.
- Sprites krijgen bij het eerste tekenen vooraf verkleinde ImageBitmaps (1×, 2×, 4× de
  wereldgrootte plus origineel, `spriteMips` in `js/core.js`); `blit` kiest per frame de kleinste
  die nog scherp is voor `cam.z * dpr`.
- Grondchunks: maximaal 2 bouwen per frame, cache als LRU met een pixelbudget (`CHUNK_PX`).
- Gemeten (Brave met GPU, 1049×957, 320-kaart): 60 fps op zoom 1, 2 en 3 met 2000 kolonisten;
  met 10000 ook 60 fps op zoom 2 en 3, en 56 fps op zoom 1. Zonder GPU-versnelling in de browser
  (`brave://gpu`: "Software only") zakt dit naar 20–47 fps.

**TODO – sprite-atlas** (geparkeerd tot de nieuwe gerenderde poppetjes er zijn): zet de sprites
van kolonisten en dieren per mip-niveau in één atlas-bitmap, zodat opeenvolgende `drawImage`'s
dezelfde bron hebben en de GPU ze kan bundelen. Doel: stabiel 60 fps met 10000 kolonisten op
zoom 1 (nu ~56; tekentijd in JS is daar maar ~3 ms, de rest zit aan de GPU-kant).

## API

Alle antwoorden zijn JSON; fouten als `{"error": {"code": "...", "message": "..."}}`.

| Verzoek | Doel | Token |
| --- | --- | --- |
| `GET api/maps.php` | lijst: id, name, size, version, bytes, created, updated | nee |
| `GET api/maps.php?id=1` | één map, met `data` | nee |
| `POST api/maps.php` | opslaan; met `"id"` in de body overschrijven | ja |
| `DELETE api/maps.php?id=1` | verwijderen | ja |

`api/saves.php` werkt hetzelfde. Body bij POST (`Content-Type: application/json`, max 2 MB):

```json
{"name": "Vathorst", "version": 1,
 "data": {"seed": "vathorst", "size": 256, "shape": "continent",
          "players": 4, "water": 0.3, "mount": 0.5, "trees": 0.6}}
```

`data` is vrije JSON en wordt gecomprimeerd (gzcompress) opgeslagen; `version`
geeft het formaat aan, zodat later editor-tegeldata erbij kan. Bij maps worden
de bekende generatorvelden gecontroleerd als ze aanwezig zijn.

Token meesturen als `Authorization: Bearer <token>` of `X-Kolonie-Token: <token>`.

```
TOKEN=$(php -r 'echo (require "data/config.php")["token"];')
curl -X POST -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
     -d '{"name":"Test","data":{"seed":"test","size":128}}' https://doc.dgol.eu/settlers4b/api/maps.php
```

## Installeren en deployen

Eenmalig op een nieuwe server:

1. PHP 8.3+ met `pdo_sqlite` en `imagick` (WebP): `sudo apt install php8.5-sqlite3 php8.5-imagick`
2. Repo naar `/var/www/dgol-projects/settlers4b`, groep `www-data`
3. `cp data/config.example.php data/config.php`, token invullen
   (`php -r 'echo bin2hex(random_bytes(32)), "\n";'`), `chmod 640`, groep `www-data`.
   `data/` moet schrijfbaar zijn voor `www-data` (de database wordt vanzelf aangemaakt).
4. Apache-snippet uit `server-beheer` installeren:
   `sudo apache2ctl configtest && sudo systemctl reload apache2`

Bijwerken: `git pull` in de projectmap is genoeg. index.html, js/ en css/
worden altijd gehervalideerd; afbeeldingen hebben een hash in de URL.

Back-up: `data/kolonie.sqlite` (bijvoorbeeld `sqlite3 data/kolonie.sqlite ".backup kopie.sqlite"`).
