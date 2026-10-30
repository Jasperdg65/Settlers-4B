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
    nature.js           getekende bomen, struiken, rotsen, dieren (reserve-sprites)
    units.js            inwoners
    buildings.js        gebouwtypes (BTYPES), getekende gebouwen, spelerkleuren
    terrain.js          seeded random, ruis, mapgenerator
    render.js           canvas, camera, chunks
    colonists.js        kolonisten en dieren
    loop.js             hoofdlus en tekenen
    input.js            overzichtskaart, muis, toetsen
    assets.js           laadt assets/manifest.json
    custom.js           geschilderde sprites laden, galerij en werkbank
    ui.js               bediening en opstarten
  assets/
    manifest.json       metadata van alle geschilderde sprites
    buildings/*.webp    14 gebouwen
    nature/*.webp       21 bomen, struiken, rotsen
  api/
    maps.php            maps (generator-instelling, later editor-data)
    saves.php           savegames
lib/api.php             gedeelde API-code (buiten de webroot)
data/                   NIET publiek: config.php (token) en kolonie.sqlite
tools/
  build-images.php      webp's opnieuw maken uit bron/
  extract-embedded.php  eenmalig: afbeeldingen uit het oude HTML-bestand gehaald
  split-html.py         eenmalig: oude HTML gesplitst in index/css/js
bron/                   NIET publiek: originele PNG's (niet in git) en het
                        oorspronkelijke kolonie-fase1.html
```

Apache-config: repo `server-beheer`, `apache/doc-dgol-projects.conf`
(geïnstalleerd als `/etc/apache2/snippets/doc-dgol-projects.conf`).

## Afbeeldingen

Het spel tekent eerst alle sprites zelf (reserve-sprites). Daarna haalt het
`assets/manifest.json` op en vervangt het per afbeelding de getekende versie.
Ontbreekt een webp of mislukt het laden, dan blijft op die plek de getekende
sprite staan. Een eigen afbeelding die een speler in de werkbank kiest
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

   Opties: `--quality=80` (WebP 0–100), `--alpha=8` (alfadrempel voor het
   bijsnijden), `--out=map` (proefbuild, manifest blijft ongewijzigd),
   `--dry-run`. Het script snijdt bij op de zichtbare pixels, schaalt naar `px`,
   schrijft de webp en zet de nieuwe hash `v` in het manifest.
4. Controleer in het spel of het ankerpunt klopt (werkbank "Geschilderde
   gebouwen" toont dit live) en neem de waarden over in het manifest.

Let op: `ax`, `ay`, `flag` en `hub` zijn relatief aan het bijgesneden beeld.
Wordt de PNG anders bijgesneden (andere marge), controleer ze dan opnieuw.

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
