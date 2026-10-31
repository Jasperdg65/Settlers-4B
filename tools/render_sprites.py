# Renderstraat: 3D-poppetjes (GLB) → spritesheets voor het spel.
#
#   nice tools/blender/blender -b -P tools/render_sprites.py -- [sleutel ...] [--test]
#
# Instellingen en modellen in tools/sprites.json. Zonder sleutels worden alle modellen gerenderd.
# --test rendert per model alleen idle en de eerste loopstap (alle richtingen) naar tools/.render-tmp/, met een PNG-voorbeeld.
#
# Per model: atlas per maat (24/48/96 px poppetje) als WebP met alfa, een masker met dezelfde indeling
# (wit = spelerkleur; lineaire data: Raw-weergave, geen denoise, Non-Color) en één JSON met per beeld de positie in de atlas en het ankerpunt (voeten).
# Rijen = richtingen (0 = oost/schermrechts, daarna met de klok mee per 45°), kolommen = beelden: idle, walk, fight.
# Animatie zonder skelet: onderdelen worden gegroepeerd (benen = Boot/Trouser per kant, armen = alles verder
# dan rig.armMinX van het midden per kant, rest = romp) en scharnieren rond heup en schouder.
import bpy, sys, os, json, math, hashlib, shutil
import numpy as np
from mathutils import Vector, Matrix, Euler

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CFG = json.load(open(os.path.join(ROOT, 'tools', 'sprites.json')))
ASSETS = os.path.join(ROOT, 'public', 'assets')
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
TEST = '--test' in argv
KEYS = [a for a in argv if not a.startswith('--')] or list(CFG['models'])
TMP = os.path.join(ROOT, 'tools', '.render-tmp')
MIN_FREE = 3 * 1024 ** 3  # stoppen onder 3 GB vrij


def check_disk():
    # zowel de projectschijf (uitvoer) als die van de tijdelijke map (mag een snelkoppeling naar een ander volume zijn)
    for p in (ROOT, os.path.realpath(TMP) if os.path.exists(TMP) else ROOT):
        free = shutil.disk_usage(p).free
        if free < MIN_FREE:
            raise SystemExit(f'Gestopt: nog maar {free / 1024 ** 3:.1f} GB vrij op {p} (minimaal 3 GB).')


# ---------- scène ----------
def setup_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.render.film_transparent = True
    sc.render.use_persistent_data = True
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA'
    sc.render.image_settings.color_depth = '8'
    ss = CFG['supersample']
    ppu = max(CFG['sizes']) * ss / (CFG['refHeight'] * math.cos(math.radians(CFG['elevation'])))
    res = int(round(CFG['view'] * ppu / 8)) * 8
    sc.render.resolution_x = sc.render.resolution_y = res
    sc.render.resolution_percentage = 100
    # camera: orthografisch, elevation graden boven horizontaal, kijkt naar +y (noord)
    el = math.radians(CFG['elevation'])
    cam = bpy.data.objects.new('Cam', bpy.data.cameras.new('Cam'))
    sc.collection.objects.link(cam)
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = res / ppu
    fwd = Vector((0, math.cos(el), -math.sin(el)))
    target = Vector((0, 0, CFG['viewCenter'] / math.cos(el)))
    cam.location = target - fwd * 20
    cam.rotation_euler = (math.pi / 2 - el, 0, 0)
    sc.camera = cam
    # licht: vast t.o.v. de camera, het model draait
    L = CFG['light']
    for name in ('key', 'fill'):
        d = L[name]
        sun = bpy.data.objects.new(name, bpy.data.lights.new(name, 'SUN'))
        sun.data.energy = d['strength']
        sun.data.color = d['color']
        sun.data.angle = math.radians(d['angle'])
        sun.rotation_euler = Vector(d['from']).to_track_quat('Z', 'Y').to_euler()
        sc.collection.objects.link(sun)
    w = bpy.data.worlds.new('W')
    w.use_nodes = True
    bg = w.node_tree.nodes['Background']
    bg.inputs[0].default_value = (*L['ambient']['color'], 1)
    bg.inputs[1].default_value = L['ambient']['strength']
    sc.world = w
    if L.get('shadow'):
        bpy.ops.mesh.primitive_plane_add(size=4, location=(0, 0, 0))
        pl = bpy.context.object
        pl.name = 'Schaduwvanger'
        pl.is_shadow_catcher = True
    return sc, cam, ppu, res


def load_model(path, hide=()):
    bpy.ops.import_scene.gltf(filepath=path)
    for o in list(bpy.context.scene.objects):  # m['hide']: onderdelen weglaten (bv. de kist van de drager)
        if any(o.name.startswith(h) for h in hide):
            bpy.data.objects.remove(o, do_unlink=True)
    objs = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.name != 'Schaduwvanger']
    for o in objs:  # losse onderdelen: eventuele ouders loskoppelen met behoud van plek
        if o.parent:
            m = o.matrix_world.copy()
            o.parent = None
            o.matrix_world = m
    return objs


def center(o):
    bb = [o.matrix_world @ Vector(c) for c in o.bound_box]
    return sum(bb, Vector()) / 8


def empty(name, loc, parent=None):
    e = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(e)
    e.location = loc
    if parent:
        e.parent = parent
    return e


def attach(o, e):
    m = o.matrix_world.copy()
    o.parent = e
    o.matrix_parent_inverse = e.matrix_world.inverted()
    o.matrix_world = m


def build_rig(objs, R, body_prefixes=()):
    root = empty('Root', (0, 0, 0))
    body = empty('Romp', (0, 0, 0), root)
    sx, sy, sz = R['shoulder']
    legs = {s: empty('Been' + str(s), (s * 0.16, 0, R['hip']), root) for s in (-1, 1)}
    arms = {s: empty('Arm' + str(s), (s * sx, sy, sz), body) for s in (-1, 1)}
    bpy.context.view_layer.update()
    sword = 0
    groups = {'legs': {-1: [], 1: []}, 'arms': {-1: [], 1: []}, 'body': []}
    for o in objs:
        c = center(o)
        s = -1 if c.x < 0 else 1
        nm = o.name.lower()
        if any(o.name.startswith(b) for b in body_prefixes):  # m['body']: altijd romp (bv. de kist)
            attach(o, body); groups['body'].append(o.name)
        elif 'boot' in nm or 'trouser' in nm:  # Boot_…, Felt_boot_…, Trouser_…
            attach(o, legs[s]); groups['legs'][s].append(o.name)
        elif abs(c.x) > R['armMinX']:
            attach(o, arms[s]); groups['arms'][s].append(o.name)
            if o.name.startswith('Sword'):
                sword = s
        else:
            attach(o, body); groups['body'].append(o.name)
    return root, body, legs, arms, sword or -1, groups


def pose(rig, anim, i, R):
    root, body, legs, arms, sword, _ = rig
    for e in legs.values():
        e.rotation_euler = (0, 0, 0)
    rest = math.radians(R.get('armRest', 0))  # armen omlaag (+) vanuit de gemodelleerde stand
    for e in arms.values():
        e.rotation_euler = (rest, 0, 0)
    body.location.z = 0
    if anim == 'walk':
        ph = i / CFG['anims']['walk'] * 2 * math.pi
        a = math.radians(R['legSwing']) * math.sin(ph)
        legs[-1].rotation_euler.x = a
        legs[1].rotation_euler.x = -a
        b = math.radians(R['armSwing']) * math.sin(ph)
        arms[-1].rotation_euler.x = rest - b
        arms[1].rotation_euler.x = rest + b
        body.location.z = R['bob'] * math.cos(2 * ph)
    elif anim == 'fight':
        arms[sword].rotation_euler.x = math.radians(R['fight'][i])


def set_dir(root, d):
    a = d * 360 / CFG['dirs']  # schermhoek, 0 = oost, met de klok mee (zuid = naar de kijker)
    root.rotation_euler = (0, 0, math.radians(90 - a))


# ---------- materialen voor kleur- en maskerpass ----------
def prep_materials(objs):
    team = lambda m: m is not None and m.name.upper().startswith('TEAM')
    for m in bpy.data.materials:  # kleurpass: TEAM wit, zodat het spel per speler kan omkleuren
        if team(m) and m.use_nodes:
            p = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
            if p:
                p.inputs['Base Color'].default_value = (0.85, 0.85, 0.85, 1)

    def emis(name, v):
        m = bpy.data.materials.new(name)
        m.use_nodes = True
        nt = m.node_tree
        nt.nodes.clear()
        e = nt.nodes.new('ShaderNodeEmission')
        e.inputs[0].default_value = (v, v, v, 1)
        e.inputs[1].default_value = 1
        o = nt.nodes.new('ShaderNodeOutputMaterial')
        nt.links.new(e.outputs[0], o.inputs[0])
        return m
    white, black = emis('MASK_team', 1.0), emis('MASK_rest', 0.0)
    orig = {o.name: [s.material for s in o.material_slots] for o in objs}
    mask = {o.name: [white if team(m) else black for m in orig[o.name]] for o in objs}
    return orig, mask


def apply_mats(objs, table):
    for o in objs:
        for s, m in zip(o.material_slots, table[o.name]):
            s.link = 'OBJECT'  # per object, zodat gedeelde meshes niet door elkaar lopen
            s.material = m


def render_rgba(sc, path, linear=False):
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
    img = bpy.data.images.load(path, check_existing=False)
    if linear:
        img.colorspace_settings.name = 'Non-Color'  # masker: waarden ongewijzigd inlezen
    w, h = img.size
    a = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(a)
    bpy.data.images.remove(img)
    return a.reshape(h, w, 4)[::-1].copy()  # bovenste rij eerst


def set_pass(sc, mask):
    sc.cycles.samples = CFG['maskSamples'] if mask else CFG['samples']
    sc.cycles.use_denoising = not mask
    sc.cycles.max_bounces = 0 if mask else 6
    sc.view_settings.view_transform = 'Raw' if mask else 'AgX'  # masker = lineaire data, geen kleurbeheer
    sc.view_settings.look = 'None'
    pl = bpy.data.objects.get('Schaduwvanger')
    if pl:
        pl.hide_render = mask


# ---------- verkleinen en wegschrijven ----------
def shrink(rgba, f):
    """premultiplied box-filter met factor f; rgba straight 0..1"""
    if f == 1:
        return rgba
    h, w = rgba.shape[:2]
    p = rgba.copy()
    p[..., :3] *= p[..., 3:4]
    p = p.reshape(h // f, f, w // f, f, 4).mean(axis=(1, 3))
    a = p[..., 3:4]
    p[..., :3] = np.where(a > 1e-4, p[..., :3] / np.maximum(a, 1e-4), 0)
    return p


def save_webp(arr, path, quality, linear=False):
    h, w = arr.shape[:2]
    img = bpy.data.images.new(os.path.basename(path), w, h, alpha=True)
    if linear:
        img.colorspace_settings.name = 'Non-Color'
    img.pixels.foreach_set(np.ascontiguousarray(arr[::-1]).ravel().astype(np.float32))
    img.filepath_raw = path
    img.file_format = 'WEBP'
    img.save(filepath=path, quality=quality)
    bpy.data.images.remove(img)


def save_png(arr, path):
    h, w = arr.shape[:2]
    img = bpy.data.images.new(os.path.basename(path), w, h, alpha=True)
    img.pixels.foreach_set(np.ascontiguousarray(arr[::-1]).ravel().astype(np.float32))
    img.filepath_raw = path
    img.file_format = 'PNG'
    img.save()
    bpy.data.images.remove(img)


def file_hash(paths):
    h = hashlib.sha1()
    for p in paths:
        h.update(open(p, 'rb').read())
    return h.hexdigest()[:10]


def render_model(key, m):
    check_disk()
    sc, cam, ppu, res = setup_scene()
    objs = load_model(os.path.join(ROOT, m['glb']), m.get('hide', ()))
    R = {**CFG['rig'], **m.get('rig', {})}  # eigen rig per model gaat voor de algemene
    rig = build_rig(objs, R, m.get('body', ()))
    orig, mask = prep_materials(objs)
    frames = [(a, i) for a in m['anims'] for i in range(CFG['anims'][a])]
    dirs = list(range(CFG['dirs']))
    if TEST:
        frames = [f for f in frames if f[1] == 0][:2]
    os.makedirs(TMP, exist_ok=True)
    tmp = os.path.join(TMP, key + '.png')
    from bpy_extras.object_utils import world_to_camera_view
    col, msk, pts = {}, {}, {}
    n = 0
    for d in dirs:
        set_dir(rig[0], d)
        for (a, i) in frames:
            pose(rig, a, i, R)
            bpy.context.view_layer.update()
            # m['points']: punten op de romp (modelmaten), per beeld naar render-px; bv. 'hold' = waar het goed ligt
            pts[d, a, i] = {k: (lambda v: (v.x * res, (1 - v.y) * res))(world_to_camera_view(sc, cam, rig[1].matrix_world @ Vector(p)))
                            for k, p in m.get('points', {}).items()}
            set_pass(sc, False); apply_mats(objs, orig); col[d, a, i] = render_rgba(sc, tmp)
            set_pass(sc, True); apply_mats(objs, mask); msk[d, a, i] = render_rgba(sc, tmp, linear=True)
            n += 1
            if n % 10 == 0:
                check_disk()
                print(f'  {key}: {n}/{len(dirs) * len(frames)} beelden', flush=True)
    os.remove(tmp)
    # gezamenlijk kader over alle beelden, op een veelvoud van de grootste verkleining
    al = np.max(np.stack([c[..., 3] for c in col.values()]), axis=0)
    ys, xs = np.nonzero(al > CFG['cropAlpha'])  # vage schaduwranden tellen niet mee voor het kader
    F = CFG['supersample'] * max(CFG['sizes']) // min(CFG['sizes'])
    x0, y0 = int(xs.min()) // F * F, int(ys.min()) // F * F
    x1, y1 = -(-(int(xs.max()) + 1) // F) * F, -(-(int(ys.max()) + 1) // F) * F
    cw, ch = x1 - x0, y1 - y0
    # anker: projectie van de oorsprong (voeten) in het render-kader
    v = world_to_camera_view(sc, cam, Vector((0, 0, 0)))
    ax, ay = v.x * res - x0, (1 - v.y) * res - y0
    out = {'model': os.path.basename(m['glb']), 'key': key, 'dirs': CFG['dirs'],
           'dirNote': '0 = oost (schermrechts), met de klok mee per 45 graden; 2 = zuid (naar de kijker)',
           'anims': {a: CFG['anims'][a] for a in m['anims']},
           'refHeight': CFG['refHeight'], 'sizes': []}
    written = []
    cols = len(frames)
    for size in CFG['sizes']:
        f = CFG['supersample'] * max(CFG['sizes']) // size
        w, h = cw // f, ch // f
        atlas = np.zeros((h * len(dirs), w * cols, 4), np.float32)
        matlas = np.zeros_like(atlas)
        fl = []
        for r, d in enumerate(dirs):
            for c, (a, i) in enumerate(frames):
                atlas[r * h:(r + 1) * h, c * w:(c + 1) * w] = shrink(col[d, a, i][y0:y1, x0:x1], f)
                mm = msk[d, a, i][y0:y1, x0:x1].copy()
                mm[..., :3] = mm[..., :1]  # één kanaal is genoeg: grijswaarde = aandeel spelerkleur
                matlas[r * h:(r + 1) * h, c * w:(c + 1) * w] = shrink(mm, f)
                fe = {'anim': a, 'dir': d, 'i': i, 'x': c * w, 'y': r * h, 'w': w, 'h': h,
                      'ax': round(ax / f, 2), 'ay': round(ay / f, 2)}
                if pts[d, a, i]:  # punten in px binnen het beeld, net als het anker
                    fe['pts'] = {k: [round((px - x0) / f, 2), round((py - y0) / f, 2)] for k, (px, py) in pts[d, a, i].items()}
                fl.append(fe)
        base = os.path.join(TMP if TEST else ASSETS, m['out'] + f'_{size}')
        os.makedirs(os.path.dirname(base), exist_ok=True)
        save_webp(atlas, base + '.webp', CFG['quality'])
        save_webp(matlas, base + '_mask.webp', 100, linear=True)
        if TEST:  # voorbeeld om te bekijken: kleur boven, masker eronder, op grijs
            g = np.concatenate([atlas, matlas]); bg = np.full_like(g, 0.45); bg[..., 3] = 1
            pv = bg.copy(); pv[..., :3] = g[..., :3] * g[..., 3:4] + bg[..., :3] * (1 - g[..., 3:4])
            save_png(pv, base + '_voorbeeld.png')
        written += [base + '.webp', base + '_mask.webp']
        rel = os.path.relpath(base, TMP if TEST else ASSETS)
        out['sizes'].append({'px': size, 'file': rel + '.webp', 'mask': rel + '_mask.webp',
                             'w': w * cols, 'h': h * len(dirs), 'frames': fl})
    jpath = os.path.join(TMP if TEST else ASSETS, m['out'] + '.json')
    json.dump(out, open(jpath, 'w'), indent=1)
    written.append(jpath)
    print(f'{key}: kader {cw}x{ch} render-px, anker {ax:.0f},{ay:.0f}, groepen benen {len(rig[5]["legs"][-1])}+{len(rig[5]["legs"][1])}, '
          f'armen {len(rig[5]["arms"][-1])}+{len(rig[5]["arms"][1])}, romp {len(rig[5]["body"])}, zwaardkant {rig[4]}', flush=True)
    return os.path.relpath(jpath, ASSETS), file_hash(written)


def register(entries):
    mf = os.path.join(ASSETS, 'manifest.json')
    man = json.load(open(mf))
    units = man.setdefault('units', {})
    for key, (j, v) in entries.items():
        units[key] = {'json': j, 'v': v}
    json.dump(man, open(mf, 'w'), indent=4, ensure_ascii=False)
    open(mf, 'a').write('\n')


done = {}
for k in KEYS:
    done[k] = render_model(k, CFG['models'][k])
if not TEST:
    register(done)
print('KLAAR', ', '.join(done))
