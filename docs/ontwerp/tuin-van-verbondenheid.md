# Tuin van Verbondenheid

Het gezamenlijke einddoel (mijlpaal 12): alle spelers bouwen samen de tuin op neutraal terrein. Nog niet gebouwd.

## Ontwerpnotitie: hoofddoel en samenspel (nog niet bouwen)

- Hoofddoel: de spelers bouwen samen de **Tuin van verbondenheid** op neutraal terrein.
  De bouw gaat in fasen (bijvoorbeeld fundering en terrassen, trappen en vijvers, paviljoens,
  beplanting en de olijfboom in de handen), elk met een eigen goederenmix. De bijdrage per speler
  is zichtbaar; als de tuin af is, winnen alle spelers samen.
- Beeld: `bron/Tuin van verbondenheid.png` (nog niet in het manifest). Op een rond terrassenplein
  staat een olijfboom die door twee stenen handen wordt gedragen, met vijvers en paviljoens. De
  vier trappen hebben de kleuren van de vier spelers (rood, blauw, geel, groen). Idee: elke speler
  bouwt zijn eigen trap en kwart, zodat je zijn bijdrage op de kaart ziet.
- Optionele modus **vrij spel**: hetzelfde spel zonder de tuin als doel.
- Kaartgenerator: een schuif **onderlinge afhankelijkheid** verdeelt grondstoffen bewust ongelijk
  over de spelers (de een heeft veel steen, de ander ijzer of vruchtbare grond), zodat handel nodig is.
- **Handel**: een marktplaats met een handelaar die met een handkar over land of met een bootje over
  water rijdt. Een ruilvenster met aanbod en vraag; de ruilverhouding volgt de schaarste.
- **Diplomatie**: relatieniveau per buur (onbekend, kennis, vriend, bondgenoot). Het stijgt door
  handel, geschenken, samen mediteren (hunnebed) en feesten. Vrede sluiten legt de grenzen vast.
  Een slechte band geeft een slechtere ruil of een weigering.
- **Krachtpatsers**: grensgeschillen en feesttoernooien worden met armpje drukken beslecht, via de
  bestaande duelmodule. Een toernooi verbetert de relatie.
- **Natuur als uitdaging**: droogte, strenge winter en overstroming.

## Wat het hoofddoel vraagt van de opbouw (houden we nu al rekening mee)

- Spelmodus als wereldinstelling (`world.goal`: tuin of vrij), gekozen bij het genereren; de
  tuin is een eigen gebouwtype dat niemand bezit (`b.p` = neutraal) en dat alleen op
  neutraal terrein kan staan.
- Kaartgenerator: neutraal terrein in het midden of tussen de startplekken (in `world.own` een
  eigen waarde, nooit te claimen); de grondstofverdeling per startplek komt uit een instelling
  `interdep` (0 = eerlijk, 1 = sterk ongelijk) die de ertsaders, steen, bos en vruchtbare grond
  per speler weegt. Deterministisch uit de seed.
- Tuin: per fase een lijst goederen en aantallen in de config (`CFG.tuin`), en per speler
  per goed wat hij heeft gebracht (`tuin.gave[p][goed]`). Dragers brengen goederen erheen
  zoals naar een bouwplaats; de planner kent het als vraag.
- Relaties als matrix `world.rel[p][q]` (getal met drempels voor de niveaus uit de config), met
  bijdragen per bron (handel, geschenk, meditatie, feest, toernooi, geschil), net als de
  harmonie, zodat nieuwe bronnen er los bij kunnen.
- Handel, geschenken, vrede sluiten en uitdagingen lopen als opdrachten via `order()`, zodat ze
  deterministisch zijn en in een savegame passen. Een computerbuur beslist ook alleen via die
  opdrachten.
- Duelmodule: een duel krijgt een soort (`veld`, `grens`, `toernooi`). `endDuel` geeft de afloop
  door aan wie het duel aanvroeg, en de gevolgen per soort staan in de config: in het veld
  uitgeschakeld bij de heler, in een toernooi alleen wat vermoeidheid en een relatiebonus, bij
  een grensgeschil gaat de betwiste strook naar de winnaar.
- Natuurgebeurtenissen met een eigen toevalsgenerator (zoals `drand` voor duels), zodat ze los van
  de rest deterministisch blijven; ze werken via bestaande grootheden (groei van akkers, water,
  beloopbaarheid) en de config.

## Nog in te vullen

- De bouwfasen en de goederen per fase (`CFG.tuin`).
- Wat als een buur niet bijdraagt: wacht de tuin, of kunnen anderen het overnemen?
- Hoe ziet de tuin eruit tijdens de bouw (beelden per fase)?
- Natuurgebeurtenissen: hoe vaak, hoe zwaar, en kun je je erop voorbereiden?
