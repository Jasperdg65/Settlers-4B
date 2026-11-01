# Deploy


Eenmalig op een nieuwe server:

1. PHP 8.3+ met `pdo_sqlite` en `imagick` (WebP): `sudo apt install php8.5-sqlite3 php8.5-imagick`
2. Repo naar `/var/www/dgol-projects/settlers4b`, groep `www-data`
3. `cp data/config.example.php data/config.php`, token invullen
   (`php -r 'echo bin2hex(random_bytes(32)), "\n";'`), `chmod 640`, groep `www-data`.
   `data/` moet schrijfbaar zijn voor `www-data` (de database wordt vanzelf aangemaakt).
4. Apache-snippet uit `server-beheer` installeren:
   `sudo apache2ctl configtest && sudo systemctl reload apache2`

Bijwerken: `git pull` in de projectmap is genoeg. index.html, js/ en css/
worden altijd gehervalideerd; afbeeldingen hebben een hash in de URL.

Back-up: `data/kolonie.sqlite` (bijvoorbeeld `sqlite3 data/kolonie.sqlite ".backup kopie.sqlite"`).

## Webserver

- Alleen `public/` is via de Apache-alias `/settlers4b` bereikbaar. `data/`, `lib/`, `tools/`, `bron/` en
  `docs/` liggen daarbuiten en worden in het snippet ook expliciet geweigerd
  (repo `server-beheer`, `apache/doc-dgol-projects.conf`, geïnstalleerd als
  `/etc/apache2/snippets/doc-dgol-projects.conf`).
- Na een wijziging aan het snippet: kopiëren naar `/etc/apache2/snippets/`, dan
  `sudo apache2ctl configtest && sudo systemctl reload apache2`.

## Schijfruimte

De server mag niet vollopen. Blender, tijdelijke renders en de headless browser voor de handleiding
staan op het grote volume `/mnt/HC_Volume_105876660/kolonie` (`blender/`, `render-tmp/`, `browser/`),
met snelkoppelingen vanuit `tools/`. De renderstraat stopt zelf als er minder dan 3 GB vrij is.
