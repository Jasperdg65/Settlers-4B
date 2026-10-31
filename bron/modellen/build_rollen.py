from pathlib import Path
exec((Path(__file__).resolve().parent/'role_helpers.py').read_text())
OUT=str(Path(__file__).resolve().parent)
mat('Felt',(.25,.22,.16),rough=.95);mat('Felt_light',(.43,.39,.30),rough=.95)
mat('TEAM_Feather',(.025,.22,.54),rough=.8);mat('TEAM_Ribbon',(.025,.22,.54),rough=.8)
mat('Wood',(.32,.145,.05),rough=.75);mat('Soundboard',(.64,.36,.13),rough=.7);mat('Dark_wood',(.12,.045,.017))
mat('Leaf',(.095,.28,.055));mat('Leaf_light',(.25,.43,.08));mat('Herb_flower',(.45,.23,.52));mat('Glass_amber',(.48,.24,.055),rough=.3)

def discard(o):
 objects.remove(o);bpy.data.objects.remove(o,do_unlink=True)

def role_body(role):
 global objects
 soldier(0)
 prefixes=['Helmet_','Shield_','Sword_','Grip_wrap','Sleeve','Upper_arm','Elbow','Forearm','Bracer','Glove_','Chest_strap','Strap_clasp','Belt_pouch','Pouch_']
 if role=='heler':prefixes+=['Tunic_skirt']
 for o in objects[:]:
  if o.name.startswith(tuple(prefixes)):discard(o)
 for o in objects:
  for slot in o.material_slots:
   if slot.material.name=='Leather':slot.material=M['Felt']
   if slot.material.name=='Leather_Light':slot.material=M['Felt_light']
 # A little short hair appears beneath both soft head coverings.
 for s in [-1,1]:uv('Hair_side',(s*.195,.015,1.735),(.037,.11,.11),'Hair')
 if role=='heler':
  ringbody('TEAM_Long_felt_robe',[(.27,.32,.24),(.35,.335,.25),(.72,.31,.23),(1.02,.266,.197)],'TEAM_Cloth')
  for x in [-.19,-.08,.08,.19]:curve('Robe_fold',[(x,-.196,1.00),(x*1.08,-.224,.67),(x*1.24,-.236,.30)],'Seam',.006)

def arm(name,a,e,w,sleeve=True):
 a,e,w=map(Vector,[a,e,w]);q=a.lerp(e,.55)
 limb(name+'_Felt_sleeve',a,q,.14,.135,'TEAM_Cloth')
 axis=(e-a).normalized();cyl(name+'_Cream_cuff',q-axis*.025,q+axis*.025,.14,'Linen',r2=.14)
 limb(name+'_Arm',q,e,.10,.10,'Skin_Light');uv(name+'_Elbow',e,(.10,.10,.10),'Skin_Light');limb(name+'_Forearm',e,w,.091,.095,'Skin_Light')
 uv(name+'_Palm',w,(.078,.065,.083),'Skin_Light')
 for j in range(4):uv(name+'_Finger',(w.x+(j-1.5)*.029,w.y-.052,w.z-.008),(.019,.026,.055),'Skin_Light')
 uv(name+'_Thumb',(w.x+.055,w.y-.014,w.z+.035),(.03,.038,.047),'Skin_Light')

def make_feather():
 p0,p1,p2,p3=[Vector(p) for p in [(-.15,.04,2.055),(-.27,.04,2.23),(-.25,.055,2.47),(-.085,.06,2.58)]]
 def at(t):return (1-t)**3*p0+3*(1-t)**2*t*p1+3*(1-t)*t*t*p2+t**3*p3
 def tangent(t):return (3*(1-t)**2*(p1-p0)+6*(1-t)*t*(p2-p1)+3*t*t*(p3-p2)).normalized()
 vs=[];fs=[];N=40
 for j in range(N+1):
  t=j/N;c=at(t);d=tangent(t);across=Vector((d.z,0,-d.x))*(.085*math.sin(math.pi*t)**.75)
  vs.extend([tuple(c-across),tuple(c+across)])
 for j in range(N):fs.append((j*2,j*2+1,j*2+3,j*2+2))
 o=mesh('TEAM_Large_feather',vs,fs,'TEAM_Feather');mod=o.modifiers.new('Feather thickness','SOLIDIFY');mod.thickness=.008;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
 curve('Feather_quill',[tuple(at(j/40)+Vector((0,-.008,0))) for j in range(41)],'Linen',.005)
 for j in range(7):
  t=.18+j*.09;d=tangent(t);across=Vector((d.z,0,-d.x))*(.072*math.sin(math.pi*t)**.75)
  for s in [-1,1]:curve('Feather_barb',[tuple(at(t-.04)+Vector((0,-.009,0))),tuple(at(t)+s*across+Vector((0,-.009,0)))],'TEAM_Feather',.003)

def beret(level):
 o=uv('TEAM_Felt_beret',(.032,.027,1.955),(.315,.249,.142),'TEAM_Cloth');o.rotation_euler.y=-.15
 curve('Beret_soft_band',[(.232*math.cos(t),.196*math.sin(t),1.85) for t in [j*2*math.pi/64 for j in range(65)]],'TEAM_Cloth',.027)
 if level==1:
  cyl('Brass_hat_pin',(-.105,0,2.06),(-.105,0,2.20),.025,'Brass',r2=.022)
  uv('Brass_hat_button',(-.105,0,2.205),(.051,.045,.05),'Brass')
 if level==2:
  make_feather()
  uv('Feather_brass_clasp',(-.15,.012,2.055),(.048,.035,.035),'Brass')

def hood(level):
 # Cloth shell with a true face opening around the front (-Y).
 n=48;rows=20;vs=[];fs=[]
 for k in range(rows+1):
  t=.95+(math.pi-.97)*k/rows
  for j in range(n):
   p=j*2*math.pi/n;vs.append((.279*math.sin(t)*math.cos(p),.018-.264*math.cos(t),1.752+.325*math.sin(t)*math.sin(p)))
 for k in range(rows):
  for j in range(n):fs.append((k*n+j,k*n+(j+1)%n,(k+1)*n+(j+1)%n,(k+1)*n+j))
 o=mesh('TEAM_Soft_hood',vs,fs,'TEAM_Cloth');mod=o.modifiers.new('Thick felt hood','SOLIDIFY');mod.thickness=.022;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
 curve('Hood_cream_lining',[tuple(v) for v in vs[:n]]+[tuple(vs[0])],'Linen',.019)
 if level==1:
  # Small but readable forehead ring, no metal helmet.
  curve('Brass_forehead_ring',[(.072*math.cos(t),-.169,1.951+.072*math.sin(t)) for t in [j*2*math.pi/48 for j in range(49)]],'Brass',.014)
  uv('Ring_felt_mount',(0,-.142,1.952),(.085,.018,.089),'TEAM_Cloth')
 if level==2:
  curve('Leaf_crown_vine',[(.24*math.cos(t),.196*math.sin(t),1.992) for t in [j*2*math.pi/64 for j in range(65)]],'Leaf',.019)
  for j in range(14):
   t=j*2*math.pi/14;x=.23*math.cos(t);y=.191*math.sin(t)
   o=uv('Crown_leaf',(x,y,2.065),(.047,.026,.114),'Leaf_light' if j%2 else 'Leaf');o.rotation_euler=(.20*math.sin(t),.25*math.cos(t),t)
  for s in [-1,1]:
   o=uv('TEAM_Ribbon_bow',(s*.083,.10,2.145),(.108,.044,.067),'TEAM_Ribbon');o.rotation_euler.y=s*.40
  uv('TEAM_Ribbon_knot',(0,.075,2.145),(.038,.048,.049),'TEAM_Ribbon')
  for s in [-1,1]:
   vs=[(s*.015,.15,2.13),(s*.085,.15,2.13),(s*.18,.237,1.78),(s*.10,.237,1.81),(s*.08,.234,1.76)]
   o=mesh('TEAM_Ribbon_tail',vs,[(0,1,2,3,4)],'TEAM_Ribbon',False);mod=o.modifiers.new('Ribbon thickness','SOLIDIFY');mod.thickness=.01;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)

def musician(level):
 role_body('muzikant');beret(level)
 if level==0:
  arm('Flute_lower_hand',(-.34,0,1.36),(-.39,-.13,1.39),(-.15,-.315,1.56))
  arm('Flute_upper_hand',(.34,0,1.36),(.40,-.13,1.40),(.22,-.315,1.56))
  cyl('Flute_wooden_tube',(-.31,-.265,1.59),(.43,-.265,1.59),.027,'Wood',verts=24)
  for x in [-.30,-.035,.42]:cyl('Flute_brass_binding',(x-.009,-.265,1.59),(x+.009,-.265,1.59),.030,'Brass',verts=24)
  for x in [-.23,-.16,-.09,.12,.19,.26]:uv('Flute_finger_hole',(x,-.291,1.59),(.010,.003,.009),'Dark_wood')
  cyl('Flute_mouthpiece',(0,-.217,1.59),(0,-.268,1.59),.020,'Wood',verts=20)
  cyl('Flute_open_end',(.432,-.265,1.59),(.434,-.265,1.59),.020,'Dark_wood',verts=24)
 elif level==1:
  arm('Harp_plucking_right',(-.34,0,1.36),(-.42,-.15,1.11),(-.17,-.46,1.08))
  arm('Harp_plucking_left',(.34,0,1.36),(.45,-.15,1.20),(.15,-.46,1.28))
  a=Vector((-.27,-.34,.84));b=Vector((-.34,-.34,1.68));c=Vector((.36,-.34,1.61))
  # Open triangular harp: long soundbox, upright pillar and curved upper neck.
  cyl('Harp_forepillar',a,b,.037,'Wood',verts=24)
  curve('Harp_curved_neck',[tuple(b),(-.22,-.34,1.76),(-.03,-.34,1.775),(.17,-.34,1.71),tuple(c)],'Wood',.043)
  o=box('Harp_soundbox',(a+c)/2,(.115,.085,(c-a).length),'Soundboard',.025);o.rotation_euler=(c-a).to_track_quat('Z','Y').to_euler()
  uv('Harp_foot',(-.255,-.34,.84),(.097,.072,.052),'Wood')
  for j in range(8):
   x=-.24+j*.075;top=1.775-.25*(x+.03)**2-.24*max(0,x);bottom=.84+(x+.27)/.63*.77
   cyl('Harp_string',(x,-.394,bottom+.025),(x,-.394,top-.027),.0025,'Linen',verts=8)
   uv('Harp_tuning_pin',(x,-.393,top-.015),(.013,.016,.015),'Brass')
  for t in [.18,.38,.58]:
   p=a.lerp(c,t);cyl('Harp_soundhole',(p.x,-.385,p.z),(p.x,-.391,p.z),.018,'Dark_wood',verts=20)
  uv('Harp_brass_finial',(-.34,-.34,1.69),(.053,.046,.055),'Brass')
  for o in objects:
   if o.name.startswith('Harp_'):o.location.z-=.16
 else:
  arm('Bagpipe_lower_hand',(-.34,0,1.36),(-.41,-.14,1.09),(-.035,-.49,.96))
  arm('Bagpipe_upper_hand',(.34,0,1.36),(.45,-.07,1.17),(.067,-.49,1.13))
  uv('Bagpipe_TEAM_felt_bag',(.23,-.305,1.15),(.245,.14,.265),'TEAM_Cloth')
  curve('Bagpipe_woven_strap',[(.17,-.10,1.44),(.29,-.17,1.38),(.35,-.31,1.31)],'Linen',.016)
  # Blowpipe reaches the mouth. Three drones fan out above the shoulder.
  curve('Bagpipe_blowpipe',[(.22,-.315,1.33),(.12,-.28,1.47),(0,-.222,1.585)],'Dark_wood',.019)
  for j,(tip,start) in enumerate([((.44,-.03,2.19),(.20,-.17,1.31)),((.62,.035,2.06),(.28,-.14,1.29)),((.76,.09,1.93),(.34,-.10,1.27))]):
   start,tip=Vector(start),Vector(tip);axis=(tip-start).normalized()
   cyl('Bagpipe_drone_'+str(j+1),start,tip,.024,'Dark_wood',r2=.027,verts=20)
   for t in [.05,.22,.78,.94]:
    p=start.lerp(tip,t);cyl('Bagpipe_drone_brass_ring',p-axis*.016,p+axis*.016,.034,'Brass',verts=20)
   cyl('Bagpipe_drone_bell',tip-axis*.04,tip+axis*.025,.033,'Wood',r2=.047,verts=24)
   cyl('Bagpipe_drone_opening',tip+axis*.026,tip+axis*.028,.032,'Dark_wood',verts=24)
  a=Vector((.10,-.425,1.22));b=Vector((-.045,-.445,.69));axis=(b-a).normalized()
  cyl('Bagpipe_chanter',a,b,.024,'Dark_wood',r2=.027,verts=24)
  cyl('Bagpipe_chanter_bell',b-axis*.035,b+axis*.025,.027,'Wood',r2=.049,verts=24)
  for j in range(6):
   p=a.lerp(b,.20+j*.105);uv('Bagpipe_chanter_hole',(p.x,p.y-.025,p.z),(.008,.003,.009),'Wood')
  curve('Bagpipe_tassel_cord',[(.40,-.33,1.22),(.46,-.34,1.12),(.47,-.34,.94)],'TEAM_Ribbon',.009)
  uv('Bagpipe_TEAM_tassel',(.47,-.34,.91),(.034,.024,.055),'TEAM_Ribbon')

def healer(level):
 role_body('heler');hood(level)
 arm('Herbs',(-.34,0,1.36),(-.41,-.09,1.13),(-.37,-.28,1.01))
 arm('Walking_staff',(.34,0,1.36),(.44,-.08,1.15),(.48,-.22,1.12))
 # Soft felt satchel and a diagonal cream strap, herb insignia rather than weapons.
 curve('Satchel_woven_strap',[(-.25,-.16,1.44),(-.13,-.223,1.31),(.03,-.226,1.14),(.20,-.205,.95),(.28,-.10,.84)],'Linen',.026)
 box('Healer_felt_satchel',(.28,-.025,.82),(.245,.18,.27),'Felt_light',.045)
 box('Satchel_felt_flap',(.28,-.125,.88),(.25,.045,.15),'Felt',.025)
 curve('Satchel_leaf_sign',[(.25,-.154,.86),(.30,-.154,.92)],'Leaf',.007)
 for s in [-1,1]:
  o=uv('Satchel_leaf',(.277+s*.023,-.158,.893),(.018,.008,.036),'Leaf');o.rotation_euler.y=s*.5
 # Held medicinal herbs and tiny flowers.
 for j in range(5):
  x=-.40+j*.015
  cyl('Herb_stem',(x,-.30,.96),(x+(j-2)*.018,-.30,1.20),.006,'Leaf')
  for k in range(2):
   o=uv('Held_herb_leaf',(x+(j-2)*.014+(-1 if k else 1)*.026,-.30,1.09+k*.06),(.035,.014,.025),'Leaf_light');o.rotation_euler.y=(-1 if k else 1)*.7
  uv('Herb_flower',(x+(j-2)*.018,-.30,1.21),(.018,.017,.022),'Herb_flower')
 cyl('Bundle_binding',(-.37,-.30,1.025),(-.37,-.30,1.047),.043,'Linen')
 # Rounded walking stick with a leaf-shaped finial; entirely non-combat equipment.
 curve('Wooden_walking_staff',[(.49,-.22,.055),(.49,-.22,1.24),(.53,-.20,1.60),(.51,-.19,1.76),(.45,-.19,1.79)],'Wood',.025)
 o=uv('Staff_leaf',(.455,-.19,1.785),(.065,.022,.11),'Leaf');o.rotation_euler.y=-.45
 for j in range(3):cyl('Staff_grip_wrap',(.49,-.22,1.08+j*.033),(.49,-.22,1.09+j*.033),.030,'Linen')

models=[]
for role,fn in [('muzikant',musician),('heler',healer)]:
 for level in range(3):
  objects=[];fn(level);parts=objects[:];name=role+'_'+['junior','medior','senior'][level]
  root=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(root)
  root['role']=role;root['level']=level+1
  if role=='muzikant':
   root['instrument']=['fluit','harp','doedelzak'][level];root['support_range_rank']=level+1;root['support_range_is_design_hint']=True
  for o in parts:o.parent=root
  bpy.ops.object.select_all(action='DESELECT')
  for o in parts:o.select_set(True)
  root.select_set(True)
  bpy.ops.export_scene.gltf(filepath=OUT+'/'+name+'.glb',export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_animations=False,export_extras=True)
  root.location.x=(len(models)+1)*4;models.append((name,root,parts))

scene=bpy.context.scene;scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.20,.23,.27,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.4
for loc,power,size,c in [((-3,-4,6),750,4,(1,.82,.63)),((3,-1,4),450,4,(.65,.78,1)),((1,3,5),850,3,(1,.76,.46))]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name='STUDIO_light';o.data.energy=power;o.data.size=size;o.data.color=c;o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(3,-6,3));cam=bpy.context.object;cam.data.type='ORTHO';scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True;scene.render.resolution_x=800;scene.render.resolution_y=900;scene.render.resolution_percentage=100;scene.render.film_transparent=True;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.view_settings.view_transform='AgX'
for name,root,parts in models:
 for _,other,others in models:
  for o in others:o.hide_render=other!=root
 root.location.x=0;bpy.context.view_layer.update();pts=[o.matrix_world@Vector(c) for o in parts for c in o.bound_box]
 target=Vector((0,-.07,1.27))
 cam.location=target+Vector((2.3,-7,2.1));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=3.1
 scene.render.filepath=OUT+'/'+name+'.png';bpy.ops.render.render(write_still=True)
 root.location.x=(models.index((name,root,parts))+1)*4;print('ROLE_DONE',name,flush=True)
for i,(name,root,parts) in enumerate(models):
 for o in parts:o.hide_render=False
 root.location=((i%3-1)*1.8,(i//3)*2.1,0)
cam.location=(4,-9,6);cam.rotation_euler=(Vector((0,.8,1.2))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=7.5
bpy.ops.object.select_all(action='DESELECT')
for screen in bpy.data.screens:
 for a in screen.areas:
  if a.type=='VIEW_3D':a.spaces.active.shading.type='MATERIAL';a.spaces.active.region_3d.view_distance=8
bpy.ops.wm.save_as_mainfile(filepath=OUT+'/heler_muzikant_bron.blend')
with open(OUT+'/spelwaarden_muzikant.json','w') as f:json.dump({'status':'ontwerpvoorstel; nog geen spelregels geimplementeerd','range_units':None,'levels':[{'level':i+1,'instrument':n,'support_range_rank':i+1,'support_range_label':['kort','middel','groot'][i]} for i,n in enumerate(['fluit','harp','doedelzak'])]},f,indent=2)
print('ROLES_DONE')
