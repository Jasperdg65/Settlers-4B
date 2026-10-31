from pathlib import Path
exec((Path(__file__).resolve().parent/'character_helpers.py').read_text())
from mathutils import Matrix
OUT=str(Path(__file__).resolve().parent)
mat('Felt',(.24,.22,.18),rough=.96)
mat('Felt_Light',(.39,.35,.27),rough=.96)
mat('TEAM_Felt',(.025,.22,.54),rough=.96)
mat('Wood',(.34,.17,.065),rough=.82)
mat('Wood_Light',(.46,.255,.10),rough=.82)
mat('Lip',(.43,.205,.12))
mat('Skin_Shadow',(.59,.30,.16))

def remove(o):
 if o in objects:objects.remove(o)
 bpy.data.objects.remove(o,do_unlink=True)

def hand(name,p,wrestle=False):
 x,y,z=p
 uv(name+'_Palm',(x,y,z),(.085,.072,.09),'Skin_Light')
 if wrestle:
  for i in range(4):
   uv(name+'_Finger',(x+.055,y-.04+(i%2)*.065,z-.048+(i//2)*.053),(.038,.038,.027),'Skin_Light')
  uv(name+'_Thumb',(x-.055,y-.034,z+.05),(.041,.039,.057),'Skin_Light')
 else:
  for i in range(4):uv(name+'_Finger',(x-.055+i*.037,y-.055,z-.018),(.024,.036,.064),'Skin_Light')
  uv(name+'_Thumb',(x+.065,y-.025,z+.045),(.034,.045,.058),'Skin_Light')

def arm(name,shoulder,elbow,wrist,wrestle=False):
 shoulder,elbow,wrist=map(Vector,[shoulder,elbow,wrist])
 uv(name+'_Deltoid',shoulder,(.176,.166,.173),'Skin_Light')
 limb(name+'_UpperArm',shoulder,elbow,.153,.15,'Skin_Light')
 d=elbow-shoulder
 # Raised biceps mass on front of upper arm; warm, rounded heroic proportions.
 limb(name+'_Biceps',shoulder+d*.20+Vector((0,-.036,0)),shoulder+d*.76+Vector((0,-.045,0)),.157,.145,'Skin_Light')
 uv(name+'_Elbow',elbow,(.132,.13,.127),'Skin')
 limb(name+'_Forearm',elbow,wrist,.132,.127,'Skin_Light')
 axis=(wrist-elbow).normalized()
 p=elbow+(wrist-elbow)*.73
 cyl(name+'_Felt_wristband',p-axis*.038,p+axis*.038,.133,'TEAM_Felt',r2=.13)
 cyl(name+'_Brass_band_edge',p-axis*.042,p-axis*.032,.137,'Brass')
 cyl(name+'_Brass_band_edge',p+axis*.032,p+axis*.042,.134,'Brass')
 # One slim upper-arm band, leaving the muscles visible.
 axis2=d.normalized();p2=shoulder+d*.42
 cyl(name+'_Upper_armband',p2-axis2*.018,p2+axis2*.018,.16,'Brass')
 hand(name,tuple(wrist),wrestle)

def make_sash():
 from mathutils.bvhtree import BVHTree
 bpy.context.view_layer.update()
 verts=[];faces=[]
 for o in objects:
  if not o.name.startswith(('Bare_torso','Pectoral','Upper_abdominal','Lower_abdominal','TEAM_Felt_kilt','Right_Deltoid','Left_Deltoid','Wrestling_right_Deltoid','Support_left_Deltoid')):continue
  offset=len(verts);verts.extend([o.matrix_world@v.co for v in o.data.vertices]);faces.extend([tuple(offset+i for i in f.vertices) for f in o.data.polygons])
 bvh=BVHTree.FromPolygons(verts,faces)
 start=Vector((-.30,0,1.425));end=Vector((.255,0,1.075));tangent=(end-start).normalized();width=Vector((-tangent.z,0,tangent.x))*.086
 vs=[];fs=[];rows=48;cols=8
 for side in [-1,1]:
  for i in range(rows+1):
   c=start.lerp(end,i/rows)
   for j in range(cols+1):
    p=c+width*(2*j/cols-1);hit=bvh.ray_cast(Vector((p.x,side*3,p.z)),Vector((0,-side,0)),6)[0]
    y=hit.y+side*.012 if hit else side*.09
    vs.append((p.x,y,p.z))
 stride=cols+1;layer=(rows+1)*stride
 for side in range(2):
  for i in range(rows):
   for j in range(cols):
    a=side*layer+i*stride+j;fs.append((a,a+1,a+1+stride,a+stride))
 # Join front and back over the shoulder and hip; no loose shoulder flap.
 for i in [0,rows]:
  for j in range(cols):
   a=i*stride+j;fs.append((a,a+1,a+1+layer,a+layer))
 sash=mesh('TEAM_Broad_felt_sash',vs,fs,'TEAM_Felt')
 mod=sash.modifiers.new('Felt thickness','SOLIDIFY');mod.thickness=.008
 bpy.context.view_layer.objects.active=sash;bpy.ops.object.modifier_apply(modifier=mod.name)

def strongman(level,pose='idle',opponent=False):
 global objects
 soldier(level)
 erase=['Tunic_torso','Tunic_stitch','Sleeve','Upper_arm','Elbow','Forearm','Bracer','Glove_',
        'Chest_strap','Strap_clasp','Belt_pouch','Pouch_','Sword_','Grip_wrap','Shield_','Mouth']
 for o in objects[:]:
  if any(o.name.startswith(p) for p in erase):remove(o)
 # Replace every leather item by felt. Keep helmet materials unchanged.
 for o in objects:
  for slot in o.material_slots:
   if slot.material.name=='Leather':slot.material=M['Felt']
   elif slot.material.name=='Leather_Light':slot.material=M['Felt_Light']
   elif slot.material.name=='TEAM_Cloth':slot.material=M['TEAM_Felt']
  if o.name.startswith('Boot_'):o.name=o.name.replace('Boot_','Felt_boot_')
  if o.name.startswith('Belt'):o.name=o.name.replace('Belt','Felt_waistband')
  if o.name.startswith('Tunic_skirt'):o.name='TEAM_Felt_kilt'
 # Bare torso, narrowing at the waist, broad chest. No leather chest straps.
 ringbody('Bare_torso',[(1.035,.26,.183),(1.12,.275,.19),(1.29,.335,.205),(1.40,.38,.21),(1.48,.30,.17),(1.50,.14,.13)],'Skin_Light')
 for s in [-1,1]:
  uv('Pectoral',(s*.158,-.165,1.355),(.185,.09,.114),'Skin_Light')
  uv('Upper_abdominal',(s*.079,-.182,1.205),(.085,.035,.065),'Skin_Light')
  uv('Lower_abdominal',(s*.071,-.177,1.102),(.078,.028,.057),'Skin_Light')
  uv('Nipple',(s*.183,-.249,1.35),(.013,.005,.012),'Skin_Shadow')
 # Friendlier mouth; preserve clean/snor/snor+baard progression.
 curve('Smile',[(-.05,-.192,1.586),(0,-.211,1.575),(.05,-.192,1.586)],'Lip',.009)
 if pose=='idle':
  for s in [-1,1]:arm('Left' if s==1 else 'Right',(s*.365,0,1.385),(s*.51,-.015,1.12),(s*.53,-.13,.89))
 else:
  arm('Wrestling_right',(-.365,0,1.385),(-.22,-.46,1.17),(-.028,-.625,1.535),True)
  arm('Support_left',(.365,0,1.385),(.51,-.10,1.18),(.52,-.265,1.105))
 make_sash()
 root=bpy.data.objects.new(('Opponent' if opponent else 'Player')+'_'+str(level)+'_'+pose,None);bpy.context.collection.objects.link(root)
 for o in objects:o.parent=root
 if opponent:
  cache={}
  for o in objects:
   for slot in o.material_slots:
    m=slot.material
    if m and m.name.startswith('TEAM_'):
     if m.name not in cache:
      alt=m.copy();alt.name=m.name.replace('TEAM_','OPPONENT_',1)
      alt.diffuse_color=(.54,.095,.045,1);alt.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.54,.095,.045,1);cache[m.name]=alt
     slot.material=cache[m.name]
 return root,objects[:]

def export(name,roots,meshes,animated=False):
 bpy.ops.object.select_all(action='DESELECT')
 for o in roots+meshes:o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,name+'.glb'),export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_materials='EXPORT',export_cameras=False,export_lights=False,export_animations=animated,export_animation_mode='SCENE',export_frame_range=True,export_force_sampling=True)
 if animated:
  # One coordinated clip instead of a separate glTF clip for every arm part.
  import struct
  path=os.path.join(OUT,name+'.glb');raw=open(path,'rb').read();chunks=[];p=12
  while p<len(raw):
   length,kind=struct.unpack_from('<II',raw,p);chunks.append((kind,raw[p+8:p+8+length]));p+=8+length
  g=json.loads(chunks[0][1]);clip={'name':'Armpje_drukken_9_standen','samplers':[],'channels':[]}
  for a in g.get('animations',[]):
   off=len(clip['samplers']);clip['samplers']+=a['samplers']
   for ch in a['channels']:ch['sampler']+=off;clip['channels'].append(ch)
  g['animations']=[clip];g.setdefault('extras',{})['duel_pose_count']=9
  doc=json.dumps(g,separators=(',',':')).encode();doc+=b' '*((-len(doc))%4);chunks[0]=(chunks[0][0],doc)
  body=b''.join(struct.pack('<II',len(data),kind)+data for kind,data in chunks)
  with open(path,'wb') as f:f.write(struct.pack('<III',0x46546c67,2,len(body)+12)+body)

# Meeleunen: het bovenlijf draait rond de heup. Bij de uiterste standen leunt de verliezer LEAN_LOSE graden weg
# en de winnaar LEAN_WIN graden naar voren; tussenstanden evenredig. Stand 1: Player (TEAM_R) wint bijna, 9: Opponent.
HIP=.90;LEAN_LOSE=18;LEAN_WIN=6
def lean_rig(players):
 uppers=[]
 for r in players:
  up=bpy.data.objects.new(r.name+'_Upper',None);bpy.context.collection.objects.link(up);up.parent=r;up.location=(0,0,HIP)
  for o in list(r.children):
   n=o.name.lower()
   if o is up or 'boot' in n or 'trouser' in n:continue
   o.parent=up;o.matrix_parent_inverse=Matrix.Translation((0,0,-HIP))
  uppers.append(up)
 return uppers

def build_duel_motion(scene,roots):
 scene.frame_start=1;scene.frame_end=9;scene.render.fps=8
 bpy.context.view_layer.update()
 players=[r for r in roots if r.name.startswith(('Player','Opponent'))]
 uppers=lean_rig(players)
 axis=Vector((.8,-.6,0));lateral=Vector((.6,.8,0));center=Vector((0,0,1.17));radius=.365
 records=[]
 for i,(r,up) in enumerate(zip(players,uppers)):
  e=Vector((-.22,-.46,1.17));w=Vector((-.028,-.625,1.535));d=(w-e).normalized()
  records.append((r,up,e,w,d,{o:o.matrix_basis.copy() for o in up.children if o.name.startswith('Wrestling_right')}))
 data=[]
 for frame in range(1,10):
  theta=math.radians(-75+(frame-1)*18.75)  # frame 1: handen naar de kant van Opponent, dus Player (TEAM_R) wint bijna
  h=center+Vector((0,0,radius*math.cos(theta)))+lateral*(radius*math.sin(theta))
  s=(5-frame)/4  # +1 Player wint bijna, -1 Opponent wint bijna
  for i,up in enumerate(uppers):
   win=s if i==0 else -s
   up.rotation_mode='XYZ';up.rotation_euler=(math.radians(LEAN_WIN*win if win>0 else LEAN_LOSE*win),0,0)
   up.keyframe_insert(data_path='rotation_euler',frame=frame)
  bpy.context.view_layer.update()
  endpoints=[]
  for i,(r,up,e,w,d,parts) in enumerate(records):
   M_=up.matrix_world@Matrix.Translation((0,0,-HIP));inv=M_.inverted()
   wp=inv@(h+axis*(-.028 if i==0 else .028));new_d=(wp-e).normalized();q=d.rotation_difference(new_d)
   edges=[o for o in parts if o.name.startswith('Wrestling_right_Brass_band_edge')]
   for o,base in parts.items():
    loc,rot,scale=base.decompose();name=o.name
    if not name.startswith(('Wrestling_right_Forearm','Wrestling_right_Felt_wristband','Wrestling_right_Brass_band_edge','Wrestling_right_Palm','Wrestling_right_Finger','Wrestling_right_Thumb')):continue
    o.rotation_mode='QUATERNION'
    if name.startswith('Wrestling_right_Forearm'):
     o.location=(e+wp)/2;o.rotation_quaternion=new_d.to_track_quat('Z','Y');o.scale=(.132,.127,(wp-e).length/2+.132*.45)
    elif name.startswith(('Wrestling_right_Felt_wristband','Wrestling_right_Brass_band_edge')):
     p=e+(wp-e)*.73
     if o in edges:p+=new_d*(-.037 if edges.index(o)==0 else .037)
     o.location=p;o.rotation_quaternion=new_d.to_track_quat('Z','Y');o.scale=scale
    elif name.startswith(('Wrestling_right_Palm','Wrestling_right_Finger','Wrestling_right_Thumb')):
     o.location=wp+q@(loc-w);o.rotation_quaternion=q@rot;o.scale=scale
    else:continue
    o.keyframe_insert(data_path='location',frame=frame);o.keyframe_insert(data_path='rotation_quaternion',frame=frame);o.keyframe_insert(data_path='scale',frame=frame)
   endpoints.append(tuple(M_@wp))
  # Exact shared contact center and constant palm separation at all nine poses.
  assert abs((Vector(endpoints[0])-Vector(endpoints[1])).length-.056)<1e-5
  data.append({'frame':frame,'angle_degrees':-75+(frame-1)*18.75,'lean_player':LEAN_WIN*s if s>0 else LEAN_LOSE*s,'lean_opponent':LEAN_WIN*-s if s<0 else LEAN_LOSE*-s,
   'shared_hand_center':list(h),'palm_separation':.056,'description':'Player (TEAM_R) wint bijna' if frame==1 else 'neutraal' if frame==5 else 'Opponent (TEAM_G) wint bijna' if frame==9 else 'tussenstand'})
 scene.frame_set(5)
 return data

def studio(scene,comparison=False):
 bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.015));o=bpy.context.object;o.name='STUDIO_Floor'
 if 'Studio' not in M:mat('Studio',(.19,.16,.12))
 o.data.materials.append(M['Studio'])
 scene.world=bpy.data.worlds.new(scene.name+'_World');scene.world.use_nodes=True
 scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.20,.23,.27,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.4
 for pos,power,size,c in [((-3,-4,6),750,4,(1,.82,.63)),((3,-1,4),450,4,(.65,.78,1)),((1,3,5),850,3,(1,.76,.46))]:
  bpy.ops.object.light_add(type='AREA',location=pos);l=bpy.context.object;l.name='STUDIO_Area';l.data.energy=power;l.data.size=size;l.data.color=c;l.rotation_euler=(Vector((0,0,1))-l.location).to_track_quat('-Z','Y').to_euler()
 pos=(3.4,-8,3.5) if comparison else (4.8,-.8,3.0)
 bpy.ops.object.camera_add(location=pos);cam=bpy.context.object;cam.name='STUDIO_Camera';cam.rotation_euler=(Vector((0,0,1.08))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=5.5 if comparison else 3.4;scene.camera=cam
 scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=True;scene.view_settings.view_transform='AgX'
 scene.render.resolution_x=1800 if comparison else 1300;scene.render.resolution_y=1000 if comparison else 1200;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG'

def match_colors(scene):
 cache={}
 for o in scene.objects:
  if o.type!='MESH':continue
  for slot in o.material_slots:
   m=slot.material
   if not m:continue
   if m.name.startswith('TEAM_R_') or m.name.startswith('TEAM_G_'):continue
   if m.name.startswith('OPPONENT_'):key='TEAM_G_'+m.name[9:];col=(0,1,0,1)
   elif m.name.startswith('TEAM_'):key='TEAM_R_'+m.name[5:];col=(1,0,0,1)
   else:continue
   if key not in cache:
    a=m.copy();a.name=key;a.diffuse_color=col;a.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=col;cache[key]=a
   slot.material=cache[key]

def render_color_mask(scene):
 # Emission ID pass: R and G are coverage masks for independently recolorable regions.
 masks={}
 for key,col in [('R',(1,0,0,1)),('G',(0,1,0,1)),('Black',(0,0,0,1))]:
  m=bpy.data.materials.new('MASK_'+key);m.use_nodes=True;n=m.node_tree.nodes;n.clear();e=n.new('ShaderNodeEmission');e.inputs['Color'].default_value=col;e.inputs['Strength'].default_value=1;o=n.new('ShaderNodeOutputMaterial');m.node_tree.links.new(e.outputs[0],o.inputs['Surface']);masks[key]=m
 saved=[]
 for obj in scene.objects:
  if obj.type!='MESH':continue
  for slot in obj.material_slots:
   old=slot.material;saved.append((slot,old));name=old.name if old else ''
   slot.material=masks['R' if name.startswith('TEAM_R_') else 'G' if name.startswith('TEAM_G_') else 'Black']
 old_view=scene.view_settings.view_transform;old_look=scene.view_settings.look;old_dither=scene.render.dither_intensity;old_samples=scene.cycles.samples;old_path=scene.render.filepath;old_denoising=scene.cycles.use_denoising
 bg=scene.world.node_tree.nodes['Background'];old_bg=tuple(bg.inputs[0].default_value);old_strength=bg.inputs[1].default_value
 scene.view_settings.view_transform='Raw';scene.view_settings.look='None';scene.view_settings.exposure=0;scene.view_settings.gamma=1;scene.render.dither_intensity=0;scene.cycles.samples=16;scene.cycles.use_denoising=False
 bg.inputs[0].default_value=(0,0,0,1);bg.inputs[1].default_value=0
 scene.render.filepath=os.path.join(OUT,'armpje_drukken_kleurmasker_RG.png');bpy.ops.render.render(write_still=True)
 for slot,old in saved:slot.material=old
 scene.view_settings.view_transform=old_view;scene.view_settings.look=old_look;scene.render.dither_intensity=old_dither;scene.cycles.samples=old_samples;scene.cycles.use_denoising=old_denoising;scene.render.filepath=old_path;bg.inputs[0].default_value=old_bg;bg.inputs[1].default_value=old_strength

def make_table():
 # Sturdy neutral wooden arm-wrestling table and soft felt elbow pads.
 global objects
 objects=[]
 for i in range(4):
  y=(i-1.5)*.23
  box('Table_top_plank',(0,y,1.035),(1.27,.225,.10),'Wood_Light',.018)
 for x in [-.49,.49]:
  for y in [-.31,.31]:box('Table_leg',(x,y,.51),(.13,.13,.98),'Wood',.018)
 for x in [-.49,.49]:box('Table_lower_brace',(x,0,.29),(.085,.69,.10),'Wood',.015)
 box('Table_cross_brace',(0,0,.31),(1.07,.08,.12),'Wood',.015)
 for s in [-1,1]:
  box('Neutral_felt_elbow_pad',(s*.22,-s*.165,1.10),(.28,.23,.03),'Felt_Light',.015)
  cyl('Table_support_grip',(s*.52,s*.36,1.09),(s*.52,s*.36,1.22),.029,'Wood')
 table=bpy.data.objects.new('Arm_wrestling_table',None);bpy.context.collection.objects.link(table)
 for o in objects:o.parent=table
 return table,objects[:]

def build_duel(scene,lvl_player,lvl_opponent):
 roots=[];parts=[]
 for i,(level,side) in enumerate([(lvl_player,1),(lvl_opponent,-1)]):
  root,ps=strongman(level,'wrestle',opponent=i==1)
  root.location.y=side*.625;root.rotation_euler.z=0 if side==1 else math.pi
  roots.append(root);parts+=ps
 table,tparts=make_table();parts+=tparts;roots.append(table)
 match_colors(scene)
 return roots,parts,build_duel_motion(scene,roots)

levels_scene=bpy.context.scene;levels_scene.name='Drie niveaus'
for i,label in enumerate(['junior','medior','senior']):
 root,parts=strongman(i)
 export('krachtpatser_'+label,[root],parts)
 root.location.x=(i-1)*1.48
studio(levels_scene,True)
levels_scene.cycles.samples=24
levels_scene.render.filepath=os.path.join(OUT,'krachtpatsers_voorbeeld.png')
bpy.ops.render.render(write_still=True)

match=bpy.data.scenes.new('Armpje drukken');bpy.context.window.scene=match
roots=[];parts=[]
for i,(level,side) in enumerate([(1,1),(2,-1)]):
 root,ps=strongman(level,'wrestle',opponent=i==1)
 root.location.y=side*.625;root.rotation_euler.z=0 if side==1 else math.pi
 roots.append(root);parts+=ps
table,tparts=make_table()
parts+=tparts;roots.append(table)
match_colors(match)
pose_data=build_duel_motion(match,roots)
export('armpje_drukken',roots,parts,animated=True)
studio(match)
match.cycles.samples=16;match.render.resolution_x=768;match.render.resolution_y=768
match.render.filepath=os.path.join(OUT,'armpje_drukken_voorbeeld.png')
bpy.ops.object.select_all(action='DESELECT')
for screen in bpy.data.screens:
 for a in screen.areas:
  if a.type=='VIEW_3D':a.spaces.active.shading.type='MATERIAL';a.spaces.active.region_3d.view_distance=5
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'krachtpatsers_bron.blend'))
os.makedirs(os.path.join(OUT,'standen'),exist_ok=True)
os.makedirs(os.path.join(OUT,'renders'),exist_ok=True)
for pose in pose_data:
 frame=pose['frame'];match.frame_set(frame)
 export('standen/armpje_drukken_%02d'%frame,roots,parts)
 match.render.filepath=os.path.join(OUT,'renders','armpje_drukken_%02d.png'%frame)
 bpy.ops.render.render(write_still=True)
 render_color_mask(match)
 import shutil
 shutil.move(os.path.join(OUT,'armpje_drukken_kleurmasker_RG.png'),os.path.join(OUT,'renders','armpje_drukken_%02d_RG.png'%frame))
 if frame==5:
  shutil.copy(match.render.filepath,os.path.join(OUT,'armpje_drukken_voorbeeld.png'))
  shutil.copy(os.path.join(OUT,'renders','armpje_drukken_%02d_RG.png'%frame),os.path.join(OUT,'armpje_drukken_kleurmasker_RG.png'))
 print('POSE_DONE',frame,flush=True)
match.frame_set(5)
shutil.copy(os.path.join(OUT,'renders','armpje_drukken_05_RG.png'),os.path.join(OUT,'armpje_drukken_kleurmasker_RG.png'))
with open(os.path.join(OUT,'standen.json'),'w') as f:json.dump({'frame_count':9,'neutral_frame':5,'fps':8,'poses':pose_data},f,indent=2)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'krachtpatsers_bron.blend'))
# Alle niveaucombinaties (1-3 links/Player x 1-3 rechts/Opponent) voor tools/render_sprites.py, elk in een eigen scene.
os.makedirs(os.path.join(OUT,'duels'),exist_ok=True)
# Telkens met een schone lei (het .blend-bestand is hierboven al bewaard): headless komen nieuwe objecten
# niet betrouwbaar in een nieuwe scene terecht, en anders stapelen de combinaties zich op in de GLB's.
for a in range(3):
 for b in range(3):
  for o in list(bpy.data.objects):bpy.data.objects.remove(o,do_unlink=True)
  for ac in list(bpy.data.actions):bpy.data.actions.remove(ac)
  sc=bpy.context.scene
  r_,p_,_=build_duel(sc,a,b)
  export('duels/armpje_drukken_L%d_R%d'%(a+1,b+1),r_,p_,animated=True)
  print('DUEL_DONE',a+1,b+1,flush=True)
print('STRONGMEN_DONE')
