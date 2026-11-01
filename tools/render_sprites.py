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
# Dieren (CFG['animals']): per animatie een eigen GLB (staand, rustend); lopen wordt nagebootst per gang
# (quad: poten diagonaal zwaaien, hop: huppen, swim: deinen). Wilde dieren hebben geen spelerkleur, dus geen masker.
import bpy, sys, os, json, math, hashlib, shutil, re
import numpy as np
from mathutils import Vector, Matrix, Euler

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CFG = json.load(open(os.path.join(ROOT, 'tools', 'sprites.json')))
ASSETS = os.path.join(ROOT, 'public', 'assets')
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
TEST = '--test' in argv
KEYS = [a for a in argv if not a.startswith('--')] or list(CFG['models']) + list(CFG.get('duels', {})) + list(CFG.get('animals', {}))
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


def load_model(path, hide=(), keep_hierarchy=False):
    bpy.ops.import_scene.gltf(filepath=path)
    bpy.context.view_layer.update()  # matrix_world klopt pas na een update
    for o in list(bpy.context.scene.objects):  # m['hide']: onderdelen weglaten (bv. de kist van de drager)
        if any(o.name.startswith(h) for h in hide):
            bpy.data.objects.remove(o, do_unlink=True)
    objs = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.name != 'Schaduwvanger']
    for o in ([] if keep_hierarchy else objs):  # losse onderdelen: eventuele ouders loskoppelen met behoud van plek
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


def clip_rig(objs, new, anim=True):
    """model met een eigen loopclip (m['clip'], bv. de ambachten) of een vaste houding (m['static'], de werkhoudingen):
    de hiërarchie blijft heel, alles hangt onder Root"""
    root = empty('Root', (0, 0, 0))
    for o in new:
        if o.parent is None:
            attach(o, root)
    acts = [o.animation_data.action for o in new if o.animation_data and o.animation_data.action]
    if not anim:
        return root, 0, 0
    if not acts:
        raise SystemExit('geen animatie in het model')
    f0 = min(a.frame_range[0] for a in acts)
    f1 = max(a.frame_range[1] for a in acts)
    return root, f0, f1


def clip_pose(sc, anim, i, f0, f1, idle=0.25):
    """walk: CFG.anims.walk beelden gelijk verdeeld over de clip (het laatste beeld = het eerste, dus niet meegenomen);
    idle: het moment 'idle' (deel van de clip) waarop de voeten het dichtst bij elkaar staan"""
    f = f0 + (f1 - f0) * (i / CFG['anims']['walk'] if anim == 'walk' else idle)
    sc.frame_set(int(f), subframe=f - int(f))


def set_dir(root, d):
    a = d * 360 / CFG['dirs']  # schermhoek, 0 = oost, met de klok mee (zuid = naar de kijker)
    root.rotation_euler = (0, 0, math.radians(90 - a))


# ---------- materialen voor kleur- en maskerpass ----------
def mask_color(m):
    """maskerkleur per materiaal: TEAM_R_* rood (linker deelnemer), TEAM_G_* groen (rechter), andere TEAM wit"""
    if m is None or not m.name.upper().startswith('TEAM'):
        return (0, 0, 0)
    n = m.name.upper()
    return (1, 0, 0) if n.startswith('TEAM_R_') else (0, 1, 0) if n.startswith('TEAM_G_') else (1, 1, 1)


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
        e.inputs[0].default_value = (*v, 1)
        e.inputs[1].default_value = 1
        o = nt.nodes.new('ShaderNodeOutputMaterial')
        nt.links.new(e.outputs[0], o.inputs[0])
        return m
    cache = {}
    def mmat(c):
        if c not in cache:
            cache[c] = emis('MASK_%d%d%d' % c, c)
        return cache[c]
    orig = {o.name: [s.material for s in o.material_slots] for o in objs}
    mask = {o.name: [mmat(mask_color(m)) for m in orig[o.name]] for o in objs}
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
    before = set(sc.objects)
    whole = 'clip' in m or m.get('static')
    objs = load_model(os.path.join(ROOT, m['glb']), m.get('hide', ()), keep_hierarchy=whole)
    for g in m.get('extra', ()):  # m['extra']: losse GLB's erbij, op hun eigen plek (bv. het gereedschap bij een werkhouding)
        load_model(os.path.join(ROOT, g), keep_hierarchy=True)
    if m.get('extra'):
        objs = [o for o in sc.objects if o not in before and o.type == 'MESH']
    R = {**CFG['rig'], **m.get('rig', {})}  # eigen rig per model gaat voor de algemene
    if whole:  # eigen loopclip of vaste houding: geen nagebootste scharnieren
        root, f0, f1 = clip_rig(objs, [o for o in sc.objects if o not in before], anim='clip' in m)
        rig = (root, root, {}, {}, -1, {'legs': {-1: [], 1: []}, 'arms': {-1: [], 1: []}, 'body': []})
    else:
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
            if 'clip' in m:
                clip_pose(sc, a, i, f0, f1, m.get('idle', 0.25))
            elif not m.get('static'):
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


def register(entries, duels={}, animals={}):
    mf = os.path.join(ASSETS, 'manifest.json')
    man = json.load(open(mf))
    for section, ents in (('units', entries), ('duels', duels), ('animals', animals)):
        if not ents:
            continue
        sec = man.setdefault(section, {})
        for key, (j, v) in ents.items():
            sec[key] = {'json': j, 'v': v}
    json.dump(man, open(mf, 'w'), indent=4, ensure_ascii=False)
    open(mf, 'a').write('\n')


def duel_frames():
    """frames van de geïmporteerde animatie (9 standen), oplopend"""
    fr = set()
    for a in bpy.data.actions:
        for fc in a.fcurves:
            fr.update(round(k.co.x, 3) for k in fc.keyframe_points)
    return sorted(fr)


def render_duel(key, m):
    """duel-sprite: per niveaucombinatie (rijen) de standen (kolommen); masker R = links, G = rechts"""
    check_disk()
    L = m['levels']
    combos = [(l, r) for l in L for r in L]
    if TEST:
        combos = combos[:1]
    os.makedirs(TMP, exist_ok=True)
    tmp = os.path.join(TMP, key + '.png')
    col, msk = {}, {}
    nst = m['standen']
    for (l, r) in combos:
        sc, cam, ppu, res = setup_scene()
        objs = load_model(os.path.join(ROOT, m['glb'].format(l=l, r=r)), keep_hierarchy=True)  # animatie zit in de hiërarchie
        # alles 90 graden om de verticale as: Player (TEAM_R) links, Opponent (TEAM_G) rechts op het scherm
        root = empty('Duel', (0, 0, 0))
        for o in list(bpy.context.scene.objects):
            if o is not root and o.parent is None and o.type in ('MESH', 'EMPTY'):
                o.parent = root
        root.rotation_euler = (0, 0, math.radians(m.get('rotate', 90)))
        frames = duel_frames()
        if len(frames) != nst:
            raise SystemExit(f'{key}: {len(frames)} animatieframes gevonden, {nst} standen verwacht')
        orig, mask = prep_materials(objs)
        stands = range(nst) if not TEST else [0, nst // 2, nst - 1]
        for k in stands:
            sc.frame_set(int(frames[k]), subframe=frames[k] - int(frames[k]))
            bpy.context.view_layer.update()
            set_pass(sc, False); apply_mats(objs, orig); col[l, r, k] = render_rgba(sc, tmp)
            set_pass(sc, True); apply_mats(objs, mask); msk[l, r, k] = render_rgba(sc, tmp, linear=True)
            check_disk()
        print(f'  {key}: niveaus {l}-{r} klaar', flush=True)
    os.remove(tmp)
    al = np.max(np.stack([c[..., 3] for c in col.values()]), axis=0)
    ys, xs = np.nonzero(al > CFG['cropAlpha'])
    F = CFG['supersample'] * max(CFG['sizes']) // min(CFG['sizes'])
    x0, y0 = int(xs.min()) // F * F, int(ys.min()) // F * F
    x1, y1 = -(-(int(xs.max()) + 1) // F) * F, -(-(int(ys.max()) + 1) // F) * F
    cw, ch = x1 - x0, y1 - y0
    from bpy_extras.object_utils import world_to_camera_view
    v = world_to_camera_view(sc, cam, Vector((0, 0, 0)))
    ax, ay = v.x * res - x0, (1 - v.y) * res - y0
    stands = sorted({k for (_, _, k) in col})
    out = {'model': os.path.basename(m['glb']), 'key': key, 'standen': nst,
           'standNote': '1 = links wint bijna, ' + str((nst + 1) // 2) + ' = neutraal, ' + str(nst) + ' = rechts wint bijna; '
                        'masker R = linker deelnemer, G = rechter',
           'levels': L, 'refHeight': CFG['refHeight'], 'sizes': []}
    written = []
    for size in CFG['sizes']:
        f = CFG['supersample'] * max(CFG['sizes']) // size
        w, h = cw // f, ch // f
        atlas = np.zeros((h * len(combos), w * len(stands), 4), np.float32)
        matlas = np.zeros_like(atlas)
        fl = []
        for rr, (l, r) in enumerate(combos):
            for c, k in enumerate(stands):
                atlas[rr * h:(rr + 1) * h, c * w:(c + 1) * w] = shrink(col[l, r, k][y0:y1, x0:x1], f)
                mm = msk[l, r, k][y0:y1, x0:x1].copy()
                mm[..., 2] = 0  # B = 0
                matlas[rr * h:(rr + 1) * h, c * w:(c + 1) * w] = shrink(mm, f)
                fl.append({'stand': k + 1, 'lvlL': l, 'lvlR': r, 'x': c * w, 'y': rr * h, 'w': w, 'h': h,
                           'ax': round(ax / f, 2), 'ay': round(ay / f, 2)})
        base = os.path.join(TMP if TEST else ASSETS, m['out'] + f'_{size}')
        os.makedirs(os.path.dirname(base), exist_ok=True)
        save_webp(atlas, base + '.webp', CFG['quality'])
        save_webp(matlas, base + '_mask.webp', 100, linear=True)
        written += [base + '.webp', base + '_mask.webp']
        if TEST:
            g = np.concatenate([atlas, matlas]); bg = np.full_like(g, 0.45); bg[..., 3] = 1
            pv = bg.copy(); pv[..., :3] = g[..., :3] * g[..., 3:4] + bg[..., :3] * (1 - g[..., 3:4])
            save_png(pv, base + '_voorbeeld.png')
        rel = os.path.relpath(base, TMP if TEST else ASSETS)
        out['sizes'].append({'px': size, 'file': rel + '.webp', 'mask': rel + '_mask.webp',
                             'w': w * len(stands), 'h': h * len(combos), 'frames': fl})
    jpath = os.path.join(TMP if TEST else ASSETS, m['out'] + '.json')
    json.dump(out, open(jpath, 'w'), indent=1)
    written.append(jpath)
    print(f'{key}: kader {cw}x{ch} render-px, anker {ax:.0f},{ay:.0f}, {len(combos)} combinaties x {len(stands)} standen', flush=True)
    return os.path.relpath(jpath, ASSETS), file_hash(written)


# ---------- dieren ----------
LEG = re.compile('leg|knee|hoof|sock|paw|thigh|ankle|foot', re.I)


def animal_rig(objs, A):
    """Root (richting, schaal) → Lijf (huppen, deinen) → onderdelen; bij gang quad per poot een scharnier bovenaan"""
    root = empty('Root', (0, 0, 0))
    root.scale = (A['scale'],) * 3
    body = empty('Lijf', (0, 0, 0), root)
    bpy.context.view_layer.update()
    legs = {}
    if A['gait'] == 'quad':
        L = [o for o in objs if LEG.search(o.name)]
        my = sum(center(o).y for o in L) / max(1, len(L))
        groups = {}
        for o in L:
            c = center(o)
            groups.setdefault((1 if c.x > 0 else -1, 1 if c.y > my else -1), []).append(o)
        for k, part in groups.items():
            top = max((o.matrix_world @ Vector(c)).z for o in part for c in o.bound_box)
            cx = sum(center(o).x for o in part) / len(part)
            cy = sum(center(o).y for o in part) / len(part)
            legs[k] = empty('Poot', (cx, cy, top * A['legTop']), body)
        bpy.context.view_layer.update()
        for k, part in groups.items():
            for o in part:
                attach(o, legs[k])
    for o in objs:
        if o.parent is None:
            attach(o, body)
    return root, body, legs


def animal_pose(rig, anim, i, A):
    root, body, legs = rig
    body.location = (0, 0, 0)
    body.rotation_euler = (0, 0, 0)
    for e in legs.values():
        e.rotation_euler = (0, 0, 0)
    if anim != 'walk':
        return
    ph = i / CFG['anims']['walk'] * 2 * math.pi
    g = A['gait']
    if g == 'quad':  # linksvoor en rechtsachter samen, dan de andere twee
        a = math.radians(A['swing']) * math.sin(ph)
        for (sx, sy), e in legs.items():
            e.rotation_euler.x = a if sx * sy > 0 else -a
        body.location.z = A['bob'] * math.cos(2 * ph)
    elif g == 'hop':  # één sprong per cyclus, de helft van de tijd op de grond
        h = max(0.0, math.sin(ph))
        body.location.z = A['hop'] * h
        body.rotation_euler.x = math.radians(A['tilt']) * math.cos(ph) * h
    elif g == 'swim':
        body.location.z = A['bob'] * math.sin(ph)
        body.rotation_euler.y = math.radians(A['roll']) * math.sin(ph)


def render_animal(key, m):
    """dier: per animatie uit m['anims'] (naam → GLB) idle 1 beeld, walk CFG.anims.walk beelden, rest 1 beeld; 8 richtingen"""
    check_disk()
    A = {**CFG['animalRig'], **m.get('rig', {})}
    from bpy_extras.object_utils import world_to_camera_view
    os.makedirs(TMP, exist_ok=True)
    tmp = os.path.join(TMP, key + '.png')
    dirs = list(range(CFG['dirs']))
    col, frames = {}, []
    for anim, glb in m['anims'].items():
        sc, cam, ppu, res = setup_scene()
        objs = load_model(os.path.join(ROOT, glb))
        rig = animal_rig(objs, A)
        orig, _ = prep_materials(objs)
        set_pass(sc, False); apply_mats(objs, orig)
        n = CFG['anims'].get(anim, 1) if anim == 'walk' else 1
        fr = [(anim, i) for i in range(n)][:1 if TEST else n]
        frames += fr
        for d in dirs:
            set_dir(rig[0], d)
            for (a, i) in fr:
                animal_pose(rig, a, i, A)
                bpy.context.view_layer.update()
                col[d, a, i] = render_rgba(sc, tmp)
            check_disk()
        print(f'  {key}: {anim} klaar ({glb}, poten {len(rig[2])})', flush=True)
    os.remove(tmp)
    al = np.max(np.stack([c[..., 3] for c in col.values()]), axis=0)
    ys, xs = np.nonzero(al > CFG['cropAlpha'])
    F = CFG['supersample'] * max(CFG['sizes']) // min(CFG['sizes'])
    x0, y0 = int(xs.min()) // F * F, int(ys.min()) // F * F
    x1, y1 = -(-(int(xs.max()) + 1) // F) * F, -(-(int(ys.max()) + 1) // F) * F
    cw, ch = x1 - x0, y1 - y0
    v = world_to_camera_view(sc, cam, Vector((0, 0, 0)))
    ax, ay = v.x * res - x0, (1 - v.y) * res - y0
    out = {'model': key, 'key': key, 'dirs': CFG['dirs'],
           'dirNote': '0 = oost (schermrechts), met de klok mee per 45 graden; 2 = zuid (naar de kijker)',
           'anims': {a: sum(1 for f in frames if f[0] == a) for a in m['anims']}, 'scale': A['scale'],
           'refHeight': CFG['refHeight'], 'sizes': []}
    written = []
    for size in CFG['sizes']:
        f = CFG['supersample'] * max(CFG['sizes']) // size
        w, h = cw // f, ch // f
        atlas = np.zeros((h * len(dirs), w * len(frames), 4), np.float32)
        fl = []
        for r, d in enumerate(dirs):
            for c, (a, i) in enumerate(frames):
                atlas[r * h:(r + 1) * h, c * w:(c + 1) * w] = shrink(col[d, a, i][y0:y1, x0:x1], f)
                fl.append({'anim': a, 'dir': d, 'i': i, 'x': c * w, 'y': r * h, 'w': w, 'h': h,
                           'ax': round(ax / f, 2), 'ay': round(ay / f, 2)})
        base = os.path.join(TMP if TEST else ASSETS, m['out'] + f'_{size}')
        os.makedirs(os.path.dirname(base), exist_ok=True)
        save_webp(atlas, base + '.webp', CFG['quality'])
        if TEST:
            bg = np.full_like(atlas, 0.45); bg[..., 3] = 1
            pv = bg.copy(); pv[..., :3] = atlas[..., :3] * atlas[..., 3:4] + bg[..., :3] * (1 - atlas[..., 3:4])
            save_png(pv, base + '_voorbeeld.png')
        written.append(base + '.webp')
        rel = os.path.relpath(base, TMP if TEST else ASSETS)
        out['sizes'].append({'px': size, 'file': rel + '.webp', 'w': w * len(frames), 'h': h * len(dirs), 'frames': fl})
    jpath = os.path.join(TMP if TEST else ASSETS, m['out'] + '.json')
    json.dump(out, open(jpath, 'w'), indent=1)
    written.append(jpath)
    print(f'{key}: kader {cw}x{ch} render-px, anker {ax:.0f},{ay:.0f}, {len(frames)} beelden per richting', flush=True)
    return os.path.relpath(jpath, ASSETS), file_hash(written)


if __name__ == '__main__':  # ook te importeren voor de hulpfuncties (tools/render_wieken.py)
    done, duels, animals = {}, {}, {}
    for k in KEYS:
        if k in CFG['models']:
            done[k] = render_model(k, CFG['models'][k])
        elif k in CFG.get('duels', {}):
            duels[k] = render_duel(k, CFG['duels'][k])
        elif k in CFG.get('animals', {}):
            animals[k] = render_animal(k, CFG['animals'][k])
        else:
            raise SystemExit(f'Onbekende sleutel {k}: niet in models, duels of animals van tools/sprites.json')
    if not TEST:
        register(done, duels, animals)
    print('KLAAR', ', '.join(list(done) + list(duels) + list(animals)))
