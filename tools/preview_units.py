# Controlebeeld van 3D-poppetjes op spelgrootte, met dezelfde maatkeuze, schaal en omkleuring als js/units3d.js.
#
#   tools/blender/blender -b -P tools/preview_units.py -- uit.png sleutel [sleutel ...]
#
# Per sleutel (zie manifest.units) een figuur in rood en in blauw (PCOL[0], PCOL[1]): bovenste rij zoom 1,
# onderste rij zoom 2; telkens stilstaand naar de kijker (richting 2) en een loopstap schuin (richting 1).
import bpy, sys, os, json
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, 'public', 'assets')
args = sys.argv[sys.argv.index('--') + 1:]
OUT, KEYS = args[0], args[1:]
UNIT3D_H = 18                                    # zelfde als in js/units3d.js
PCOL = ['#d33b3b', '#2f6fd6']                    # spelers 1 en 2 (js/terrain.js)
BG = np.array([0x86, 0xaa, 0x46]) / 255          # gras


def load(path):
    img = bpy.data.images.load(path)
    img.colorspace_settings.name = 'Non-Color'   # ruwe bytes, zoals de browser ze ook uit de webp leest
    w, h = img.size
    a = np.empty(w * h * 4, np.float32)
    img.pixels.foreach_get(a)
    bpy.data.images.remove(img)
    return a.reshape(h, w, 4)[::-1]


def resize(arr, w, h):
    """bilineair schalen (premultiplied), zoals drawImage met smoothing"""
    sh, sw = arr.shape[:2]
    p = arr.copy(); p[..., :3] *= p[..., 3:4]
    ys = np.clip((np.arange(h) + 0.5) * sh / h - 0.5, 0, sh - 1); xs = np.clip((np.arange(w) + 0.5) * sw / w - 0.5, 0, sw - 1)
    y0 = np.floor(ys).astype(int); x0 = np.floor(xs).astype(int); y1 = np.minimum(y0 + 1, sh - 1); x1 = np.minimum(x0 + 1, sw - 1)
    fy = (ys - y0)[:, None, None]; fx = (xs - x0)[None, :, None]
    r = (p[y0][:, x0] * (1 - fx) + p[y0][:, x1] * fx) * (1 - fy) + (p[y1][:, x0] * (1 - fx) + p[y1][:, x1] * fx) * fy
    a = r[..., 3:4]; r[..., :3] = np.where(a > 1e-4, r[..., :3] / np.maximum(a, 1e-4), 0); return r


models = {}
man = json.load(open(os.path.join(A, 'manifest.json')))
for k in KEYS:
    meta = json.load(open(os.path.join(A, man['units'][k]['json'])))
    models[k] = {s['px']: (s, load(os.path.join(A, s['file'])), load(os.path.join(A, s['mask']))) for s in meta['sizes']}

poses = [('idle', 2, 0), ('walk', 1, 2)]
n = len(KEYS) * 2 * len(poses)
W, H = 30 + n * 46, 170
canvas = np.ones((H, W, 3)) * BG
for row, (zoom, base_y, step, x0) in enumerate([(1, 60, 22, 20), (2, 150, 46, 30)]):
    need = UNIT3D_H * zoom
    col = 0
    for k in KEYS:
        size = min((px for px in models[k] if px >= need), default=max(models[k]))
        s, atlas, mask = models[k][size]
        for p, hexc in enumerate(PCOL):
            pc = np.array([int(hexc[i:i + 2], 16) for i in (1, 3, 5)]) / 255
            for anim, d, i in poses:
                fr = next(f for f in s['frames'] if f['anim'] == anim and f['dir'] == d and f['i'] == i)
                img = atlas[fr['y']:fr['y'] + fr['h'], fr['x']:fr['x'] + fr['w']].copy()
                m = mask[fr['y']:fr['y'] + fr['h'], fr['x']:fr['x'] + fr['w'], :1]
                img[..., :3] *= (1 - m) + m * pc          # omkleuren zoals unit3DAtlas
                kk = UNIT3D_H / size * zoom                 # atlas-px → scherm-px
                img = resize(img, max(1, round(fr['w'] * kk)), max(1, round(fr['h'] * kk)))
                fx = x0 + col * (step if zoom == 1 else 46) - fr['ax'] * kk
                fy = base_y - fr['ay'] * kk
                X, Y = int(round(fx)), int(round(fy)); h, w = img.shape[:2]
                if 0 <= X and X + w <= W and 0 <= Y and Y + h <= H:
                    a = img[..., 3:4]; canvas[Y:Y + h, X:X + w] = img[..., :3] * a + canvas[Y:Y + h, X:X + w] * (1 - a)
                col += 1
out = np.concatenate([canvas, np.ones((H, W, 1))], axis=2).astype(np.float32)
img = bpy.data.images.new('voorbeeld', W, H, alpha=True)
img.colorspace_settings.name = 'Non-Color'
img.pixels.foreach_set(np.ascontiguousarray(out[::-1]).ravel())
img.filepath_raw = OUT; img.file_format = 'PNG'; img.save()
print('VOORBEELD', OUT, W, 'x', H)
