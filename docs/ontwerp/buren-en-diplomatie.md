# Buren en diplomatie

Solo tegen computerburen, handel en diplomatie (mijlpaal 9 tot 11). Nog niet gebouwd; de opdrachtenwachtrij waar het op leunt bestaat al.

## Ontwerpnotitie: speelvorm solo tegen computerburen (nog niet bouwen)

- Het spel is **solo**: één mens tegen computerburen, geen multiplayer.
- Computerburen volgen exact dezelfde spelregels en economie als de speler, zonder gratis goederen.
  Ze draaien in een **Web Worker**.
- Elke buur heeft een **karakter** (onder andere gul, zuinig, trots, voorzichtig) met instelbare
  eigenschappen in de config.
- Ze houden hun overschotten en tekorten bij en doen zelf **handels- en hulpvoorstellen**, met een
  korte, leesbare uitleg voor de speler ("We hebben veel steen over maar komen brood tekort").
- **Geheugen** per buur: eerlijk handelen, nagekomen afspraken en hulp bij natuurrampen verbeteren
  de relatie; een gebroken afspraak verslechtert hem een tijd.
- Bijdrage aan de Tuin van verbondenheid naar vermogen en karakter.
- De startrelaties verschillen; sommige buren moeten gewonnen worden.
- **Moeilijkheidsgraad**: hoe zelfstandig de buren zijn en hoe snel ze vertrouwen geven.

## Mijlpaal 9a: buren bouwen hun dorp (gebouwd 3 november 2026)

- `world.human` = 0 (rood); elke andere kleur is een computerbuur. *Bouwen als* is verborgen (blijft voor tests).
- **Brein** (`js/ai.js`, `aiThink`): puur rekenwerk op een samenvatting van alleen het eigen dorp (`aiSummary` in
  `js/neighbours.js`: voorraad, gebouwen per soort, eigen grond met bomen en steenblokken, erts, vrije dragers,
  krachtpatsers in reserve, harmonie, gereedschap). Draait in een Web Worker (`js/ai-worker.js`), elke `CFG.ai.every`
  ticks; zonder Worker of met `AI.sync` (tests) direct. Geeft `{bouw: {type, doel, reden}}` of `{wacht: …}`, plus zo nodig
  `maak` (wat de smidse moet maken).
- **Handen** (`aiSpot`, hoofdthread): zoekt op eigen grond de beste plek per doel (bos, steen, akker, erts, grens, dorp),
  met een exacte telling van het werkgebied, en geeft een gewone opdracht `place` (en `make` voor de smidse).
- Regels in volgorde: hout en steen (met bouwmateriaal apart zolang die ontbreken), woonhuizen bij weinig vrije dragers,
  brood, mijnen op eigen erts met eten voor mijnwerkers, torens naar ontbrekend erts, bos of steen of als het land vol
  raakt, harmonie, opslag, en doorgroeien met genoeg planken en steen. Geen plek: dat gebouw `skipTicks` overslaan.
- Bekende grens: een buur die ingesloten is en geen gereedschap meer heeft, komt pas verder als zijn smidse ijzer krijgt
  (mijnen, eten, smelterij). Een verstandige ruil met de speler kan dat later oplossen (9b, 10).

## Wat de computerburen vragen van de opbouw

- **Eén opdrachtenwachtrij** (`js/orders.js`, al gebouwd): `order({p, t, ...})` is de enige weg waarlangs
  een speler de simulatie verandert, voor mens en computer gelijk. Opdrachten worden op een
  tickgrens uitgevoerd en gecontroleerd alsof ze van een onbekende komen (eigenaar, gebied,
  materiaal). Nu: `place`, `demolish`, `make`, `keep`, `move`, `duel`, en voor grond ruilen `propose`, `accept`,
  `reject` (mijlpaal 8a, [grond-ruilen.md](grond-ruilen.md)). Later: handel, geschenk, en de instellingen per gebouw (school).
- De mens is speler 0 (`world.human`); elke andere speler is een computerbuur met een eigen
  karakter (`world.ai[p]`). Wat in panelen nu "speler kiezen" heet (voorraad, bouwen, Spelen als),
  is een testhulp en verdwijnt dan.
- **Web Worker**: de simulatie blijft in de hoofdthread. De worker krijgt per beurt (bijvoorbeeld
  elke seconde) een compacte, alleen-lezen samenvatting van wat die buur mag weten (eigen voorraad,
  gebouwen, gebied, bekende buren en relaties) en stuurt opdrachten terug. Die opdrachten gaan
  met het tickgetal waarop ze binnenkomen de wachtrij in. Zo hoeft de worker de hele wereld niet
  te kennen en kan hij niet vals spelen.
- Afspraken (leveren, helpen, grens respecteren) worden records met een looptijd en een controle
  die de simulatie zelf doet; het geheugen per buur telt nagekomen en gebroken afspraken.
- Voorstellen van een buur zijn ook opdrachten (`propose`) met een uitlegtekst; de speler
  antwoordt met een opdracht (`accept`/`reject`).

## Handel en diplomatie (uit de notitie over het hoofddoel)

- **Handel**: een marktplaats met een handelaar die met een handkar over land of met een bootje over
  water rijdt. Een ruilvenster met aanbod en vraag; de ruilverhouding volgt de schaarste.
- **Diplomatie**: relatieniveau per buur (onbekend, kennis, vriend, bondgenoot). Het stijgt door
  handel, geschenken, samen mediteren (hunnebed) en feesten. Vrede sluiten legt de grenzen vast.
  Een slechte band geeft een slechtere ruil of een weigering.
- Relaties als matrix `world.rel[p][q]` (eerste versie gebouwd in 8a: `world.rel`, alleen de bron 'ruil') (getal met drempels voor de niveaus uit de config), met
  bijdragen per bron (handel, geschenk, meditatie, feest, toernooi, geschil), net als de
  harmonie, zodat nieuwe bronnen er los bij kunnen.
- Handel, geschenken, vrede sluiten en uitdagingen lopen als opdrachten via `order()`, zodat ze
  deterministisch zijn en in een savegame passen. Een computerbuur beslist ook alleen via die
  opdrachten.

Zie ook [tuin-van-verbondenheid.md](tuin-van-verbondenheid.md) en [krachtpatsers.md](krachtpatsers.md) (grensgeschillen en toernooien).

## Nog in te vullen

- De karakters: welke, en welke eigenschappen hebben ze precies (gul, zuinig, trots, voorzichtig, …)?
- Hoeveel moeilijkheidsgraden, en wat verschilt er per graad?
- Hoe ziet het ruilvenster eruit, en kun je ook geven zonder iets terug te vragen?
- Wat is een feest, en wie organiseert het?
