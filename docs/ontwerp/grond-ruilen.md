# Grond ruilen

Mijlpaal 8a en 8b (gebouwd, `js/deals.js`, `CFG.deal`). Waarom zo: zie [../beslissingen.md](../beslissingen.md) (2026-11-02:
geen torenovername; grensduel en verzoeken). Mijlpaal 8b staat onderaan.

## Uitgangspunt

- Torens worden niet veroverd. Gebied komt uit bemande torens (mijlpaal 6b), en daarbovenop uit **afspraken**.
- Grond wisselt alleen van eigenaar als beide het eens zijn: een ruil van grond tegen grond en/of goederen.
  Als laatste stap (8b) kan een afgewezen verzoek met armpje drukken worden beslecht.
- Grond met een gebouw, bouwplaats, ingang, stapelplek of stapel kan niet in een ruil. Zo gaat er nooit iets
  verloren, en vervalt de vraag wat er met gebouwen en stapels op verloren land gebeurt.

## Voorstel

- Paneel *Buren: grond ruilen*. **Grond vragen**: twee klikken op de kaart zijn de hoeken van een rechthoek; de tegels
  van één buur daarin die mogen, komen erbij (dezelfde rechthoek nog eens: eraf). **Grond bieden**: hetzelfde op eigen
  grond. Loopt via `BUILD.mode = 'deal'`, zodat muis, aanraken (twee keer tikken), Esc en de rechtermuisknop werken
  zoals bij bouwen.
- Gevraagde tegels moeten (via elkaar) aan het eigen gebied grenzen, geboden tegels aan het gebied van de buur
  (`connectedTo`): er ontstaan geen losse eilandjes. Hoogstens `maxTiles` per kant; is een aangetekend stuk groter, dan blijven de tegels het dichtst bij de grens (`connectedTo` geeft ze in volgorde vanaf de grens).
- Goederen erbij bieden: de goederen uit `CFG.deal.goods`, tot wat er vrij ligt (`freeGoods`: niet gereserveerd
  door een drager).
- Opdracht `propose {p, q, ask, give, goods}`; het antwoord staat in `world.offers[id]` met `st`:
  `aangenomen`, `tegenbod` (met `extra`), `afgewezen` (met `why`), `ongeldig` of `gesloten`.
  Op een tegenbod antwoordt de vrager met `accept {id}` of `reject {id}`, binnen `counterTicks`.

## Hoe de buur beslist (`dealJudge`)

- Waarde per tegel voor de buur (`tileValue`): terrein + wat erop staat (boom, boompje, struik, akker, steenblok
  naar wat er nog in zit) + erts naar wat er nog in zit, × `oreNeed` als hij van dat erts minder dan `oreScarce`
  tegels heeft; binnen `homeR` van zijn burcht × tot `1 + home`.
- Wat hij krijgt: zijn waarde van de geboden tegels + goederen (`goods` per stuk, × `shortMul` als hij er minder dan
  `short` van heeft).
- Aannemen als krijgen ≥ geven × (`margin` − `relMargin` × relatie/100). Bij een relatie van 0 wil hij dus 25% meer
  terug, bij een bondgenoot (75+) nog maar 10%.
- Daaronder, maar boven `counterAt` van wat nodig is: **tegenbod** in het goed waarvan de vrager het meest vrij heeft.
  Anders afwijzen, met een reden: erts dat hij nodig heeft, veel erts, dicht bij zijn burcht, akkers, bos, of
  gewoon de waarde.
- Dezelfde functies worden het rekenwerk van de computerburen (mijlpaal 9): wat ze vragen en wat ze bieden.

## Uitvoeren (`dealDo`)

- Goederen gaan van de opslag van de vrager (burcht en pakhuis eerst) naar de burcht van de buur (en zijn pakhuizen
  als die vol is). **Tijdelijk**: in mijlpaal 10 brengt de handelaar ze met zijn handkar.
- Een record in `world.deals {p, q, t, tiles: [tegel, nieuwe eigenaar + 1, …]}`. `computeLand` past de afspraken
  toe na het gebied uit de torens, in volgorde van sluiten: afgesproken grond valt niet terug als er later torens
  bijkomen of verdwijnen.
- Relatie: beide kanten `relDeal` punten erbij (`world.rel`, P × P, −100..100, start 0). Niveaus uit `CFG.deal.rel`:
  gespannen, onbekend, kennis, vriend, bondgenoot.

## Mijlpaal 8b (gebouwd)

### Buren vragen zelf (`tickRequests`, `reqPlan`, `CFG.deal.req`)

- Vanaf `first` ticks kijkt elke `every` ticks elke buur die van een erts minder dan `oreScarce` tegels heeft, of dat erts
  binnen `reach` tegels van zijn grens op het gebied van speler `to` ligt (breedte-eerst over die grond, vanaf de grens).
- Hij vraagt de weg van zijn grens naar het erts, het erts met 2 tegels eromheen en een tegel breder langs de weg,
  hoogstens `tiles` tegels, alleen tegels die in een ruil mogen.
- Hij biedt goederen ter waarde van `offer` × wat de strook de speler waard is (dezelfde `tilesValue`), uit wat hij het
  meest vrij heeft, van elk goed hoogstens de helft. Lukt dat niet, dan vraagt hij niets.
- `world.reqs {id, q, p, tiles, goods, ore, st, t, more, end}`. Antwoord: opdracht `answer {id, a}` met `ja`, `meer`
  (één keer: `more` × de goederen, als de strook het hem zelf waard is) of `nee`. Na `ttl` ticks verloopt het; daarna,
  of na een antwoord, vraagt die buur `cool` ticks niets.
- Milo meldt een verzoek (regel `verzoek`), de strook knippert op de kaart en het paneel toont het bod.
- **Tijdelijk**: tot mijlpaal 9 vragen ze alleen speler `to` (1). In de Ruil-test vragen ze om elk erts en al na
  `first`/4 ticks, omdat daar niemand erts mist.

### Grensduel (`grensChallenge`, `grensEnd`, `CFG.deal.duel`)

- Na `afgewezen` (of een afgewezen tegenbod, `gesloten`) kan de vrager één keer uitdagen: opdracht `grens {id}`.
- Van beide kanten de sterkste krachtpatser uit de toren die het dichtst bij de strook staat (anders uit de reserve van
  een krachthal). Zonder krachtpatser aan een van beide kanten gaat het niet door.
- Tafel: bij de tegel van de strook die aan de vrager grenst, het dichtst bij het midden, op een open plek zonder bomen
  ervoor (`tableSpot(…, open)`), zodat het duel te zien is.
- De krachtpatsers lopen als eenheden uit `army.js` (`S.st = ST.FIELD`, `fieldOut`, `fieldStep`, `fieldHome` in
  `crew.js`) maar blijven in `b.crew`: de toren blijft bemand, de grens verspringt niet. Het duel zelf is `duel.js`
  (zelfde kracht, eigen toeval `drand`).
- Wint de vrager, dan wordt de strook (wat er dan nog mag) een afspraak in `world.deals` met `duel: 1`, zonder goederen.
  Een uitdaging kost beide `relCost` relatiepunten. De winnaar gaat terug zijn toren in, de verliezer eerst naar zijn
  burcht (`outTicks`); thuis zijn ze uitgerust.

## Mijlpaal 8c (gebouwd 3 november 2026)

Gebouwd (crew.js, details in [krachtpatsers.md](krachtpatsers.md)):
- **Verplaatsen**: paneel *Krachtpatsers*, knop *Verplaatsen* (modus `kp`): klik een eigen toren of krachthal, dan een ander
  eigen gebouw (opdracht `post`). Een volle toren ruilt met de zwakste daar; de laatste krachtpatser van een toren kan niet weg.
- **Aannemen**: reserve 0–12 (`hall.keeps`) en de knop *Neem er een aan*.
- **Trainen**: *Train eerst* (opdracht `train`, `b.pri`); wie uit een toren naar de hal komt, gaat vanzelf voor.
- **Aanmoedigen**: de krachthal leidt `hall.band` muzikanten op (niveau 1); bij een grensduel loopt van beide kanten de
  dichtstbijzijnde mee en het duel wacht op hem, hoogstens `meetTicks`.

Bewust nog niet: vrij selecteren en lopen over het veld zoals in de Duel-test (in het dorp heeft dat nog geen doel:
torens en hal zijn de enige plekken), muzikanten van niveau 2 en 3 (dat vraagt instrumenten als goed), helers in het dorp.

Plan zoals afgesproken:
- Krachtpatsers selecteren en sturen in het eigen dorp, met de besturing uit de Duel-test.
- Wens van de speler (3 november 2026): krachtpatsers **aanmoedigen**, **trainen** en **extra aannemen**.
  - Aannemen: nu al via de reserve van de krachthal (0/2/4/8). In 8c ook een knop *Neem er een aan* per stuk, en een
    hogere bovengrens.
  - Trainen: nu automatisch zodra er uitrusting ligt. In 8c kies je zelf wie er traint en wie voorgaat.
  - Aanmoedigen: muzikanten (nu alleen in de Duel-test) ook in het dorp, opgeleid in de krachthal; een eigen
    muzikant bij de tafel maakt je krachtpatser in een grensduel sterker (`duel.music`). De dichtstbijzijnde vrije
    muzikant loopt mee naar de tafel; het duel begint pas als hij er ook is, hoogstens tot de wachttijd (`meetTicks`)
    om is, zodat een verre muzikant het duel niet ophoudt.
  - Geen aanmoedigen met muis of toetsenbord: Terrana wordt geen actiespel (besloten 3 november 2026).

## Besloten bij 8b

- Grond na een ruil of duel ligt vast; een afspraak terugdraaien kan niet.
- Grond schenken, voor relatie, komt bij diplomatie (mijlpaal 11).

## Oorspronkelijk plan voor 8b

- **Buren vragen zelf** om jouw grond, eerst met een eenvoudige regel: een buur die een erts mist (minder dan
  `oreScarce` tegels) en het net over zijn grens bij jou ziet liggen, vraagt dat stuk en biedt er grond of goederen
  voor, met dezelfde waardefunctie. Jij antwoordt met aannemen, afwijzen of een tegenbod.
- **Grensduel**: na een afwijzing kan de vrager uitdagen (duel van soort `grens` via `challenge`). Een krachtpatser
  uit de dichtstbijzijnde toren van de ander komt naar buiten; de winnaar krijgt de strook (als afspraak in
  `world.deals`). Een uitdaging kost relatie, een eerlijke ruil levert relatie op.
- Krachtpatsers selecteren en sturen in het eigen dorp (nu alleen in de Duel-test).
