# School en hunnebed

Opleiding, meditatie en ontspanning: bronnen van harmonie naast de natuur. Nog niet gebouwd; zie [harmonie.md](harmonie.md) en [../roadmap.md](../roadmap.md).

## Ontwerpnotitie: vrije dragers ontspannen (samen met het hunnebed bouwen)

- Een drager die een tijdje geen opdracht heeft, gaat soms onder een boom zitten, knielt bij een
  dier dat blijft staan of gaat liggen (knuffelen), of gaat met 3–5 anderen in een kring zitten
  picknicken (kleedje en mand). Komt er werk, dan staat hij op; transport gaat altijd voor.
- Vraagt een zit- en een knielpose in de renderstraat (dezelfde als voor de meditatie) en de
  dierentoestand "ligt bij". Picknicken en knuffelen kunnen een kleine harmoniebijdrage geven
  (config).

## Ontwerpnotitie: school (nog niet bouwen)

- Gebouw School met beroep Leraar.
- Instellingen per school: aantal leerlingen (2–10), opleidingsduur (kort/middel/lang → niveau
  basis/gevorderd/meester), en of ook bewoners met een beroep mogen gaan (die werken dan
  tijdelijk niet).
- Leerlingen eten wel, werken niet.
- Effect: sneller werken in het beroep, bijdrage aan de harmonie (meester het meest), betere
  helers en muzikanten; optioneel vereist niveau 3 krachtpatser een opleiding. Alle getallen in
  de config.

## Ontwerpnotitie: hunnebed en meditatie (nog niet bouwen)

- Bijzonder bouwwerk Hunnebed (veel steen), niet te dicht bij werkplaatsen.
- Periodiek komen vrije bewoners in een kring zitten; dieren in de buurt komen erbij liggen.
  Zolang de meditatie loopt, stijgt de harmonie, afhankelijk van het aantal mensen en dieren.
- Gevulde voederbakken in de buurt trekken dieren aan.
- Lawaaiige gebouwen (smidse, mijnen, zagerij) binnen een straal verminderen het effect.
- Instelling: aandeel van de tijd dat bewoners mogen mediteren.
- Beeld: zittende houding, liggende dieren, zachte gloed boven de kring.

## Wat dit vraagt van de opbouw (houden we nu al rekening mee)

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

## Open vragen

- Komen school en hunnebed in mijlpaal 7 (harmonie) of in een eigen mijlpaal?
- Vereist niveau 3 krachtpatser een opleiding (optie in de notitie hierboven)?
- Hoeveel steen kost een hunnebed, en hoe groot is de afstand tot lawaaiige gebouwen?
