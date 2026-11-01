#!/bin/sh
# Handleiding helemaal opnieuw: schermafbeeldingen, pagina, pdf.
set -e
cd "$(dirname "$0")/../.."
for d in tools/handleiding/*/; do
  t=$(basename "$d"); [ -f "$d/bron.html" ] || continue
  node tools/handleiding/schermen.js --taal="$t"
done
node tools/handleiding/maak.js
node tools/handleiding/pdf.js
