# Renderstraat voor draaiende onderdelen (molenwieken): GLB → spriteblad met draaistanden.
#
#   nice tools/blender/blender -b -P tools/render_wieken.py -- [sleutel ...] [--test]
#
# Instellingen in tools/sprites.json onder "spinners". Zelfde camera (orthografisch, CFG.elevation) en licht als de
# poppetjes (tools/render_sprites.py). Het onderdeel 'rotator' draait om zijn as door de naaf; omdat de wieken
# 'symmetry'-voudig symmetrisch zijn, is één omwenteling gedeeld door 'symmetry' genoeg: 'frames' standen gelijk
# verdeeld over die hoek. 'yaw' draait het geheel om de verticale as (0 = recht naar de kijker, negatief = naar links).
# Uitvoer per maat (zijde van een beeld in px): één WebP met 'cols' kolommen, plus een JSON; register in
# manifest.json onder "spinners". Geen spelerkleur, dus geen masker. --test: alleen de grootste maat, naar tools/.render-tmp/.
import bpy, sys, os, json, math
import numpy as np
from mathutils import Vector, Matrix

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import render_sprites as RS

ROOT, CFG, ASSETS, TMP, TEST = RS.ROOT, RS.CFG, RS.ASSETS, RS.TMP, RS.TEST
SP = CFG['spinners']
KEYS = [a for a in RS.argv if not a.startswith('--')] or list(SP)


def render_spinner(key, m):
    RS.check_disk()
    sc, cam, ppu, res = RS.setup_scene()
    pl = bpy.data.objects.get('Schaduwvanger')
    if pl:  # wieken hangen in de lucht: geen schaduw op de grond
        bpy.data.objects.remove(pl, do_unlink=True)
    before = set(sc.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT, m['glb']))
    bpy.context.view_layer.update()
    new = [o for o in sc.objects if o not in before]
    rot = bpy.data.objects[m['rotator']]
    for o in new:  # het geheel naar de kijker, met 'yaw'
        if o.parent is None:
            o.matrix_world = Matrix.Rotation(math.radians(m.get('yaw', 0)), 4, 'Z') @ o.matrix_world
    bpy.context.view_layer.update()
    hub = rot.matrix_world.translation.copy()
    axis = Matrix.Rotation(math.radians(m.get('yaw', 0)), 3, 'Z') @ Vector((0, -1, 0))  # de as wijst naar de kijker (voorkant −y)
    m0 = rot.matrix_world.copy()
    # camera: de naaf in het midden, beeld 'view' modeleenheden breed (de wieken plus marge)
    el = math.radians(CFG['elevation'])
    fwd = Vector((0, math.cos(el), -math.sin(el)))
    side = max(m['sizes'])
    rpx = side * CFG['supersample']
    sc.render.resolution_x = sc.render.resolution_y = rpx
    cam.data.ortho_scale = m['view']
    cam.location = hub - fwd * 20
    RS.set_pass(sc, False)
    n = 1 if TEST else m['frames']
    os.makedirs(TMP, exist_ok=True)
    tmp = os.path.join(TMP, key + '.png')
    imgs = []
    for i in range(n):
        a = math.radians(360 / m['symmetry'] * i / m['frames'])  # linksom gezien van voren, zoals een Hollandse molen
        rot.matrix_world = Matrix.Translation(hub) @ Matrix.Rotation(a, 4, axis) @ Matrix.Translation(-hub) @ m0
        bpy.context.view_layer.update()
        imgs.append(RS.render_rgba(sc, tmp))
        print(f'  {key}: {i + 1}/{n}', flush=True)
    os.remove(tmp)
    cols = min(m['cols'], n)
    rows = -(-n // cols)
    out = {'model': os.path.basename(m['glb']), 'key': key, 'frames': n, 'cols': cols,
           'turn': 360 / m['symmetry'], 'view': m['view'], 'radius': m['radius'], 'sizes': []}
    written = []
    for size in (m['sizes'][-1:] if TEST else m['sizes']):
        f = rpx // size
        sheet = np.zeros((rows * size, cols * size, 4), np.float32)
        for i, im in enumerate(imgs):
            r, c = divmod(i, cols)
            sheet[r * size:(r + 1) * size, c * size:(c + 1) * size] = RS.shrink(im, f)
        base = os.path.join(TMP if TEST else ASSETS, m['out'] + f'_{size}')
        os.makedirs(os.path.dirname(base), exist_ok=True)
        RS.save_webp(sheet, base + '.webp', CFG['quality'])
        if TEST:
            bg = np.full_like(sheet, 0.45); bg[..., 3] = 1
            pv = bg.copy(); pv[..., :3] = sheet[..., :3] * sheet[..., 3:4] + bg[..., :3] * (1 - sheet[..., 3:4])
            RS.save_png(pv, base + '_voorbeeld.png')
        written.append(base + '.webp')
        out['sizes'].append({'px': size, 'file': os.path.relpath(base, TMP if TEST else ASSETS) + '.webp'})
    jpath = os.path.join(TMP if TEST else ASSETS, m['out'] + '.json')
    json.dump(out, open(jpath, 'w'), indent=1)
    written.append(jpath)
    print(f'{key}: {n} standen, beeld {rpx} render-px, naaf {tuple(round(v, 2) for v in hub)}', flush=True)
    return os.path.relpath(jpath, ASSETS), RS.file_hash(written)


done = {k: render_spinner(k, SP[k]) for k in KEYS}
if not TEST:
    mf = os.path.join(ASSETS, 'manifest.json')
    man = json.load(open(mf))
    sec = man.setdefault('spinners', {})
    for key, (j, v) in done.items():
        sec[key] = {'json': j, 'v': v}
    json.dump(man, open(mf, 'w'), indent=4, ensure_ascii=False)
    open(mf, 'a').write('\n')
print('KLAAR', ', '.join(done))
