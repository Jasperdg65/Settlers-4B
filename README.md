# Terrana

Browsergame "Terrana" (projectnaam Settlers 4B, eerst "Kolonie"), een vreedzaam bouwspel over samenwerking, zorg en harmonie, op
https://doc.dgol.eu/settlers4b/. Plain HTML, CSS en JavaScript, met een kleine PHP-API (SQLite) voor
maps en savegames.

## Projectdossier

Ontwerp, beslissingen en planning staan in [`docs/`](docs/) (niet via het web bereikbaar):

| Document | Inhoud |
| --- | --- |
| [docs/visie.md](docs/visie.md) | waar het spel om draait, en wat het niet is |
| [docs/beslissingen.md](docs/beslissingen.md) | logboek: datum, besluit, waarom |
| [docs/roadmap.md](docs/roadmap.md) | mijlpalen en hun stand |
| [CHANGELOG.md](CHANGELOG.md) | wat er per dag veranderd is |
| [docs/ontwerp/](docs/ontwerp/) | economie, harmonie, school en hunnebed, krachtpatsers, buren en diplomatie, Tuin van Verbondenheid, kaartgenerator |
| [docs/techniek/architectuur.md](docs/techniek/architectuur.md) | mappen en bestanden, prestaties, API |
| [docs/techniek/renderstraat.md](docs/techniek/renderstraat.md) | geschilderde afbeeldingen en de 3D-renderstraat |
| [docs/techniek/deploy.md](docs/techniek/deploy.md) | installeren, bijwerken, webserver, back-up |
| [docs/artwork/herkomst.csv](docs/artwork/herkomst.csv) | herkomst van alle beelden en modellen |
| [docs/artwork/goederen-opdracht.md](docs/artwork/goederen-opdracht.md) | opdracht voor de illustrator: schilderingen van de goederen |

## In het kort

- `public/` is de webroot; `public/js/config.js` bevat alle getallen voor de balans.
- Deterministische simulatie met 20 ticks per seconde; spelers veranderen de wereld alleen via
  opdrachten (`js/orders.js`).
- Werkwijze: in mijlpalen, één commit per mijlpaal, met een stop voor beoordeling.

## Talen

Terrana wordt meertalig: Nederlands (brontaal), Engels, Frans, Duits en Spaans.

- **Taalbestanden**: `public/lang/<taal>.js` vult `TALEN.<taal>` met vaste sleutels (`bld.houthakker`, `goed.plank`,
  `job.boer`, `ter.3`, …). `js/i18n.js` kiest de taal (`?lang=xx`, anders de vorige keuze, anders de browsertaal,
  anders nl) en geeft `t('sleutel', {waarden})`; `{naam}` in een tekst wordt ingevuld. Ontbreekt een sleutel, dan valt
  `t()` terug op het Nederlands. Getallen met `getal(n)` of `toLocaleString(LOC())`.
- **Wat al via `t()` gaat**: alle namen (gebouwen, goederen en hun groepen, beroepen, terrein, erts, bomen, struiken,
  gewassen, rollen, niveaus, instrumenten). De handleiding haalt dezelfde namen uit het spel, dus de woorden zijn overal gelijk.
- **Nog Nederlands in de code** (mijlpaal 14): de zijbalk in `index.html` (ongeveer 60 teksten), statusmeldingen en
  tooltips in `production.js`, `build.js`, `transport.js`, `input.js`, `army.js`, `duel.js`, de panelen in `ui.js`,
  `stock.js`, `custom.js` en meldingen in `loop.js` (samen ongeveer 120). Statusmeldingen (`b.ps`) worden dan een code
  met waarden, zodat de tekst pas bij het tonen in de juiste taal wordt gemaakt.
- **Regel vanaf nu**: nieuwe tekst die een speler ziet, gaat via `t()` met een sleutel in `lang/nl.js`; geen nieuwe
  Nederlandse tekst in de code.
- **Een taal toevoegen**: `public/lang/xx.js` (alle sleutels van nl.js; `node tools/talen.js` meldt wat ontbreekt) en een
  `<script>` in `index.html`; voor de handleiding `tools/handleiding/xx/bron.html` en `xx/teksten.js` (zelfde velden als
  `nl/teksten.js`). De handleiding komt dan op `/handleiding/xx/`, met een taalkeuze bovenaan, en `schermen.js --taal=xx`
  maakt de schermafbeeldingen in die taal.
- **Woordenlijst**: de adviseur heet in elke taal Milo (`adv.naam` niet vertalen). Eigen begrippen (krachtpatser, krachthal, heler, hunnebed, Tuin van Verbondenheid, lievelingskost)
  krijgen per taal één vaste vertaling, vast te leggen in de taalbestanden voordat de handleiding wordt vertaald.

## Handleiding

`public/handleiding/` is een losse pagina (in het spel: knop *Handleiding* of F1) met een printbare pdf.
De tekst staat per taal in `tools/handleiding/<taal>/bron.html` (met `teksten.js` voor wat de generator
zelf schrijft); tabellen, ketenschema's, namen en getallen komen uit het spel (config, manifest, `lang/`). Na elke wijziging aan spel of tekst:

```
node tools/handleiding/schermen.js    # schermafbeeldingen uit vaste scènes (seed vathorst), headless Chrome (--taal=xx)
node tools/handleiding/maak.js        # index.html uit bron.html + config + manifest
node tools/handleiding/pdf.js         # handleiding.pdf (print-CSS, download als <spelnaam>-handleiding.pdf), headless Chrome
```

Of alles tegelijk: `tools/handleiding/alles.sh`. Zie `tools/handleiding/LEESMIJ.md` voor de opmaakcodes.

**Komt eraan** (automatisch bijgehouden uit de labels in de handleiding):

<!-- komt:begin -->
- De Tuin van Verbondenheid als gezamenlijk einddoel (mijlpaal 12)
- Computerburen met een eigen karakter en moeilijkheidsgraad (mijlpaal 9b)
- Natuurgebeurtenissen: droogte, winter, overstroming
- Opslaan en laden van de hele wereld
- Bewoners die doorlopend eten
- School (opleiding instellen) en hunnebed (samen mediteren met dieren)
- Helers in het dorp, en muzikanten van een hoger niveau
- Handel via een marktplaats en handelaar (mijlpaal 10)
- Diplomatie: relaties, geschenken, feesten en vrede (mijlpaal 11)
- Kaartinstelling onderlinge afhankelijkheid
- Kaarteditor
<!-- komt:end -->
