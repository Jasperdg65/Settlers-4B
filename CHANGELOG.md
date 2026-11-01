# Changelog

Wat er per dag is veranderd, voor spelers en makers. Nieuwste bovenaan. Mijlpalen: zie
[docs/roadmap.md](docs/roadmap.md); de redenen achter keuzes: [docs/beslissingen.md](docs/beslissingen.md).

## 2026-11-01

### Toegevoegd
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
