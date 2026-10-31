import bpy, math, os, json
from mathutils import Vector

OUT='/workspace/scratch/c013430aee66/soldaten'
os.makedirs(OUT,exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
M={}
def mat(name,color,metal=0,rough=.65):
 m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1); p.inputs['Metallic'].default_value=metal; p.inputs['Roughness'].default_value=rough
 M[name]=m; return m
mat('TEAM_Cloth',(0.025,.22,.54)); mat('TEAM_Shield',(.025,.22,.54)); mat('TEAM_Crest',(.025,.22,.54))
mat('Skin',(.63,.34,.18)); mat('Skin_Light',(.77,.46,.27)); mat('Steel',(.30,.37,.43),.72,.36)
mat('Blade',(.63,.72,.77),.85,.27); mat('Brass',(.55,.33,.105),.65,.42)
mat('Leather',(.16,.072,.034)); mat('Leather_Light',(.27,.13,.055)); mat('Linen',(.70,.61,.43))
mat('Hair',(.12,.045,.017)); mat('Eye_White',(.90,.86,.71)); mat('Eye',(.024,.035,.033)); mat('Seam',(.013,.10,.25))
objects=[]
def finish(o,name,material,smooth=True):
 o.name=name; o.data.materials.append(M[material]); objects.append(o)
 if smooth:
  for f in o.data.polygons: f.use_smooth=True
 return o
def uv(name,loc,scale,material):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=16,location=loc)
 o=bpy.context.object; o.scale=scale; return finish(o,name,material)
def box(name,loc,scale,material,bevel=.025):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc); o=bpy.context.object; o.scale=scale
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:
  mod=o.modifiers.new('Soft crafted edges','BEVEL'); mod.width=bevel; mod.segments=3
  bpy.context.view_layer.objects.active=o; bpy.ops.object.modifier_apply(modifier=mod.name)
  mod=o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL')
  bpy.ops.object.modifier_apply(modifier=mod.name)
 return finish(o,name,material)
def cyl(name,a,b,r,material,r2=None,verts=20):
 a,b=Vector(a),Vector(b); d=b-a
 bpy.ops.mesh.primitive_cone_add(vertices=verts,radius1=r,radius2=r if r2 is None else r2,depth=d.length,location=(a+b)/2)
 o=bpy.context.object; o.rotation_euler=d.to_track_quat('Z','Y').to_euler()
 return finish(o,name,material)
def limb(name,a,b,width,depth,material):
 a,b=Vector(a),Vector(b); o=uv(name,(a+b)/2,(width,depth,(b-a).length/2+width*.45),material)
 o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler(); return o
def mesh(name,vs,fs,material,smooth=True):
 me=bpy.data.meshes.new(name); me.from_pydata(vs,[],fs); me.update(); o=bpy.data.objects.new(name,me); bpy.context.collection.objects.link(o); return finish(o,name,material,smooth)
def ringbody(name,rings,material,n=32):
 vs=[]
 for z,rx,ry in rings:
  for j in range(n):
   t=j*2*math.pi/n; vs.append((rx*math.cos(t),ry*math.sin(t),z))
 fs=[]
 for k in range(len(rings)-1):
  for j in range(n): fs.append((k*n+j,k*n+(j+1)%n,(k+1)*n+(j+1)%n,(k+1)*n+j))
 fs.extend([tuple(range(n-1,-1,-1)),tuple((len(rings)-1)*n+j for j in range(n))])
 return mesh(name,vs,fs,material)
def curve(name,pts,material,r=.012):
 cu=bpy.data.curves.new(name,'CURVE'); cu.dimensions='3D'; cu.resolution_u=16; cu.bevel_depth=r; cu.bevel_resolution=3
 sp=cu.splines.new('POLY'); sp.points.add(len(pts)-1)
 for p,v in zip(sp.points,pts):p.co=(*v,1)
 o=bpy.data.objects.new(name,cu); bpy.context.collection.objects.link(o); bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o=bpy.context.object;o.select_set(False);finish(o,name,material)
def soldier(level):
 global objects
 objects=[]
 # Broad feet, sturdy short legs, four-head character proportions.
 for s in [-1,1]:
  x=s*.155
  box('Boot_sole',(x,-.055,.055),(.25,.40,.09),'Leather',.035)
  uv('Boot_toe',(x,-.085,.145),(.133,.23,.12),'Leather_Light')
  limb('Boot_shaft',(x,.025,.17),(x,.03,.43),.12,.13,'Leather')
  cyl('Boot_cuff',(x,.03,.39),(x,.03,.45),.135,'Leather_Light')
  limb('Trouser_leg',(x,.035,.43),(x,.02,.86),.123,.13,'Linen')
  box('Boot_strap',(x,-.105,.31),(.22,.035,.045),'Leather_Light',.012)
  box('Boot_buckle',(x+.045,-.129,.31),(.065,.015,.06),'Brass',.009)
 # Continuous tunic, distinct recolorable regions, raised neckline and belt.
 ringbody('Tunic_skirt',[(.77,.31,.21),(.80,.325,.218),(1.01,.265,.19),(1.08,.27,.19)],'TEAM_Cloth')
 ringbody('Tunic_torso',[(1.00,.265,.19),(1.12,.29,.20),(1.35,.35,.21),(1.43,.28,.19),(1.48,.145,.14)],'TEAM_Cloth')
 ringbody('Belt',[(.994,.283,.205),(1.064,.283,.205)],'Leather')
 box('Belt_buckle',(0,-.213,1.03),(.13,.04,.105),'Brass',.015)
 box('Buckle_inset',(0,-.24,1.03),(.073,.012,.056),'Leather',.006)
 for s in [-1,1]:
  curve('Tunic_stitch',[(s*.20,-.172,.79),(s*.18,-.184,.89),(s*.17,-.18,.98)],'Seam',.006)
  # Arms kept clear of torso, hands closed around equipment.
  shoulder=(s*.34,0,1.36); elbow=(s*.47,-.045,1.14); wrist=(s*.53,-.19,1.00)
  limb('Sleeve',shoulder,(s*.39,-.015,1.27),.165,.145,'TEAM_Cloth')
  limb('Upper_arm',(s*.39,-.015,1.27),elbow,.113,.115,'Skin_Light')
  uv('Elbow',elbow,(.11,.11,.11),'Skin')
  limb('Forearm',elbow,wrist,.105,.10,'Skin_Light')
  limb('Bracer',(s*.49,-.09,1.10),(s*.525,-.165,1.025),.115,.11,'Leather')
  uv('Glove_palm',(s*.54,-.205,.98),(.105,.085,.105),'Leather_Light')
  for j in range(3):
   uv('Glove_finger',(s*.54+(j-1)*.037,-.272,.975),(.023,.035,.07),'Leather_Light')
  uv('Glove_thumb',(s*.47,-.245,1.015),(.042,.045,.065),'Leather_Light')
 # Strap follows chest surface; small belt pouch.
 curve('Chest_strap',[(-.24,-.149,1.43),(-.12,-.208,1.31),(.02,-.216,1.18),(.15,-.18,1.07)],'Leather_Light',.032)
 box('Strap_clasp',(-.07,-.247,1.27),(.084,.02,.064),'Brass',.008)
 box('Belt_pouch',(.26,-.13,1.00),(.14,.12,.17),'Leather_Light',.025)
 box('Pouch_flap',(.26,-.198,1.045),(.15,.035,.07),'Leather',.015)
 uv('Pouch_stud',(.26,-.223,1.025),(.013,.007,.013),'Brass')
 # Warm expressive face, nose and small beard; true modeled details.
 cyl('Neck',(0,0,1.44),(0,0,1.57),.105,'Skin')
 uv('Head',(0,-.015,1.70),(.225,.20,.255),'Skin_Light')
 for s in [-1,1]:
  uv('Ear',(s*.218,-.013,1.70),(.05,.042,.073),'Skin')
  uv('Cheek',(s*.123,-.164,1.65),(.083,.05,.071),'Skin_Light')
  uv('Eye_white',(s*.087,-.191,1.735),(.051,.022,.035),'Eye_White')
  uv('Pupil',(s*.087,-.213,1.735),(.019,.009,.025),'Eye')
  curve('Brow',[(s*.045,-.207,1.782),(s*.09,-.214,1.795),(s*.136,-.197,1.782)],'Hair',.016)
 uv('Nose',(0,-.226,1.685),(.053,.075,.07),'Skin_Light')
 if level==2:
  uv('Beard_chin',(0,-.125,1.535),(.134,.084,.081),'Hair')
 if level>=1:
  for s in [-1,1]:
   o=uv('Moustache',(s*.053,-.211,1.615),(.065,.027,.032),'Hair');o.rotation_euler.y=s*.16
 curve('Mouth',[(-.041,-.207,1.587),(0,-.216,1.578),(.041,-.207,1.587)],'Skin',.009)
 # Helmet hemisphere with rolled brim and cheek protection.
 vs=[];fs=[];n=48;rows=12
 for k in range(rows+1):
  t=.018+(math.pi/2-.018)*k/rows
  for j in range(n):
   a=j*2*math.pi/n;vs.append((.253*math.sin(t)*math.cos(a),.231*math.sin(t)*math.sin(a),1.78+.248*math.cos(t)))
 for k in range(rows):
  for j in range(n):fs.append((k*n+j,k*n+(j+1)%n,(k+1)*n+(j+1)%n,(k+1)*n+j))
 h=mesh('Helmet_dome',vs,fs,'Steel'); mod=h.modifiers.new('Steel shell','SOLIDIFY');mod.thickness=.018
 bpy.context.view_layer.objects.active=h;bpy.ops.object.modifier_apply(modifier=mod.name)
 curve('Helmet_rolled_brim',[(.257*math.cos(j*2*math.pi/64),.234*math.sin(j*2*math.pi/64),1.781) for j in range(65)],'Brass',.015)
 for s in [-1,1]:
  o=box('Helmet_cheekguard',(s*.205,-.084,1.668),(.069,.105,.21),'Steel',.025);o.rotation_euler.y=-s*.12
  uv('Helmet_rivet',(s*.211,-.144,1.737),(.018,.009,.018),'Brass')
 # Narrow reinforcement band front to back.
 curve('Helmet_central_band',[(0,-.234*math.cos(t),1.78+.255*math.sin(t)) for t in [j*math.pi/32 for j in range(33)]],'Steel',.02)
 if level==1:
  cyl('Small_spike_socket',(0,0,2.015),(0,0,2.05),.06,'Brass')
  cyl('Small_helmet_spike',(0,0,2.045),(0,0,2.155),.048,'Steel',r2=.004)
 if level==2:
  # Full sagittal mohawk: continuous crest, not disconnected spikes.
  vs=[];fs=[];N=36
  for i in range(N+1):
   t=.10+(math.pi-.20)*i/N
   for x,r in [(-.045,.265),(.045,.265),(-.036,.405),(.036,.405)]:
    vs.append((x,-r*math.cos(t),1.78+r*math.sin(t)))
  for i in range(N):
   a=i*4;b=(i+1)*4
   fs.extend([(a,b,b+2,a+2),(a+1,a+3,b+3,b+1),(a+2,b+2,b+3,a+3),(a,a+1,b+1,b)])
  fs.extend([(0,2,3,1),(N*4,N*4+1,N*4+3,N*4+2)])
  mesh('Full_mohawk',vs,fs,'TEAM_Crest')
  for i in range(23):
   t=.14+(math.pi-.28)*i/22
   curve('Crest_fiber',[(.038,-r*math.cos(t),1.78+r*math.sin(t)) for r in [.28,.32,.36,.40]],'TEAM_Crest',.004)
  curve('Crest_brass_mount',[(0,-.265*math.cos(t),1.78+.265*math.sin(t)) for t in [j*math.pi/32 for j in range(33)]],'Brass',.03)
 # Sword in right hand (character's right = viewer's left), pointed upward.
 x=-.555;y=-.235
 cyl('Sword_grip',(x,y,.91),(x,y,1.115),.033,'Leather',verts=16)
 for z in [.94,.975,1.01,1.045,1.08]:
  cyl('Grip_wrap',(x,y,z),(x,y,z+.009),.035,'Brass',verts=16)
 uv('Sword_pommel',(x,y,.89),(.05,.039,.052),'Brass')
 box('Sword_crossguard',(x,y,1.125),(.29,.065,.055),'Brass',.019)
 vs=[(x-.065,y,1.15),(x,y-.022,1.15),(x+.065,y,1.15),(x,y+.022,1.15),
     (x-.049,y,1.70),(x,y-.017,1.70),(x+.049,y,1.70),(x,y+.017,1.70),(x,y,1.88)]
 fs=[]
 for j in range(4):fs.extend([(j,(j+1)%4,4+(j+1)%4,4+j),(4+j,4+(j+1)%4,8)])
 fs.append((3,2,1,0));mesh('Sword_blade',vs,fs,'Blade',False)
 # Blue round shield: huge simple team region with separate metal rim.
 cx=.60;cy=-.315;cz=1.09
 cyl('Shield_core',(cx,cy+.018,cz),(cx,cy-.018,cz),.276,'Leather',verts=48)
 cyl('Shield_team_face',(cx,cy-.02,cz),(cx,cy-.04,cz),.25,'TEAM_Shield',verts=48)
 curve('Shield_metal_rim',[(cx+.265*math.cos(t),cy-.047,cz+.265*math.sin(t)) for t in [j*math.pi/64*2 for j in range(65)]],'Steel',.022)
 uv('Shield_boss',(cx,cy-.062,cz),(.075,.048,.075),'Brass')
 for i in range(8):
  t=i*math.pi/4;uv('Shield_rivet',(cx+.227*math.cos(t),cy-.065,cz+.227*math.sin(t)),(.014,.008,.014),'Brass')
 return objects[:]

models=[]
for i,label in enumerate(['beginner','gemiddeld','veteraan']):
 objs=soldier(i)
 for o in objs: o['variant']=label
 bpy.ops.object.select_all(action='DESELECT')
 for o in objs:o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'soldaat_'+label+'.glb'),export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_materials='EXPORT',export_cameras=False,export_lights=False)
 models.append(objs)
 for o in objs:o.location.x+=(i-1)*1.45

# Native editable source, clean model collection and separate presentation stage.
stage=bpy.data.collections.new('PRESENTATIE');bpy.context.scene.collection.children.link(stage)
def stage_obj(o):
 for c in list(o.users_collection):c.objects.unlink(o)
 stage.objects.link(o)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.015)); floor=bpy.context.object;floor.name='Studio_floor'
floor.data.materials.append(mat('Studio_sand',(.19,.16,.12)));stage_obj(floor)
world=bpy.context.scene.world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.20,.23,.27,1);world.node_tree.nodes['Background'].inputs[1].default_value=.4
def light(name,loc,power,size,color):
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.data.color=color;o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler();stage_obj(o)
light('Warm_key',(-3,-4,6),750,4,(1,.82,.63));light('Cool_fill',(3,-1,4),450,4,(.65,.78,1));light('Rim',(1,3,5),850,3,(1,.76,.46))
bpy.ops.object.camera_add(location=(3.4,-8,3.5));cam=bpy.context.object;cam.name='Comparison_camera';cam.rotation_euler=(Vector((0,0,1.08))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=5.35;stage_obj(cam)
scene=bpy.context.scene;scene.camera=cam;scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=True
scene.render.resolution_x=1800;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';scene.render.image_settings.file_format='PNG';scene.render.filepath=os.path.join(OUT,'soldaten_voorbeeld.png')
# Open .blend in material view, all three variants visible.
bpy.ops.object.select_all(action='DESELECT')
for area in bpy.context.screen.areas:
 if area.type=='VIEW_3D':
  area.spaces.active.shading.type='MATERIAL';area.spaces.active.region_3d.view_distance=6
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'soldaten_bron.blend'))
bpy.ops.render.render(write_still=True)
print('DONE_SOLDIERS')
