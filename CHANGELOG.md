# Changelog

Wat er per dag is veranderd, voor spelers en makers. Nieuwste bovenaan. Mijlpalen: zie
[docs/roadmap.md](docs/roadmap.md); de redenen achter keuzes: [docs/beslissingen.md](docs/beslissingen.md).

## 2026-11-03

### Toegevoegd (mijlpaal 9a)
- **Computerburen bouwen hun dorp.** Jij speelt rood; de andere kleuren bouwen zelf, met dezelfde regels: eerst hout en
  steen, dan woonhuizen, eten, mijnen en torens naar erts, bos of steen. Hun plan staat in het paneel Productie als je
  hun kleur kiest. Vinkje *Buren bouwen zelf* om het uit te zetten.
- **Geschilderde goederen**: boomstam, water en bijl zijn nu geschilderd, op stapels, in de handen van dragers, in de
  panelen en in de handleiding. De andere goederen volgen (opdracht: [docs/artwork/goederen-opdracht.md](docs/artwork/goederen-opdracht.md)).
- Paneel Productie: een oog per regel brengt je langs de gebouwen van die soort, met hun tooltip.

### Verbeterd
- Rook komt recht uit de schoorsteen; molenwieken staan boven de deur, met de as in de richting van de deur.

### Toegevoegd (mijlpaal 8c)
- **Paneel Krachtpatsers.** Reserve van de krachthal (0 tot 12) en een knop *Neem er een aan*; het aantal muzikanten.
- **Verplaatsen.** Klik een toren of krachthal en dan een ander eigen gebouw: de krachtpatsers lopen erheen. Een volle
  toren ruilt met de zwakste daar; de laatste van een toren kan niet weg. Onderweg blijft de oude toren bemand.
- **Train eerst.** Kies wie in de krachthal voorgaat; wie uit een toren naar de hal komt, gaat vanzelf voor.
- **Muzikanten in het dorp.** De krachthal leidt ze op. Bij een grensduel loopt van beide kanten een muzikant mee en het
  duel begint pas als hij er is (hoogstens 2 minuten wachten); hij maakt zijn krachtpatser 15% sterker.

### Gewijzigd
- De keuze voor de reserve staat niet meer in het paneel Productie, maar in het nieuwe paneel Krachtpatsers.

## 2026-11-02

### Toegevoegd (mijlpaal 8b)
- **Buren vragen zelf om grond.** Mist een buur een erts dat net over de grens op jouw grond ligt, dan vraagt hij een
  strook tot dat erts en biedt er goederen voor. Milo meldt het, de strook knippert op de kaart; in het paneel kies je
  Bekijken, Aannemen, één keer Meer vragen, of Afwijzen.
- **Grensduel.** Na een afgewezen voorstel kun je uitdagen: van beide kanten komt de sterkste krachtpatser uit de
  dichtstbijzijnde toren, ze drukken armpje aan een tafel op de grens, en wint de jouwe, dan is de strook van jou.
  Een uitdaging kost relatie. Torens blijven bemand zolang hun krachtpatser buiten is.

### Gewijzigd
- Grond ruilen: hoogstens 150 tegels per kant (was 60). Teken je meer aan, dan blijven de tegels het dichtst bij
  de grens, in plaats van de laatst aangetekende.

### Toegevoegd
- **Ruil-test.** Knop onder *Modus*: een economie waarin de hele kaart meteen over de burchten verdeeld is,
  zodat je zonder torens te bouwen aan je buren grenst en grond ruilen kunt proberen.
- **Werkgebied verzetten.** Knop *Werkgebied* onder het bouwpaneel: klik op een houthakker, steenhouwer, bosbouwer,
  plukker, boerderij, bonenakker of moestuin en dan op het nieuwe midden. De cirkel blijft even groot en mag tot 2×
  zijn straal van het gebouw liggen; een stippellijn wijst naar het gebouw. Klik op het gebouw zelf zet hem terug.
- **Mijlpaal 8a: grond ruilen.** Paneel *Buren: grond ruilen*: teken op de kaart een stuk grond van een buur aan,
  bied eigen grond en/of goederen, en doe een voorstel. Je buur rekent uit wat de grond hem waard is (erts, bos,
  akkers, nabijheid van zijn burcht) en neemt aan, wijst af met een reden, of doet een tegenbod. Een afspraak gaat
  boven het gebied uit torens. Elke ruil maakt de relatie sterker (onbekend, kennis, vriend, bondgenoot).
  In de handleiding bij Buren.

### Gewijzigd
- Torens worden niet meer veroverd: grond wisselt alleen via een afspraak, of straks via een grensduel
  (zie docs/beslissingen.md).

### Opgelost
- De tegelregel onderin en de tooltips in bouwmodus vielen weg boven struiken en akkers (een variabele heette
  hetzelfde als de vertaalfunctie `t`).
- Duel-test: sinds mijlpaal 6c liepen krachtpatsers niet meer (hun positie werd ongeldig) en was het maximum voor
  selecteren weg, omdat `CFG.army` twee keer in de config stond.

## 2026-11-01

### Toegevoegd
- **Vakmensen in 3D**: 17 beroepen lopen met hun eigen 3D-figuur en loopclip (houthakker, boer, bakker, smid, …).
  Aan het werk staan houthakker, steenhouwer, bosbouwer, boer, tuinier, plukker, graver en bouwer in hun eigen
  werkhouding met gereedschap (de boer maait of zaait, de bosbouwer graaft en plant).
- Geschilderde molenwieken (3D-model, 24 draaistanden) in plaats van de getekende.
- Bouwmenu: rechtsboven in elk vakje hoeveel je van dat gebouw hebt.
- **Mijlpaal 7: harmonie.** Een meter van 0 tot 100 bovenaan het paneel Productie. Voederplaats (met
  dierenverzorger en graan), dierenweide (jonge dieren) en bloemenweide verhogen hem; een lege voederplaats en
  kaalslag verlagen hem. Gevolgen voor groei, nieuwe bewoners, duelkracht en dieren bij ertsaders.
- **De adviseur**, Milo: rechtsonder in beeld, met adviezen over voedsel, bouwplaatsen, gereedschap, lege
  gebouwen, mijnen, dragers en torens, en complimenten bij je eerste planken, brood en toren. Knoppen *Laat zien*,
  *Handleiding* en *Begrepen*; instelbaar in de zijbalk. Ook in hoofdstuk 2 van de handleiding.
- **Mijlpaal 6c: krachthal.** Leidt vrije dragers op tot krachtpatser en traint ze met helm (niveau 2) of
  schild en polsband (niveau 3). Reserve instelbaar in het paneel Productie (0, 2, 4 of 8).
  Krachtpatsers bemannen de wachttorens (2 per toren); de tijdelijke wachter is weg.
- **Mijlpaal 6b: gebied.** Gebied komt alleen van bemande gebouwen; de grens is altijd zichtbaar, ook
  op het minikaartje. Waarschuwing vooraf bij het afbreken van een bemande toren.
- Handleiding (`/handleiding/`, knop *Handleiding* of F1): twaalf hoofdstukken en twee bijlagen,
  zoeken, printbare pdf, tabellen en ketens uit de config, schermafbeeldingen uit het spel.
- Basis voor vijf talen (NL, EN, FR, DE, ES): alle namen via `t()`.
- Geschilderde voedselgebouwen (gaarkeuken, droogschuur, waterput, moestuin, bonenakker, plukkershut).
- Geschilderde rookwolkjes uit de schoorstenen van bakkerij, gaarkeuken en smelterijen, alleen
  terwijl ze werken.
- Bevestiging vragen bij herladen of sluiten tijdens een lopend spel (er is nog geen savegame).
- Projectdossier in `docs/`, met herkomst van alle beelden en modellen.

### Gewijzigd
- Het spel heet **Terrana**: in de zijbalk, de titel van het tabblad, de handleiding, de README en de docs; de pdf heet nu `handleiding.pdf` (downloaden als `terrana-handleiding.pdf`).
- Gebied blijft na het afbreken van een toren; alleen het deel binnen de straal van een bemande toren
  van een buur gaat naar die buur.
- Wachttoren straal 13 (burcht 20); startvoorraad bij "normaal" 4 zeisen.
- Mijnwerkers eten elke maaltijd; hun lievelingskost is goed voor twee rondes.
- Startmijnen hebben altijd erts binnen bereik en staan bij voorkeur binnen het gebied.
- De krachthal staat als eerste in het startdorp (vond eerder vaak geen plek).
- Ondertitel in de zijbalk zonder de verouderde "Fase 1c".
- De ontwerpnotities zijn van de README naar `docs/` verhuisd.

### Opgelost
- Bouwmodus tekende niet meer (sinds 6b).
- Zoomen met + en − op het toetsenbord werkte niet, hoewel de hint onderin het noemde.
- `build-images.php` zette het versienummer `v` niet in het manifest, waardoor browsers een oude
  afbeelding konden blijven tonen.
- Bij opnieuw uitzetten van kolonisten op dezelfde kaart bleef de oude torenbemanning staan.

## 2026-10-31

### Toegevoegd
- **Mijlpaal 1–4:** goederen en opslag, dragers en transport (planner, A*, routecache), bouwen
  (plaatsen, egaliseren, afbreken), beroepen via gereedschap.
- **Mijlpaal 5a–5c:** productie van hout en steen, voedsel (akkers, plukken, molen, bakkerij,
  gaarkeuken, droogschuur, waterput), mijnen, smelterijen, smidse en uitrustingsmaker.
- **Mijlpaal 6a:** woonhuizen krijgen met voedsel nieuwe bewoners.
- Renderstraat voor 3D-figuren (Blender), krachtpatsers in drie niveaus, drager, heler, muzikant en
  dieren in 3D.
- Duel-test: armpje drukken met selecteren, groepen, heler, muzikantensteun en aanraakbediening.
- Eén opdrachtenwachtrij voor bouwen en leger.
- Meten met `?prof=1`; sneller tekenen met vooraf verkleinde sprites en een chunk-cache.

### Gewijzigd
- Veganistische wereld: geen vis, vlees, hengel, visser of jager.
- Geen wapens: helm, schild en polsband; kazerne heet krachthal, wapensmid heet uitrustingsmaker.
- Kruidenhuis voorlopig uit het spel.

## 2026-10-30

### Toegevoegd
- Eerste versie online: projectstructuur (`public/` als webroot, `bron/`, `data/`, `tools/`, `lib/`).
- Afbeeldingen als losse webp's met `manifest.json`; grondtexturen.
- PHP-API voor maps en savegames (SQLite).
- Zes nieuwe gebouwen en mijnplaatsing.
