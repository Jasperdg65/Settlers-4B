# Architectuur

Opbouw van de code, prestaties en de API. Ontwerpkeuzes per onderdeel staan in [../ontwerp/](../ontwerp/).

## Structuur

```
public/                 webroot (Apache-alias /settlers4b)
  index.html            het spel
  css/kolonie.css
  js/                   gewone <script>-tags, vaste volgorde (zie index.html)
    core.js             tekenhulpen ($, spr, poly, …)
    config.js           CFG: alle getallen voor de balans (tickrate, stapels, startvoorraad, …)
    nature.js           getekende bomen, struiken, rotsen, dieren (reserve-sprites)
    units.js            inwoners (getekend) en het uiterlijk per beroep
    units3d.js          3D-poppetjes: atlassen laden, omkleuren per speler, tekenen
    buildings.js        gebouwtypes (BTYPES), getekende gebouwen, spelerkleuren
    goods.js            goederensoorten (GOODS) en getekende stapels
    terrain.js          seeded random, ruis, mapgenerator (incl. mijnen, paden)
    render.js           canvas, camera, chunks (renderChunk met resolutie cres)
    colonists.js        kolonisten en dieren
    stock.js            stapels op de grond, stapelplekken per gebouw, paneel Voorraad
    path.js             A* over het tegelraster, wachtrij met knopenbudget per tick, routecache
    transport.js        planner vraag/aanbod, dragers en de toestanden van werkers
    build.js            bouwen: plaatsen, egaliseren, bouwen, afbreken, paneel Bouwen
    harmony.js          harmonie: meter, bronnen, voederplaats, dieren fokken en bij ertsaders (mijlpaal 7)
    crew.js             krachthal en bemanning van torens (mijlpaal 6c); muzikanten in de hal, verplaatsen, voorrang bij trainen en paneel Krachtpatsers (8c)
    deals.js            grond ruilen: voorstel, waardefunctie van de buur, afspraken in het gebied, relaties, paneel Buren (mijlpaal 8a); verzoeken van buren en grensduel (8b)
    jobs.js             beroepen: vakmensen zoeken, gereedschap halen, gebouw in
    army.js             krachtpatsers: lopen, opdrachten uitvoeren, selecteren, groepen, markering (Duel-test)
    duel.js             duelmodule: kracht, duelStep (één tick van een duel), uitdagen, afloop
    production.js       productie: buitenwerkers (kappen, steen hakken, planten, akkers, plukken), werkplaatsen, natuur (groei, stronken, akkers), paneel Productie
    orders.js           opdrachtenwachtrij: de enige weg waarlangs een speler (mens of computer) de simulatie verandert
    loop.js             hoofdlus en tekenen
    input.js            overzichtskaart, muis, toetsen
    assets.js           laadt assets/manifest.json
    textures.js         grondtexturen: loadTextures(), renderTexTiles()
    advisor.js          de adviseur: adviesregels (CFG.advisor), rol en hoofd rechtsonder, instellingen
    custom.js           geschilderde sprites laden, galerij en werkbank
    ui.js               bediening en opstarten
  assets/
    manifest.json       metadata van alle geschilderde sprites
    buildings/*.webp    20 gebouwen
    nature/*.webp       21 bomen, struiken, rotsen
    textures/*.webp     6 naadloze grondtexturen, 512×512
    units/*             3D-poppetjes: per model een JSON en per maat atlas + masker (webp)
    dieren/*            3D-dieren: per dier een JSON en per maat een atlas (webp, geen masker)
  api/
    maps.php            maps (generator-instelling, later editor-data)
    saves.php           savegames
lib/api.php             gedeelde API-code (buiten de webroot)
data/                   NIET publiek: config.php (token) en kolonie.sqlite
tools/
  build-images.php      webp's opnieuw maken uit bron/
  extract-embedded.php  afbeeldingen uit een ingebakken kolonie-fase1.html halen
  split-html.py         eenmalig: eerste HTML gesplitst in index/css/js
  render_sprites.py     renderstraat: GLB → spritesheets (Blender headless)
  sprites.json          instellingen en modellijst voor render_sprites.py
  blender               snelkoppeling naar portable Blender 4.5 LTS (niet in git, zie hieronder)
docs/                   NIET publiek: projectdossier (visie, beslissingen, roadmap, ontwerp, techniek, artwork)
bron/                   NIET publiek: originele PNG's (niet in git) en de
                        laatst verwerkte kolonie-fase1.html (referentie)
  modellen/             3D-modellen (GLB), hun .blend-bronnen en bouwscripts
```

Apache-config: repo `server-beheer`, `apache/doc-dgol-projects.conf`
(geïnstalleerd als `/etc/apache2/snippets/doc-dgol-projects.conf`).

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
