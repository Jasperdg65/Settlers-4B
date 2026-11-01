# Handleiding maken

- `bron.html`: de tekst (alleen de hoofdstukken; `pagina.html` is de schil met kop, zoekveld en inhoudsopgave).
- `maak.js`: maakt `public/handleiding/index.html`. Opmaakcodes in `bron.html`:
  - `{{uitdrukking}}`: waarde uit het spel, bijvoorbeeld `{{CFG.prod.zagerij.ticks}}`. Hulpjes:
    `sec(ticks)` (“8 seconden”), `naam(gebouw)`, `goed(sleutel)`, `kosten(gebouw)`, `nl(getal)`, `lijst([...])`.
  - `<!--gen:soort args-->`: `kosten <gebouwen>`, `keten <gebouwen>` (SVG-schema), `startvoorraad`, `beroepen`,
    `dorp`, `gebouwen`, `goederen`.
  - `<!--shot:naam|bijschrift-->`: `img/naam.webp` uit `schermen.js`.
  - `[[komt:beschrijving]]`: label “Komt eraan”; de beschrijvingen komen in de README.
  - Een hoofdstuk is `<section class="hoofdstuk" id="...">` met één `<h2>`; paragrafen zijn `<h3>`.
- `schermen.js`: schermafbeeldingen uit vaste scènes (seed *vathorst*) via headless Chrome; `node schermen.js dorp grens`
  maakt alleen die scènes. Ook de goederenicoontjes (`img/goed/*.png`), uit dezelfde tekenfunctie als in het spel.
- `pdf.js`: de pdf met de print-CSS.
- `alles.sh`: alle drie achter elkaar.

De browser staat op het grote volume (`KOLONIE_BROWSER`, standaard `/mnt/HC_Volume_105876660/kolonie/browser`);
het adres van het spel is `KOLONIE_URL` (standaard de live site).
