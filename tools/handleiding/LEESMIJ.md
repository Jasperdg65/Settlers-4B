# Handleiding maken

- `<taal>/bron.html`: de tekst (alleen de hoofdstukken); `<taal>/teksten.js`: wat de generator zelf schrijft (koppen,
  tabelkoppen, zinnen over gebouwen, schemalabels). `pagina.html` is de schil (`{{T.sleutel}}` uit `teksten.js`).
  Nederlands komt op `/handleiding/`, een andere taal op `/handleiding/<taal>/`.
- `maak.js [taal ...]`: maakt de pagina('s). Opmaakcodes in `bron.html`:
  - `{{uitdrukking}}`: waarde uit het spel, bijvoorbeeld `{{CFG.prod.zagerij.ticks}}`. Hulpjes:
    `sec(ticks)` (“8 seconden”), `naam(gebouw)`, `goed(sleutel)`, `kosten(gebouw)`, `getal(n)`, `lijst([...])`.
  - `<!--gen:soort args-->`: `kosten <gebouwen>`, `keten <gebouwen>` (SVG-schema), `startvoorraad`, `beroepen`,
    `dorp`, `gebouwen`, `goederen`.
  - `<!--shot:naam|bijschrift-->`: `img/<taal>/naam.jpg` uit `schermen.js`.
  - `[[komt:beschrijving]]`: label “Komt eraan”; de beschrijvingen komen in de README.
  - Een hoofdstuk is `<section class="hoofdstuk" id="...">` met één `<h2>`; paragrafen zijn `<h3>`.
- `schermen.js [--taal=xx]`: schermafbeeldingen uit vaste scènes (seed *vathorst*) via headless Chrome, in `img/<taal>/`;
  `node schermen.js dorp grens` maakt alleen die scènes. Ook de goederenicoontjes (`img/goed/*.png`), uit dezelfde tekenfunctie als in het spel.
- `pdf.js [taal ...]`: de pdf per taal met de print-CSS.
- `alles.sh`: alle drie achter elkaar.

De browser staat op het grote volume (`KOLONIE_BROWSER`, standaard `/mnt/HC_Volume_105876660/kolonie/browser`);
het adres van het spel is `KOLONIE_URL` (standaard de live site).
