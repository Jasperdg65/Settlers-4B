# Renderstraat en afbeeldingen

Geschilderde afbeeldingen (manifest, `build-images.php`) en de 3D-renderstraat (Blender, `render_sprites.py`). Herkomst per bestand: [../artwork/herkomst.csv](../artwork/herkomst.csv).

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
| `smoke` | schoorsteentop (fractie van het beeld). Alleen bij gebouwen die stoken (bakkerij, gaarkeuken en smelterijen), en alleen tijdens een batch; formaat en tempo in `CFG.smoke` |
| `src` | bron-PNG in `bron/` |
| `px` | doelmaat bij genereren: breedte in pixels (gebouwen) of hoogte (natuur) |
| `v` | inhoudshash; wordt door `build-images.php` gezet, voor cache-busting |
| `keep` | webp is met de hand bewerkt; `build-images.php` slaat hem over (reden als tekst) |

Texturen (`textures`) hebben alleen `file`, `src`, `px` (512) en `v`. De
sleutels deep, shallow, sand, grass, rock en aarde (paden) zijn alle zes nodig.

Effecten (`effects`) zijn spritebladen. `rook` komt uit `bron/rook/rook_spriteblad.png`
(4 × 4 beelden van 256 px, met LEESMIJ en afspeelvoorbeeld): `build-images.php` snijdt alle
beelden op hetzelfde kader bij, zodat het anker (`ax`, `ay` in bronpixels, boven de
schoorsteenopening) gelijk blijft, en schaalt ze naar `px` breed. Het zet zelf `fw`, `fh`
(beeldmaat in het blad), `sw` (bijgesneden breedte / celbreedte) en `fx`, `fy` (anker als fractie).
In het spel start elke `CFG.smoke.every` ms een nieuw pufje met `frameMs` per beeld; lukt
het laden niet, dan blijven de getekende cirkels.

Interface (`ui`, nu de adviseur): bron in `bron/adviseur/`, uitvoer `<file>_1x.webp` (`px` breed) en
`<file>_2x.webp`. Regels met dezelfde `kader` (de drie hoofden) worden op één gezamenlijk kader bijgesneden,
zodat het hoofd bij het wisselen van uitdrukking niet verspringt. De rol (`adviseur_rol`) is een 9-slice voor
CSS `border-image`: `slice` (boven, rechts, onder, links, in procenten van het beeld) houdt de vier hoeken
met de krullen vast, de randen en het midden rekken mee met de tekst. Procenten gelden voor 1x en 2x gelijk;
de randbreedtes in `kolonie.css` zijn slice × maat van de 1x-rol (480 × 176). Het spel zet `?v=` uit het
manifest achter elke url (de map `assets/` wordt een jaar gecachet).

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

**Vakmensen met een eigen loopclip** (`ambacht_<beroep>` in `models`, `"clip": "Walk"`)

- Bron: `bron/ambachten/modellen/<beroep>_lopen.glb` (17 beroepen, met LEESMIJ, voorbeelden en broncode). Rigide
  onderdelen in een hiërarchie met een eigen clip Walk van 1 s (24 beelden), in-place, voorkant −y na import.
- Met `clip` laat de renderstraat de hiërarchie heel (geen losse onderdelen, geen nagebootste scharnieren) en
  speelt de clip af: `walk` = 8 beelden gelijk verdeeld over de clip, `idle` = het moment `idle` (standaard 0,25 van
  de clip), waarop de voeten het dichtst bij elkaar staan.
- Uitvoer zoals de andere poppetjes (`units/ambacht_<beroep>_<px>.webp` + masker + JSON), ~12 minuten per model.
- In het spel (`job3D` in `js/units3d.js`): het model van `CFG.jobs[job].k`; geladen pas als zo'n vakman voor het eerst
  getekend wordt (samen ruim 10 MB). Zonder model (dierenverzorger) blijft het getekende figuurtje.

**Werkhoudingen** (`werk_<beroep>_<houding>` in `models`, `"static": true`, `"extra"`)

- Bron: `bron/modellen/<beroep>_<houding>.glb` (alleen de figuur, met lege nodes GRIP_LEFT/GRIP_RIGHT) en
  `<beroep>_<houding>_gereedschap.glb` (werktuig, boompje of mand, al op zijn plek bij de houding); overzicht in
  `bron/modellen/beroepen.json` en `LEESMIJ_werkhoudingen.txt`. 11 houdingen voor 8 beroepen, zonder animatie.
- `static`: de hiërarchie blijft heel, er wordt niets bewogen; alleen `idle` in 8 richtingen. `extra`: losse GLB's die
  op hun eigen plek mee worden ingeladen (hier het gereedschap). Een paar minuten per houding.
- In het spel (`work3D` in `js/units3d.js`, tabel `WORK3D`): de houding zolang de vakman buiten werkt (`ST.GATHER`) of op
  een bouwplaats (`ST.WORK`). Akker: rijp = oogsten (boer maaien, tuinier oogsten), anders zaaien of verzorgen; de
  bosbouwer graaft de eerste helft van zijn werktijd en plant de tweede. Ook lui geladen. Zonder houding (bv. mijnwerker,
  binnen aan het werk) blijft de stilstand van het loopmodel.

**Molenwieken** (`spinners` in `tools/sprites.json`, `tools/render_wieken.py`)

- Bron: `bron/molen wieken/molen_wieken.glb` (vier wieken met zeildoek en hekwerk; oorsprong = naaf, as naar de kijker,
  object `WIEKEN_ROTATOR` draait). Zelfde camera en licht als de poppetjes; `render_wieken.py` gebruikt de hulpfuncties
  van `render_sprites.py`.
- De wieken zijn viervoudig symmetrisch, dus een kwartslag is genoeg: `frames` (24) standen, linksom gezien van voren.
  `yaw` (−20°) draait ze iets naar links, zoals de molen. Per maat (64, 128, 256 px per beeld) één WebP van 6 × 4
  beelden, plus `effects/molenwieken.json` (met `view` en `radius`: hoe groot de wieken in het beeld zijn); in het
  manifest onder `spinners`. Een paar minuten in totaal.
- In het spel (`loop.js`, `SAILS` uit `assets.js`): op de naaf (`hub`) van de molen, even lang als de getekende wieken
  (`CFG.mill.arm`), stand uit de tijd (`CFG.mill.turn`), maat naar zoom × schermdichtheid. Zonder blad: de getekende wieken.

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
