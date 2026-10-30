#!/usr/bin/env python3
# Eenmalig gebruikt: splitst bron/kolonie-fase1.html in public/index.html,
# public/css/kolonie.css en public/js/*.js (zonder ingebakken afbeeldingen).
import sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
L = (root / 'bron/kolonie-fase1.html').read_text().split('\n')
line = lambda a, b: L[a-1:b]          # 1-based, inclusief

modules = [  # (bestand, eerste regel, laatste regel) in het origineel
    ('core.js', 151, 175), ('nature.js', 176, 254), ('units.js', 255, 342),
    ('buildings.js', 343, 542), ('terrain.js', 543, 737), ('render.js', 738, 801),
    ('colonists.js', 802, 893), ('loop.js', 894, 1035), ('input.js', 1036, 1101),
    ('custom.js', 1102, 1179), ('ui.js', 1180, 1204),
]
js = root / 'public/js'
for name, a, b in modules:
    body = [l for i, l in zip(range(a, b+1), line(a, b)) if i not in (1119, 1120, 1121)]
    (js / name).write_text('"use strict";\n' + '\n'.join(body).rstrip('\n') + '\n')

(root / 'public/css/kolonie.css').write_text('\n'.join(line(11, 81)) + '\n')
scripts = [m[0] for m in modules]
scripts.insert(scripts.index('custom.js'), 'assets.js')
head = line(1, 9) + ['<link rel="icon" href="favicon.svg" type="image/svg+xml">',
                     '<link rel="stylesheet" href="css/kolonie.css">', '</head>']
tags = [f'<script src="js/{s}"></script>' for s in scripts]
(root / 'public/index.html').write_text('\n'.join(head + line(84, 148) + tags + ['</body>', '</html>', '']))
