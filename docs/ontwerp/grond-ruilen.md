# Grond ruilen

Mijlpaal 8a (gebouwd, `js/deals.js`, `CFG.deal`). Waarom zo: zie [../beslissingen.md](../beslissingen.md) (2026-11-02:
geen torenovername). Mijlpaal 8b staat onderaan.

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

## Mijlpaal 8b (nog niet bouwen)

- **Buren vragen zelf** om jouw grond, eerst met een eenvoudige regel: een buur die een erts mist (minder dan
  `oreScarce` tegels) en het net over zijn grens bij jou ziet liggen, vraagt dat stuk en biedt er grond of goederen
  voor, met dezelfde waardefunctie. Jij antwoordt met aannemen, afwijzen of een tegenbod.
- **Grensduel**: na een afwijzing kan de vrager uitdagen (duel van soort `grens` via `challenge`). Een krachtpatser
  uit de dichtstbijzijnde toren van de ander komt naar buiten; de winnaar krijgt de strook (als afspraak in
  `world.deals`). Een uitdaging kost relatie, een eerlijke ruil levert relatie op.
- Krachtpatsers selecteren en sturen in het eigen dorp (nu alleen in de Duel-test).

## Open vragen

- Moet een buur een afspraak later kunnen terugdraaien, of ligt grond na een ruil voor altijd vast?
- Mag je ook grond **geven** zonder iets terug te vragen (een geschenk), voor relatie?
