# Wijzigingen

Korte DCS-log per kwartier; de volledige geschiedenis per dag staat in [CHANGELOG.md](CHANGELOG.md).

## 2026-11-02 16:00 CET
- Mijlpaal 8a: grond ruilen met je buren (modus Economie). Een vak tegels vragen of bieden, goederen erbij, en de buur neemt aan, wijst af met een reden of doet een tegenbod; erts, bos, akkers en nabijheid van zijn burcht wegen mee, een betere relatie verkleint zijn marge. Afspraken blijven gelden na elke herberekening van het gebied. Vervangt de torenovername uit het ontwerp, omdat het spel coöperatief is. Nieuw: [public/js/deals.js](public/js/deals.js); aangepast: [public/js/config.js](public/js/config.js) (`CFG.deal`), [public/js/build.js](public/js/build.js), [public/js/orders.js](public/js/orders.js), [public/index.html](public/index.html), [public/lang/nl.js](public/lang/nl.js). Getest in headless Chrome (bod, tegenbod, aannemen, grens blijft na 2400 ticks, geen paginafouten). Ontwerp in [docs/ontwerp/grond-ruilen.md](docs/ontwerp/grond-ruilen.md), besluit in [docs/beslissingen.md](docs/beslissingen.md), handleiding bijgewerkt.
- Fix: `CFG.army` stond twee keer in [public/js/config.js](public/js/config.js), waardoor sinds mijlpaal 6c `speed` ontbrak en krachtpatsers in de Duel-test niet meer liepen. Samengevoegd tot één blok.
