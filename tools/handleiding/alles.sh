#!/bin/sh
# Handleiding helemaal opnieuw: schermafbeeldingen, pagina, pdf.
set -e
cd "$(dirname "$0")/../.."
node tools/handleiding/schermen.js
node tools/handleiding/maak.js
node tools/handleiding/pdf.js
