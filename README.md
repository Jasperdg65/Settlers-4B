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
    jobs.js             beroepen: vakmensen zoeken, gereedschap halen, gebouw in
    army.js             krachtpatsers: lopen, opdrachtenwachtrij, selecteren, groepen, markering (Duel-test)
    duel.js             duelmodule: kracht, duelStep (één tick van een duel), uitdagen, afloop
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
bron/                   NIET publiek: originele PNG's (niet in git) en de
                        laatst verwerkte kolonie-fase1.html (referentie)
  modellen/             3D-modellen (GLB), hun .blend-bronnen en bouwscripts
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

### 3D-poppetjes (renderstraat)

`tools/render_sprites.py` zet een GLB uit `bron/modellen/` om naar spritesheets. Blender draait
headless. Om de systeemschijf te sparen staan Blender en de tijdelijke renderbestanden op het
lokale volume; `tools/blender` en `tools/.render-tmp` zijn snelkoppelingen daarheen (niet in git):

```
/mnt/HC_Volume_105876660/kolonie/blender      portable Blender 4.5 LTS
/mnt/HC_Volume_105876660/kolonie/render-tmp   tijdelijke renders
```

Opnieuw neerzetten:

```
cd /mnt/HC_Volume_105876660/kolonie
curl -LO https://download.blender.org/release/Blender4.5/blender-4.5.15-linux-x64.tar.xz
mkdir -p blender render-tmp && tar -xJf blender-4.5.15-linux-x64.tar.xz -C blender --strip-components=1 && rm blender-4.5.15-linux-x64.tar.xz
ln -sfn /mnt/HC_Volume_105876660/kolonie/blender tools/blender
ln -sfn /mnt/HC_Volume_105876660/kolonie/render-tmp tools/.render-tmp
```

Wat het script doet (instellingen in `tools/sprites.json`):

- Camera orthografisch, 30° boven horizontaal (past bij de 16×8-tegels). Warm hoofdlicht van
  linksboven, blauwige vulling, schaduwvanger op de grond, transparante achtergrond.
- Vaste schaal voor alle modellen: `refHeight` (2,05 modeleenheden) is de px-maat van het
  poppetje; maten 24, 48 en 96 px, gerenderd op 2× en netjes verkleind.
- Animatie zonder skelet: per kant scharnieren alle onderdelen met Boot of Trouser in de naam
  rond de heup (`rig.hip`); onderdelen verder dan `rig.armMinX` van het midden horen bij de arm
  van die kant en draaien rond de schouder (`rig.shoulder`); de rest is romp en gaat iets op en
  neer. Lopen 8 stappen, stilstaan 1, vechten 6 (de arm met het zwaard, `rig.fight` in graden).
  De kant van het zwaard herkent het script aan onderdelen die met `Sword` beginnen.
  Benen worden hoofdletterongevoelig herkend (`Boot_…`, `Felt_boot_…`, `Trouser…`).
- 8 richtingen: rij 0 = oost (schermrechts), met de klok mee per 45°; rij 2 kijkt naar de kijker.
- Spelerkleur: materialen die met `TEAM` beginnen (`TEAM_Felt`, `TEAM_Crest`, …), worden wit
  gerenderd; een tweede pass maakt een masker (wit = spelerkleur) met dezelfde indeling. Het masker
  is lineaire data: weergave Raw, geen denoise, opgeslagen als Non-Color. Het spel kleurt per
  speler om.
- Uitvoer in `public/assets/units/`: `<naam>_<px>.webp`, `<naam>_<px>_mask.webp` en
  `<naam>.json` (per beeld `anim`, `dir`, `i`, positie `x y w h` in de atlas en anker `ax ay`
  = voeten). Daarna zet het `units.<sleutel> = {json, v}` in `assets/manifest.json`.
- Veiligheid: stopt als er minder dan 3 GB vrij is; tijdelijke bestanden in `tools/.render-tmp/`.

**Een nieuw model toevoegen**

1. Zet de GLB in `bron/modellen/`. Opbouw zoals de soldaten: losse onderdelen, z omhoog,
   voorkant naar −y, voeten op z = 0, ongeveer 2 eenheden hoog. Benen heten `Boot_…`/`Trouser_…`,
   spelerkleur-materialen beginnen met `TEAM` (`TEAM_Cloth`, `TEAM_Shield`, `TEAM_Crest`).
2. Voeg het model toe aan `models` in `tools/sprites.json`, bijvoorbeeld
   `"drager": {"glb": "bron/modellen/drager.glb", "out": "units/drager", "anims": ["idle", "walk"]}`.
   Wijken heup of schouders af, zet dan een eigen `rig` in die regel (die gaat voor de algemene).
   Verdere opties per model:
   - `hide`: onderdelen weglaten (naam begint met …), bv. `["Cargo"]` voor de drager zonder kist;
   - `body`: onderdelen die altijd bij de romp horen, ook als ze ver van het midden zitten
     (bv. de kist, anders zwaaien de zijplanken mee met de armen);
   - `rig.armRest`: armen in graden omlaag vanuit de gemodelleerde stand (vrije drager: 52);
   - `points`: punten op de romp in modelmaten, per beeld geprojecteerd naar `pts` in de JSON
     (bv. `"hold"`: waar het spel het gedragen goed tekent).
3. Proefrender (alleen stilstaan en de eerste loopstap, alle richtingen, met PNG-voorbeeld in
   `tools/.render-tmp/units/`):

   ```
   nice tools/blender/blender -b -P tools/render_sprites.py -- drager --test
   ```
4. Echte render (schrijft naar `public/assets/units/` en het manifest); zonder sleutel alle modellen:

   ```
   nice tools/blender/blender -b -P tools/render_sprites.py -- drager
   ```
   Reken op ongeveer 5 s per beeld op deze server (120 beelden per model met drie animaties,
   dus zo'n 10 minuten per model). Lokaal renderen kan ook, zie hieronder.
5. Koppel het in het spel: `ROLE3D` in `js/units3d.js` wijst per rol (index in `ROLES`) de
   modelsleutels per niveau aan, nu `2: ['krachtpatser_1','krachtpatser_2','krachtpatser_3']`
   (rol Krachtpatser, junior/medior/senior), `4: heler_1..3`, `5: muzikant_1..3` en `0: drager_leeg`
   (rol Drager in de stresstest). Heler en muzikant (`bron/modellen/build_rollen.py`) houden staf,
   kruiden en instrument vast: hun armen zwaaien niet (muzikant) of nauwelijks (heler, `armSwing` 6).
   In de economie gebruiken vrije dragers `drager_leeg` en dragers met een goed `drager_kist`,
   met het goed op punt `hold` (`CARRY3D`). De galerij *Inwoners* toont ze, met een
   controlestrook op spelgrootte (zoom 1 en 2) in rood en blauw.
   Controlebeeld buiten de browser (zelfde maatkeuze, schaal en omkleuring als het spel):
   `tools/blender/blender -b -P tools/preview_units.py -- uit.png krachtpatser_1 krachtpatser_2 krachtpatser_3`
   Zonder geladen atlas tekent het spel de oude figuur.

**Duel-sprite (armpje drukken)** (`duels` in `tools/sprites.json`)

- Bron: `bron/modellen/build_krachtpatsers.py` maakt per niveaucombinatie een geanimeerde GLB in
  `bron/modellen/duels/armpje_drukken_L{links}_R{rechts}.glb` (9 standen als keyframes), plus
  `armpje_drukken.glb` en `standen/` (medior tegen senior). Frame 1 = Player (`TEAM_R_*`) wint bijna,
  5 = neutraal, 9 = Opponent (`TEAM_G_*`) wint bijna. Het bovenlijf draait rond de heup: bij de
  uiterste standen leunt de verliezer 18° weg en de winnaar 6° naar voren (`LEAN_LOSE`, `LEAN_WIN`),
  tussenstanden evenredig; de worstelarm wordt per stand naar het gedeelde handpunt gericht.
  Opnieuw maken: `nice tools/blender/blender -b -P bron/modellen/build_krachtpatsers.py` (~7 min;
  schrijft ook de losse krachtpatsers, `renders/` en het .blend-bestand opnieuw).
- Render: het hele duel 90° om de verticale as, zodat Player links en Opponent rechts staat
  (voor-achter en schuin zijn onleesbaar). Zelfde camera, licht en maten als de andere sprites.
- Uitvoer `public/assets/units/armdrukken_<px>.webp` + `_mask.webp` + `armdrukken.json`: rijen =
  niveaucombinaties (links 1–3 × rechts 1–3), kolommen = standen 1–9; per beeld `stand`, `lvlL`,
  `lvlR`, positie en anker (midden onder de tafel). Masker: R = linker deelnemer, G = rechter,
  B = 0, lineair. In het spel: kleur = basis × (1 − R − G) + basis × spelerkleurLinks × R +
  basis × spelerkleurRechts × G (de teamvlakken zijn wit gerenderd, dus de belichting blijft).
  In het manifest onder `duels`.
- `nice tools/blender/blender -b -P tools/render_sprites.py -- armdrukken` (~8 min);
  met `--test` alleen niveau 1 tegen 1, standen 1, 5 en 9.

**Dieren** (`animals` en `animalRig` in `tools/sprites.json`)

- Bron: `bron/modellen/build_dieren.py` (hert, konijn, vos, vogeltje; elk staand en rustend als losse
  statische GLB, zonder skelet) en de eend (`eend_lopend.glb`, `eend_zwemmend.glb`). Voorkant naar −y,
  net als de poppetjes.
- Per dier noemt `anims` per animatie de GLB: `idle` (staand, 1 beeld), `walk` (8 beelden),
  `rest` (liggen of zitten, 1 beeld). Lopen wordt nagebootst per gang (`rig.gait`):
  `quad` (hert, vos: de poten worden gevonden op naam, leg/knee/hoof/sock/paw/…, per hoek gegroepeerd
  en zwaaien diagonaal rond hun bovenkant, `swing`), `hop` (konijn: laag huppen met het rustende model,
  vogel: met het staande; `hop`, `tilt`) en `swim` (eend: deinen en wiegen, `bob`, `roll`; de
  schaduwvanger op waterhoogte snijdt het deel onder water weg).
- `rig.scale`: zelfde maat als de poppetjes (refHeight), alleen vogel en eend ×1,5 zodat ze op zoom 1
  nog te zien zijn. Geen masker (wilde dieren hebben geen spelerkleur).
- Uitvoer `public/assets/dieren/<dier>_<px>.webp` + `<dier>.json`, in het manifest onder `animals`.
  `nice tools/blender/blender -b -P tools/render_sprites.py -- hert konijn vos vogel eend` (~30 min);
  met `--test` per animatie alleen het eerste beeld.
- In het spel (`CFG.animals`, `js/colonists.js`): aantallen, snelheid, straal, wachttijden en de kans
  dat een dier na aankomst gaat liggen of zitten (`rest`, `restWait`). De eend deint altijd. Hert,
  konijn en eend hebben nog een getekende reserve; vos en vogel bestaan alleen in 3D. De lopende eend
  is nog niet in gebruik (eenden blijven op het water).

**Oorspronkelijke ontwerpnotitie duel-sprite**

- Eén krachtpatser-model twee keer, tegenover elkaar op het scherm (links en rechts), met een
  tafeltje of boomstronk ertussen. Samen in één beeld renderen, zodat de ineengegrepen handen
  goed overlappen.
- Masker met twee kanalen: R = spelerkleur-vlakken van de linker figuur, G = die van de rechter;
  het spel kleurt ze per speler in. (Het masker van losse figuren gebruikt nu alle kanalen
  gelijk; het spel leest daar R, dus beide passen in dezelfde omkleurcode.)
- 9 standen, van "links wint bijna" tot "rechts wint bijna": armen scharnieren rond de
  schouders, lichamen leunen mee. Het spel kiest de stand op basis van het duelverloop.
- Alle 9 combinaties van niveaus (1–3 links × 1–3 rechts), dus 81 beelden; één kijkrichting.
- Zelfde camera, licht en maten (24/48/96) als de andere sprites.
- In het script: een tweede soort opdracht naast `models` (bijvoorbeeld `duels`), die twee
  geïmporteerde kopieën neerzet, per figuur de TEAM-materialen een eigen maskermateriaal geeft
  (rood of groen) en een eigen JSON schrijft (per beeld `stand`, `lvlL`, `lvlR`).

**Lokaal renderen (Windows of een andere pc)**

Gebruik dezelfde Blender-versie als de server (4.5 LTS), anders kunnen licht en kleur net verschillen.
Het script werkt met paden ten opzichte van de repo, dus alleen het pad naar Blender verschilt:

```
git pull
"C:\Program Files\Blender Foundation\Blender 4.5\blender.exe" -b -P tools/render_sprites.py -- krachtpatser_1 --test
"C:\Program Files\Blender Foundation\Blender 4.5\blender.exe" -b -P tools/render_sprites.py -- krachtpatser_1
git add public/assets/units public/assets/manifest.json && git commit -m "Spritesheet krachtpatser_1" && git push
```

Draai het vanuit de hoofdmap van de repo. Op de server daarna `git pull`.

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

Modus *Economie* (standaard), *Stresstest* (de oude test met duizenden rondlopende
kolonisten, zonder goederen) of *Duel-test* (krachtpatsers en armpje drukken, zie hieronder). De simulatie loopt met `CFG.ticksPerSec` (20) ticks per seconde,
los van het tekenen.

### Ontwerp en planning

Eigen spel, geïnspireerd door het genre; geen teksten of plaatjes uit bestaande spellen, geen
magie en geen priesters. **De wereld is veganistisch**: geen jacht, visserij, veehouderij of
slachterij, geen vis of vlees. Voedsel komt van akkers, moestuinen en plukken; dieren leven vrij
en tellen mee in de harmonie. Alle getallen staan in `js/config.js`.

| Mijlpaal | Inhoud | Stand |
| --- | --- | --- |
| 1 | Goederen en opslag (stapels, paneel Voorraad) | klaar |
| 2 | Dragers en transport (planner, A*, routecache) | klaar |
| 3 | Bouwen (plaatsen, egaliseren, materiaal, afbreken) | klaar |
| 4 | Beroepen via gereedschap | klaar |
| 5 | Productieketens: hout, steen, graan → meel → brood, bonenakker en moestuin, gaarkeuken (peulvruchten + groente + water → stoofpot), plukkershut (fruit en noten van appelbomen, hazelaars, bessenstruiken; groeien weer aan), droogschuur (fruit + noten → fruit-notenmix), waterput, mijnen met lievelingskost (`CFG.mineFood`), smelterijen, smidse (gereedschap), uitrustingsmaker (ijzer → helm, schild, polsband: statusuitrusting voor hogere niveaus), paneel Productie, werkgebied per gebouw | gepland |
| 6 | Bevolking, gebied en leger: woonhuizen, zichtbare grens, bemande torens, krachthal (kolonisten trainen; niveaus met statusuitrusting) | gepland |
| 7 | Harmonie (0–100 per speler): voederbakken met dierenverzorger, dierenweide, aangeplant bos en bloemenweides verhogen; lege voederbakken en kaalslag verlagen. Dieren vermenigvuldigen bij gevulde voederbakken. Effecten op moed en kracht van soldaten, groei van akkers en bomen, nieuwe kolonisten, en bij hoge harmonie blijven dieren staan bij ertsaders. Meter in het paneel | gepland |
| 8 | Gevechten (zie ontwerpnotitie hieronder) | later |

**Ontwerpnotitie: gevechten (nog niet bouwen)**

- Het gevecht wordt een losse module (bijvoorbeeld `js/combat.js`) met één functie die een duel
  tussen twee eenheden afhandelt: kracht vergelijken, winnaar bepalen. Geen andere code beslist
  over winnen of verliezen.
- Het leger bestaat uit armdrukkers, helers en muzikanten die samen optrekken. Helers zijn een
  soort soldaat (geen gebouw): ze trekken mee met hun groep.
- De verliezer sterft niet: hij keert terug naar de heler van zijn groep (waar die op dat moment
  is) en is een tijd uitgeschakeld.
- Kracht hangt af van niveau (1–3), gevoed zijn en de harmoniemeter van zijn speler; de
  formule en alle getallen staan in de config.
- Gevolgen voor de opbouw van soldaten, kazerne en wapens (mijlpaal 6):
  - elke militaire eenheid heeft een soort (armdrukker, heler, muzikant), niveau, uitrusting,
    of hij gevoed is, zijn groep, zijn thuisplek (kazerne of toren) en een
    "uitgeschakeld tot"-tick, in compacte arrays zoals de andere kolonisten;
  - een groep (leger dat samen optrekt) is een eigen record met zijn leden, zodat een
    verliezer zijn heler kan vinden;
  - de krachthal (gebouwsleutel `kazerne`) traint kolonisten en levert alleen eenheden met die
    velden af; ze rekent zelf geen kracht uit.
- Geen wapens: de uitrustingsmaker (gebouwsleutel `wapensmid`) maakt van ijzer helmen, schilden
  en polsbanden, statusuitrusting voor hogere niveaus. De ijzer- en kolenketen blijft dus nodig.
- De krachtpatsers hebben geen wapen; voor het duel komt een eigen armdruk-sprite (mijlpaal 3).
- Muzikanten ondersteunen de kracht van hun groep binnen een bereik; hoe hoger hun niveau, hoe
  groter dat bereik (getallen in de config).

**Duel-test (krachtpatsers, mijlpaal 4)**

Knop *Duel-test* (of modus Duel-test): op een open veld bij burcht 1 staan per speler 1 en 2 zes
krachtpatsers (`CFG.duel.test.levels`), één heler en een muzikant (rood: doedelzak, blauw: fluit;
`CFG.duel.test.healers`, `musicians`). *Spelen als* kiest welke kant je bestuurt;
*Start* zet de opstelling opnieuw neer.

- Bediening: links slepen = selectierechthoek (max `CFG.army.maxSelect`, 100); klik = één;
  Shift+klik = alle eigen krachtpatsers van dat niveau in beeld; Ctrl+1..9 = groep opslaan (ook
  Alt/Cmd, want sommige browsers houden Ctrl+cijfer voor tabbladen); 1..9 = groep kiezen, twee keer
  kort na elkaar = camera erheen; rechtsklik op een vijandelijke krachtpatser = de dichtstbijzijnde
  geselecteerde daagt hem uit; rechtsklik op de grond = lopen in opstelling; rechts slepen = schuiven;
  Esc = niets geselecteerd. Tooltip boven een krachtpatser: kracht, vermoeidheid, gevoed, uitgeschakeld.
- Aanraken (tablet, telefoon; `CFG.touch`): één vinger = schuiven, twee vingers = knijpend zoomen;
  tik op een eigen eenheid = erbij selecteren (nog eens = eruit); tik met een selectie op een vijandelijke
  krachtpatser = uitdagen, op de grond = lopen; vasthouden en slepen = selectierechthoek; vasthouden op
  een eenheid = alle van dat type in beeld; knop 'Niets geselecteerd'. Een tik toont ook de tooltip.
  In bouwmodus: eerste tik bekijkt de plek, tweede tik op dezelfde plek bouwt of breekt af.
- Opdrachten gaan in een wachtrij (`ARMY.cmd`) en worden in de volgende tick uitgevoerd; de
  selectie zelf is alleen weergave. De duels hebben een eigen toevalsgenerator (`drand`, seed van
  de wereld): dezelfde wereld met dezelfde opdrachten geeft dezelfde afloop.
- Duel (`js/duel.js`): beide lopen naar een stoel links en rechts van een tafelplek tussen hen in;
  zodra beide zitten, vervangt de duel-sprite de twee figuren. `duelStep` vergelijkt elke tick de
  kracht (niveau × gevoed × harmoniemeter × vermoeidheid, `CFG.duel`), met een golvende
  toevalsterm, en schuift de stand −1..+1; de sprite toont stand 1–9 en het balkje erboven
  schuift mee in beide spelerkleuren. Met de huidige getallen duurt een gelijk duel gemiddeld
  ongeveer 9 s; medior wint van junior in ongeveer 3 op de 4, senior van junior in 9 op de 10.
- Afloop: de winnaar loopt terug naar waar hij stond en krijgt er `winTire` (0,2) vermoeidheid bij,
  bovenop wat het duel zelf kostte; herstel in rust gaat langzaam (`rest`, van vol naar fris ruim
  8 minuten). Volle vermoeidheid kost 60% kracht, dus een uitgeputte senior verliest van een frisse
  junior: wie de ene na de andere aanval afslaat, raakt op (meestal binnen 3–5 aanvallen);
  de verliezer loopt doorschijnend en langzamer naar de dichtstbijzijnde eigen heler (zonder heler:
  de eigen burcht) en is daar `CFG.duel.outTicks` (30 s) uitgeschakeld.
- Markering boven geselecteerden: capsule in gezondheids-/vermoeidheidskleur (groen, geel,
  oranje, donkerrood = uitgeschakeld) met 1–3 koperen stipjes voor het niveau, en een ovaal in de
  spelerkleur op de grond.
- **Tijdelijk**: de harmoniemeter is vast (`CFG.duel.harmonyStart`, tot mijlpaal 7), iedereen in
  de test is gevoed, eenheden van de tegenstander doen niets uit zichzelf (geen terugvechten of
  uitdagen) en een eenheid onderweg naar een duel neemt geen loopopdracht aan.
- Heler en muzikant (rol 4 en 5, 3D per niveau): ook te selecteren en te verplaatsen, niet om te duelleren.
  **Muzikantensteun** (`CFG.duel.music`): een eigen muzikant binnen `range[niveau]` tegels (fluit 3,
  harp 5, doedelzak 8) maakt een krachtpatser `bonus` (15%) sterker; meerdere muzikanten tellen niet
  op. Een geselecteerde muzikant toont zijn bereik als stippellijn; de tooltip van een krachtpatser
  zegt 'muziek' als hij steun krijgt.

**Volgende stap: torens veroveren en gebied bij verovering (nog niet bouwen)**

- Bemanning: een toren (en burcht/krachthal) houdt een lijst bewoners bij (krachtpatsers en een
  heler), met een maximum per gebouwtype in de config; bewoners zitten binnen (`S.ins`) en hebben
  het gebouw als thuisplek, zodat de winnaar daarheen terugloopt en een verliezer zijn heler vindt.
- Aanvallen: rechtsklik op een vijandelijke toren met een selectie = opdracht 'aanvallen'. Een
  verdediger komt naar buiten en neemt de uitdaging aan (via dezelfde `challenge`); per aanvaller
  één duel tegelijk, de rest wacht in de buurt. Daarvoor is een kleine verdedigings-AI nodig
  (wie komt eruit, wanneer gaat hij weer naar binnen).
- Verovering: een toren zonder bewoners die niet uitgeschakeld zijn, wordt overgenomen door de
  eerste aanvaller die de deur bereikt: `b.p` wordt de nieuwe speler, de aanvaller gaat naar binnen,
  de vlag wisselt van kleur (sprite-cache per speler), en verliezers van de oude eigenaar gaan naar
  hun eigen dichtstbijzijnde heler of burcht.
- Gebied: `world.own` mag dan niet meer 'wie eerst komt' zijn (`claimLand`), maar moet per tegel
  worden herberekend uit alle bemande gebouwen (dichtstbijzijnde bemande toren wint, burcht gaat
  voor). Gevolgen bij verlies: bouwplaatsen en stapels op verloren grond (afbreken of overnemen,
  config), routes opnieuw (`world.walkVer`), grondchunks opnieuw tekenen (`invalidateTiles`),
  zichtbare grens bijwerken (mijlpaal 6).
- Netwerk/opslag: aanvallen en overnames lopen via de opdrachtenwachtrij, zodat ze deterministisch
  blijven en in een savegame of replay passen.

**Ontwerpnotitie: vrije dragers ontspannen (samen met het hunnebed bouwen)**

- Een drager die een tijdje geen opdracht heeft, gaat soms onder een boom zitten, knielt bij een
  dier dat blijft staan of gaat liggen (knuffelen), of gaat met 3–5 anderen in een kring zitten
  picknicken (kleedje en mand). Komt er werk, dan staat hij op; transport gaat altijd voor.
- Vraagt een zit- en een knielpose in de renderstraat (dezelfde als voor de meditatie) en de
  dierentoestand "ligt bij". Picknicken en knuffelen kunnen een kleine harmoniebijdrage geven
  (config).

**Ontwerpnotitie: school (nog niet bouwen)**

- Gebouw School met beroep Leraar.
- Instellingen per school: aantal leerlingen (2–10), opleidingsduur (kort/middel/lang → niveau
  basis/gevorderd/meester), en of ook bewoners met een beroep mogen gaan (die werken dan
  tijdelijk niet).
- Leerlingen eten wel, werken niet.
- Effect: sneller werken in het beroep, bijdrage aan de harmonie (meester het meest), betere
  helers en muzikanten; optioneel vereist niveau 3 krachtpatser een opleiding. Alle getallen in
  de config.

**Ontwerpnotitie: hunnebed en meditatie (nog niet bouwen)**

- Bijzonder bouwwerk Hunnebed (veel steen), niet te dicht bij werkplaatsen.
- Periodiek komen vrije bewoners in een kring zitten; dieren in de buurt komen erbij liggen.
  Zolang de meditatie loopt, stijgt de harmonie, afhankelijk van het aantal mensen en dieren.
- Gevulde voederbakken in de buurt trekken dieren aan.
- Lawaaiige gebouwen (smidse, mijnen, zagerij) binnen een straal verminderen het effect.
- Instelling: aandeel van de tijd dat bewoners mogen mediteren.
- Beeld: zittende houding, liggende dieren, zachte gloed boven de kring.

**Wat dit vraagt van de opbouw** (houden we nu al rekening mee)

- Instellingen per gebouw (`b.cfg`: leerlingen, duur, toegang; meditatietijd), in hetzelfde
  paneel als de productiekeuze per smidse (mijlpaal 5).
- Per kolonist naast `S.job` een opleidingsniveau (`S.edu`: 0 geen, 1 basis, 2 gevorderd,
  3 meester) en een toestand "leerling" of "mediteert": eet wel, werkt niet; het beroep blijft
  bewaard. Werksnelheid = basis × factor per `S.edu` uit de config.
- Harmonie (mijlpaal 7) als som van bijdragen per bron (voederbakken, wei, bos, bloemen, school,
  hunnebed), zodat nieuwe bronnen er los bij kunnen.
- Gebouwtypes krijgen een eigenschap `noise` (straal) voor lawaai: smidse, mijnen, zagerij.
  Het hunnebed en straks de harmonie gebruiken die; plaatsen controleert de minimale afstand.
- Dieren krijgen een toestand "ligt bij" (een doelpunt), dezelfde die de ertsader-hint gebruikt.
- Zittende kolonisten en liggende dieren: een animatie `sit` in de renderstraat (pose zonder
  skelet, net als lopen) en voor de getekende dieren een liggende variant.

**Ontwerpregel: niveaus** (voor alle militaire en ondersteunende rollen)

| Niveau | Hoofddeksel |
| --- | --- |
| 1 | eenvoudig hoofddeksel zonder versiering |
| 2 | hetzelfde hoofddeksel met een klein messing puntje of knopje bovenop |
| 3 | grote pluim of kam in spelerkleur (materiaal `TEAM_Crest`) |

| Rol | Hoofddeksel | Niveau 2 | Niveau 3 | Verder |
| --- | --- | --- | --- | --- |
| Krachtpatser (armdrukker) | helm | messing puntje | kam in spelerkleur | |
| Muzikant | vilten muts of baret | messing speld | grote veer | instrument: 1 fluit, 2 harp, 3 doedelzak |
| Heler | kap | messing voorhoofdsring | bladerkrans met lint in spelerkleur | |

- Selectiemarkering van een eenheid: naast de gezondheidskleur 1–3 stipjes voor het niveau.
- De wereld is pacifistisch: de rol Soldaat heet Krachtpatser (junior/medior/senior = niveau
  1/2/3: kale helm, helm met piek, hanenkam in spelerkleur). De soldaat-GLB's met zwaard en de
  getekende soldaat worden voor deze rol niet meer gebruikt (bron blijft in `bron/modellen/`).
- Nieuwe 3D-modellen voor muzikant en heler: per niveau een eigen GLB (zoals de soldaten),
  `TEAM_Crest` alleen op niveau 3; de renderstraat kleurt dat vanzelf in spelerkleur.

- **Goederen** (`GOODS` in `js/goods.js`): bouwmaterialen, voedsel, grondstoffen, metalen,
  gereedschap en uitrusting; elk met een eigen getekende sprite.
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
- **Bouwen** (`js/build.js`, getallen in `CFG.build`): kies een gebouw in het paneel Bouwen; op de
  kaart kleurt de voetafdruk groen of rood met de reden in de tooltip (eigen gebied, vlak genoeg,
  geen boom/steen/goederen, ondergrond: mijnen op rots of gebergte, de rest op gras). Esc of de
  rechtermuisknop stopt. Een bouwplaats doorloopt: gravers egaliseren (meer werk naarmate het hoogteverschil
  groter is, de grond verandert zichtbaar), dragers brengen planken en steen, bouwers verwerken ze en
  het gebouw verschijnt van onder naar boven. Gravers en bouwers zijn vrije dragers die eerst een schop
  of hamer uit de voorraad halen. Afbreken geeft de helft van het verwerkte materiaal terug; dat en wat er
  nog lag, brengen dragers naar de opslag. De burcht kan niet gebouwd of afgebroken worden.
  Afgebroken gebouwen blijven in `world.blds` staan met `dead`, zodat indexen geldig blijven.
- **Beroepen** (`CFG.jobs`, `js/jobs.js`): elk voltooid werkgebouw krijgt een vakman. Eerst een werkloze
  vakman met dat beroep, anders een vrije drager die het gereedschap uit de voorraad haalt (bijl, zaag,
  houweel, hamer, schop, zeis; molenaar, bakker, smelter en smid hebben niets nodig).
  Hij loopt naar de deur, gaat naar binnen en de vlag verschijnt. Er blijven altijd `CFG.carry.keepFree`
  vrije dragers per speler over. Bij afbreken komt de bewoner naar buiten en houdt zijn beroep.
  Uiterlijk (`JOBLOOK` in `js/units.js`): de vrije drager met hoed, schort en gereedschap of een
  kenmerkend goed in de hand; sprites worden pas gemaakt als ze nodig zijn (`jobSprite`).
- **Tijdelijk** (`CFG.territory`): eigen gebied is een straal rond de burcht en elke voltooide wachttoren
  (vrij land, wie eerst komt; afbreken neemt geen gebied weg); de grens is alleen als stippen te zien tijdens bouwen of afbreken.
- **Tijdelijk** (`CFG.temp`): zolang er geen productie en bouw is, vragen gebouwen een vaste
  hoeveelheid goederen en verbruiken ze elke 30 s één stuk voedsel, water of boomstam
  (de mijnen alvast hun lievelingskost: brood, stoofpot of fruit-notenmix).

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
