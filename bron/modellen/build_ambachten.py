from pathlib import Path
exec((Path(__file__).resolve().parent/'worker_helpers.py').read_text())
OUT=str(Path(__file__).resolve().parent)
mat('Felt',(.23,.20,.145),rough=.94);mat('Felt_light',(.43,.37,.26),rough=.94)
mat('Wood',(.34,.155,.052),rough=.78);mat('Wood_light',(.53,.29,.105),rough=.79);mat('Bark',(.16,.069,.023),rough=.91)
mat('Leaf',(.09,.25,.035));mat('Leaf_light',(.26,.43,.065));mat('Soil',(.21,.105,.044),rough=.97)
mat('Soil_dark',(.065,.032,.014),rough=.99);mat('Wicker',(.46,.25,.087),rough=.86);mat('Wicker_edge',(.64,.38,.15),rough=.88)
mat('Berry',(.62,.025,.035));mat('Nut',(.34,.14,.044));mat('Carrot',(.83,.265,.023));mat('Wheat',(.66,.42,.105));mat('Seed',(.76,.58,.28))
mat('Water',(.13,.38,.55),rough=.23);mat('Forester_green',(.09,.22,.06));mat('Metal',(.38,.44,.44),.62,.39)

def worker(role):
 global objects, actor_base
 soldier(0)
 prefixes=('Helmet_','Shield_','Sword_','Grip_wrap','Sleeve','Upper_arm','Elbow','Forearm','Bracer','Glove_','Chest_strap','Strap_clasp','Belt_pouch','Pouch_')
 for o in objects[:]:
  if o.name.startswith(prefixes):objects.remove(o);bpy.data.objects.remove(o,do_unlink=True)
 for o in objects:
  for slot in o.material_slots:
   if slot.material.name=='Leather':slot.material=M['Felt']
   elif slot.material.name=='Leather_Light':slot.material=M['Felt_light']
 for s in [-1,1]:uv('Short_hair',(s*.193,.018,1.74),(.039,.095,.09),'Hair')
 if role=='boer':
  uv('Straw_hat_brim',(0,0,1.895),(.39,.31,.035),'Wicker_edge')
  uv('Straw_hat_crown',(0,.005,1.99),(.219,.185,.12),'Wicker')
  curve('TEAM_Hat_band',[(.221*math.cos(t),.188*math.sin(t),1.925) for t in [j*math.pi*2/48 for j in range(49)]],'TEAM_Cloth',.021)
 elif role=='bosbouwer':
  uv('Forester_soft_hat',(0,.025,1.946),(.265,.205,.13),'Forester_green')
  cyl('Forester_folded_tip',(.09,.03,1.99),(.24,.03,2.115),.095,'Forester_green',r2=.009)
  curve('TEAM_Forester_hatband',[(.242*math.cos(t),.193*math.sin(t),1.854) for t in [j*math.pi*2/48 for j in range(49)]],'TEAM_Cloth',.023)
 elif role in ['steenhouwer','bouwer']:
  uv('Work_cap',(0,.015,1.945),(.247,.204,.12),'Linen' if role=='steenhouwer' else 'TEAM_Cloth')
  uv('Cap_small_brim',(0,-.18,1.875),(.225,.12,.027),'Felt_light')
 else:
  uv('TEAM_Wool_work_cap',(0,.02,1.946),(.249,.209,.144),'TEAM_Cloth')
  curve('TEAM_Rolled_cap_rim',[(.241*math.cos(t),.201*math.sin(t),1.845) for t in [j*math.pi*2/48 for j in range(49)]],'TEAM_Cloth',.023)
  if role in ['tuinier','plukker']:
   o=uv('TEAM_Kerchief_knot',(.17,.18,1.86),(.063,.05,.06),'TEAM_Cloth')
   o=uv('TEAM_Kerchief_tail',(.20,.19,1.77),(.043,.022,.13),'TEAM_Cloth');o.rotation_euler.y=-.25
 if role in ['steenhouwer','bouwer','tuinier']:
  o=mesh('Felt_work_apron',[(-.21,-.205,1.30),(.21,-.205,1.30),(.24,-.229,.68),(-.24,-.229,.68)],[(0,1,2,3)],'Felt_light',False)
  mod=o.modifiers.new('Apron thickness','SOLIDIFY');mod.thickness=.012;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
  for s in [-1,1]:curve('Apron_strap',[(s*.23,-.13,1.43),(s*.16,-.211,1.29)],'Linen',.016)

 actor_base=set(objects)

def arm(name,e,w):
 s=-1 if name=='Right' else 1;a=Vector((s*.34,0,1.36));e,w=Vector(e),Vector(w);q=a.lerp(e,.57)
 limb(name+'_Sleeve',a,q,.141,.135,'TEAM_Cloth');axis=(e-a).normalized();cyl(name+'_Rolled_cuff',q-axis*.026,q+axis*.026,.143,'Linen')
 limb(name+'_Upper_arm',q,e,.107,.104,'Skin_Light');uv(name+'_Elbow',e,(.105,.105,.105),'Skin_Light');limb(name+'_Forearm',e,w,.097,.096,'Skin_Light')
 uv(name+'_Palm',w,(.079,.063,.082),'Skin_Light')
 for j in range(4):uv(name+'_Finger',(w.x+(j-1.5)*.029,w.y-.051,w.z-.006),(.019,.027,.054),'Skin_Light')
 uv(name+'_Thumb',(w.x+.058,w.y-.012,w.z+.034),(.031,.037,.047),'Skin_Light')

def two_handed():
 arm('Right',(-.43,-.13,1.12),(-.15,-.455,1.19));arm('Left',(.39,-.15,1.14),(.045,-.545,.98))

def shovel():
 a=Vector((-.14,-.38,1.30));b=Vector((.025,-.64,.20));cyl('Shovel_wooden_shaft',a,b,.025,'Wood_light',verts=20)
 curve('Shovel_D_grip',[(-.14+.065*math.cos(t),-.38,1.34+.08*math.sin(t)) for t in [j*math.pi*2/32 for j in range(33)]],'Wood',.016)
 vs=[(-.085,-.65,.26),(.13,-.65,.26),(.13,-.668,.12),(.025,-.676,.035),(-.085,-.668,.12)]
 o=mesh('Shovel_steel_blade',vs,[(0,1,2,3,4)],'Steel',False);mod=o.modifiers.new('Steel blade','SOLIDIFY');mod.thickness=.017;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)

def leaf(name,p,sc=(.06,.025,.12),material='Leaf',tilt=0):
 o=uv(name,p,sc,material);o.rotation_euler.y=tilt;return o

def basket(center,r=.17,h=.23):
 x,y,z=center;N=40;vs=[];fs=[]
 for radius,zz in [(r*.76,z-h/2),(r,z+h/2),(r-.018,z+h/2),(r*.76-.018,z-h/2+.024)]:
  for j in range(N):
   t=j*math.pi*2/N;vs.append((x+radius*math.cos(t),y+radius*math.sin(t),zz))
 for k in range(3):
  for j in range(N):fs.append((k*N+j,k*N+(j+1)%N,(k+1)*N+(j+1)%N,(k+1)*N+j))
 fs.append(tuple(3*N+j for j in range(N)));mesh('Basket_woven_body',vs,fs,'Wicker')
 for k in range(6):
  t=k/5;rr=r*(.76+.24*t);zz=z-h/2+h*t
  curve('Basket_weave',[(x+rr*math.cos(j*math.pi*2/40),y+rr*math.sin(j*math.pi*2/40),zz) for j in range(41)],'Wicker_edge',.004)
 curve('Basket_rim',[(x+r*math.cos(j*math.pi*2/40),y+r*math.sin(j*math.pi*2/40),z+h/2) for j in range(41)],'Wicker_edge',.012)
 curve('Basket_handle',[(x+r*math.cos(t),y,z+h/2+.14*math.sin(t)) for t in [j*math.pi/24 for j in range(25)]],'Wicker_edge',.011)

def sapling(p,rootball=True):
 x,y,z=p
 if rootball:uv('Sapling_rootball',(x,y,z),(.105,.093,.09),'Soil')
 cyl('Sapling_stem',(x,y,z+.03),(x,y,z+.59),.012,'Wood',r2=.006,verts=12)
 for j in range(5):
  s=-1 if j%2 else 1;zz=z+.22+j*.075
  cyl('Sapling_branch',(x,y,zz),(x+s*.085,y,zz+.05),.006,'Wood',r2=.003,verts=10)
  leaf('Sapling_leaf',(x+s*.11,y,zz+.085),(.065,.024,.10),'Leaf_light',s*.65)

def cabbage(p):
 x,y,z=p
 uv('Cabbage_heart',(x,y,z+.075),(.09,.085,.09),'Leaf_light')
 for j in range(6):
  t=j*math.pi/3;o=uv('Cabbage_leaf',(x+.07*math.cos(t),y+.07*math.sin(t),z+.06),(.07,.06,.06),'Leaf');o.rotation_euler.z=t

def dirt(p,r=.23,dark=False):
 x,y,z=p;uv('Disturbed_soil',(x,y,z), (r,r*.75,.026),'Soil_dark' if dark else 'Soil')

def woodcutter():
 worker('houthakker');two_handed()
 a=Vector((-.31,-.40,1.35));b=Vector((.28,-.70,.65));cyl('Axe_wooden_haft',a,b,.027,'Wood_light')
 vs=[(.19,-.728,.74),(.22,-.728,.57),(.43,-.728,.52),(.47,-.728,.72),(.19,-.672,.74),(.22,-.672,.57),(.43,-.672,.52),(.47,-.672,.72)]
 mesh('Axe_working_head',vs,[(0,1,2,3),(4,7,6,5),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)],'Steel',False)
 start=len(objects)
 cyl('Tree_trunk',(.49,-.79,.02),(.49,-.79,1.44),.155,'Bark',r2=.12,verts=20)
 for j in range(6):
  t=j*math.pi/3;limb('Tree_root',(.49,-.79,.12),(.49+.22*math.cos(t),-.79+.18*math.sin(t),.035),.042,.045,'Bark')
 for a,b in [((.49,-.79,1.10),(.73,-.78,1.44)),((.49,-.79,1.24),(.36,-.85,1.62))]:cyl('Tree_branch',a,b,.045,'Bark',r2=.014)
 for p in [(.75,-.78,1.50),(.36,-.85,1.68),(.50,-.77,1.72)]:uv('Tree_work_foliage',p,(.15,.13,.16),'Leaf')
 box('Tree_cut_notch',(.344,-.79,.64),(.014,.18,.13),'Wood_light',.006)
 for p in [(.31,-.95,.026),(.47,-1.0,.028),(.25,-.79,.027)]:box('Wood_chip',p,(.052,.025,.017),'Wood_light',.005)
 return start

def stonecutter():
 worker('steenhouwer');two_handed();a=Vector((-.31,-.40,1.35));b=Vector((.29,-.68,.90));cyl('Pickaxe_wooden_haft',a,b,.025,'Wood_light')
 curve('Pickaxe_steel_head',[(.045,-.68,.97),(.18,-.68,.98),(.30,-.68,.90),(.42,-.68,.81),(.49,-.68,.735)],'Steel',.024)
 cyl('Pickaxe_point',(.43,-.68,.80),(.49,-.68,.72),.025,'Steel',r2=.002)
 start=len(objects);box('Stone_work_block',(.49,-.78,.47),(.47,.40,.49),'Metal' if False else 'Stone',.075)
 for p in [(.29,-1.01,.045),(.66,-1.0,.04),(.78,-.72,.035)]:uv('Stone_chip',p,(.065,.048,.035),'Stone')
 return start

def forester(plant):
 worker('bosbouwer')
 if not plant:
  two_handed();shovel();start=len(objects);dirt((.02,-.66,.006),.23,True);dirt((.28,-.60,.035),.17);sapling((.45,-.48,.10))
 else:
  arm('Right',(-.42,-.15,1.09),(-.08,-.45,.78));arm('Left',(.39,-.15,1.09),(.13,-.47,.74));sapling((.025,-.50,.36));start=len(objects);dirt((.025,-.60,.008),.22,True);dirt((.27,-.57,.032),.15)
 return start

def farmer(sow):
 worker('boer')
 if not sow:
  two_handed();a=Vector((-.31,-.40,1.35));b=Vector((.48,-.73,.13));cyl('Scythe_long_wooden_snath',a,b,.026,'Wood_light')
  for t in [.20,.46]:
   p=a.lerp(b,t);cyl('Scythe_handgrip',p,p+Vector((0,-.10,0)),.024,'Wood')
  vs=[(.48,-.73,.13),(.16,-.94,.09),(-.18,-.98,.065),(-.49,-.78,.06),(-.22,-.89,.06),(.16,-.86,.09)]
  o=mesh('Scythe_curved_steel_blade',vs,[(0,1,2,3,4,5)],'Blade',False);mod=o.modifiers.new('Blade thickness','SOLIDIFY');mod.thickness=.013;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
  start=len(objects)
  for i in range(12):
   x=.58+(i%4)*.065;y=-.83-(i//4)*.07;h=.29+(i%3)*.04;cyl('Wheat_stem',(x,y,.025),(x,y,h),.005,'Wheat',verts=8);uv('Wheat_ear',(x,y,h),(.018,.016,.063),'Wheat')
 else:
  arm('Right',(-.43,-.10,1.18),(-.60,-.37,1.25));arm('Left',(.38,-.13,1.16),(.25,-.42,1.00))
  uv('Seed_bag',(.25,-.32,.94),(.16,.12,.19),'Linen');curve('Seed_bag_rim',[(.25+.11*math.cos(t),-.32+.075*math.sin(t),1.075) for t in [j*math.pi*2/32 for j in range(33)]],'Felt_light',.012)
  for i in range(9):uv('Bag_seed',(.19+(i%3)*.05,-.35+(i//3)*.025,1.075),(.012,.009,.009),'Seed')
  start=len(objects)
  for i in range(9):uv('Scattered_seed',(-.58-i*.025,-.40-i*.048,1.16-i*.11),(.008,.007,.012),'Seed')
  dirt((-.60,-.69,.007),.34)
 return start

def gardener(harvest):
 worker('tuinier')
 if not harvest:
  arm('Right',(-.43,-.10,1.15),(-.32,-.43,1.12));arm('Left',(.36,-.12,1.13),(-.11,-.42,.94))
  cyl('Watering_can_body',(-.32,-.44,.81),(-.32,-.44,1.045),.125,'Metal',r2=.13)
  curve('Watering_can_handle',[(-.44,-.44,.93),(-.47,-.44,1.15),(-.32,-.44,1.20),(-.19,-.44,1.06)],'Metal',.018)
  cyl('Watering_can_spout',(-.22,-.46,.88),(.13,-.66,.78),.025,'Metal',r2=.034)
  uv('Watering_can_rose',(.14,-.665,.776),(.063,.046,.03),'Metal')
  start=len(objects)
  for i in range(8):uv('Water_drop',(.15+(i%3-1)*.014,-.67-i*.008,.70-i*.067),(.009,.009,.018),'Water')
 else:
  arm('Right',(-.43,-.14,1.07),(-.46,-.46,.96));arm('Left',(.37,-.10,1.10),(.25,-.42,.98));basket((.25,-.34,.88),.15,.20)
  for x in [.17,.25,.32]:cyl('Harvested_carrot',(x,-.35,.94),(x-.01,-.35,.78),.028,'Carrot',r2=.004)
  cyl('Held_carrot',(-.46,-.47,1.00),(-.46,-.47,.84),.035,'Carrot',r2=.004)
  for s in [-1,0,1]:leaf('Carrot_greens',(-.46+s*.025,-.47,1.065),(.024,.015,.08),'Leaf',s*.35)
  start=len(objects)
 for p in [(.24,-.79,.018),(.48,-.72,.018),(.50,-.97,.018)]:cabbage(p)
 return start

def gatherer():
 worker('plukker');arm('Right',(-.44,-.13,1.22),(-.51,-.42,1.34));arm('Left',(.39,-.10,1.13),(.25,-.43,.99));basket((.25,-.34,.88),.17,.21)
 for i in range(12):uv('Basket_berries',(.14+(i%4)*.06,-.39+(i//4)*.05,.99),(.022,.021,.02),'Berry' if i%3 else 'Nut')
 for i in range(3):uv('Picked_berries',(-.51+i*.019,-.45,1.355),(.019,.02,.019),'Berry')
 start=len(objects)
 for p in [(-.66,-.66,.52),(-.77,-.64,.75),(-.52,-.65,.79)]:uv('Berry_bush_leaf_cluster',p,(.22,.19,.25),'Leaf')
 for i in range(12):uv('Wild_berry',(-.83+(i%4)*.10,-.81,.40+(i//4)*.17),(.027,.022,.029),'Berry')
 return start

def digger():
 worker('graver');two_handed();shovel();start=len(objects)
 dirt((.04,-.66,.007),.35);dirt((.37,-.70,.035),.18)
 for x in [-.37,.50]:cyl('Levelling_stake',(x,-.89,.01),(x,-.89,.27),.019,'Wood',r2=.012,verts=12)
 curve('Levelling_line',[(-.37,-.89,.25),(.50,-.89,.25)],'Linen',.003)
 box('Flat_levelling_board',(.10,-.94,.055),(.66,.085,.055),'Wood_light',.008)
 return start

def builder():
 worker('bouwer');arm('Right',(-.42,-.11,1.18),(-.20,-.44,1.24));arm('Left',(.38,-.18,1.09),(.24,-.59,.91))
 a=Vector((-.245,-.40,1.31));b=Vector((.055,-.64,.94));cyl('Hammer_wooden_handle',a,b,.022,'Wood_light')
 o=box('Hammer_steel_head',b,(.225,.07,.075),'Steel',.016);o.rotation_euler.y=.25
 start=len(objects)
 box('Construction_plank',(.17,-.71,.85),(.83,.26,.075),'Wood_light',.014)
 for s in [-1,1]:
  for side in [-1,1]:cyl('Sawhorse_leg',(.17+s*.29,-.71+side*.075,.80),(.17+s*.35,-.71+side*.19,.045),.034,'Wood')
  box('Sawhorse_crossbar',(.17+s*.29,-.71,.75),(.075,.39,.06),'Wood',.009)
 cyl('Carpentry_nail',(.058,-.65,.887),(.058,-.65,.93),.008,'Steel',verts=12)
 for x in [.67,.74]:box('Spare_plank',(x,-.77,.07),(.065,.49,.06),'Wood_light',.007)
 return start

mat('Stone',(.45,.43,.37),rough=.94)
jobs=[('houthakker_hakken','Houthakker · boom hakken','houthakker','bijl',woodcutter),('steenhouwer_slaan','Steenhouwer · steen bewerken','steenhouwer','houweel',stonecutter),('bosbouwer_graven','Bosbouwer · gat graven','bosbouwer','schop',lambda:forester(False)),('bosbouwer_planten','Bosbouwer · boompje planten','bosbouwer','jong boompje',lambda:forester(True)),('boer_maaien','Boer · maaien','boer','zeis',lambda:farmer(False)),('boer_zaaien','Boer · zaaien','boer','zaaizak',lambda:farmer(True)),('tuinier_verzorgen','Tuinier · water geven','tuinier','gieter',lambda:gardener(False)),('tuinier_oogsten','Tuinier · oogsten','tuinier','oogstmand',lambda:gardener(True)),('plukker_plukken','Plukker · bessen plukken','plukker','mand',gatherer),('graver_egaliseren','Graver · grond egaliseren','graver','schop',digger),('bouwer_timmeren','Bouwer · timmeren','bouwer','hamer',builder)]
models=[];catalog=[]
for key,label,role,tool,fn in jobs:
 start=fn();parts=objects[:]
 unit=bpy.data.objects.new('WERKER_'+key,None);props=bpy.data.objects.new('WERKOBJECT_'+key,None);equipment=bpy.data.objects.new('GEREEDSCHAP_'+key,None)
 for root in [unit,props,equipment]:bpy.context.collection.objects.link(root)
 unit['profession']=role;unit['work_pose']=key;unit['animated']=False;unit['tool_included']=False
 body=[];tools=[]
 for i,o in enumerate(parts):
  if i>=start:o.parent=props
  elif o in actor_base or o.name.startswith(('Right_','Left_')):o.parent=unit;body.append(o)
  else:o.parent=equipment;tools.append(o)
 anchors=[]
 for hand in ['Right','Left']:
  palm=next(o for o in body if o.name.startswith(hand+'_Palm'))
  anchor=bpy.data.objects.new('GRIP_'+hand.upper(),None);bpy.context.collection.objects.link(anchor);anchor.parent=unit;anchor.location=palm.location;anchor['purpose']='tool_attachment';anchors.append(anchor)
 def export(filename,items):
  bpy.ops.object.select_all(action='DESELECT')
  for o in items:o.select_set(True)
  bpy.ops.export_scene.gltf(filepath=OUT+'/'+filename+'.glb',export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_animations=False,export_extras=True)
 export(key,body+[unit]+anchors)
 export(key+'_gereedschap',tools+[equipment])
 models.append((key,unit,props,parts,equipment));unit.location.x=len(models)*4;props.location.x=len(models)*4;equipment.location.x=len(models)*4
 catalog.append({'file':key+'.glb','equipment_file':key+'_gereedschap.glb','label':label,'profession':role,'tool':tool,'tool_included':False,'animated':False})

scene=bpy.context.scene;scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.20,.23,.27,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.4
for loc,power,size,c in [((-3,-4,6),750,4,(1,.82,.63)),((3,-1,4),450,4,(.65,.78,1)),((1,3,5),850,3,(1,.76,.46))]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name='STUDIO_light';o.data.energy=power;o.data.size=size;o.data.color=c;o.rotation_euler=(Vector((0,-.2,1))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.type='ORTHO';scene.camera=cam;target=Vector((0,-.24,1.07));cam.location=target+Vector((2.6,-7,2.4));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=3.3
scene.render.engine='CYCLES';scene.cycles.samples=20;scene.cycles.use_denoising=True;scene.render.resolution_x=800;scene.render.resolution_y=900;scene.render.resolution_percentage=100;scene.render.film_transparent=True;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.view_settings.view_transform='AgX'
for key,unit,props,parts,equipment in models:
 for _,_,_,ps,_ in models:
  for o in ps:o.hide_render=o not in parts
 unit.location.x=0;props.location.x=0;equipment.location.x=0;scene.render.filepath=OUT+'/'+key+'.png';bpy.ops.render.render(write_still=True)
 unit.location.x=(models.index((key,unit,props,parts,equipment))+1)*4;props.location.x=unit.location.x;equipment.location.x=unit.location.x;print('WORKER_DONE',key,flush=True)
for i,(key,unit,props,parts,equipment) in enumerate(models):
 for o in parts:o.hide_render=False
 pos=((i%4-1.5)*2.1,(i//4)*2.4,0);unit.location=pos;props.location=pos;equipment.location=pos
cam.location=(6,-10,8);cam.rotation_euler=(Vector((0,1.5,1))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=11
bpy.ops.object.select_all(action='DESELECT')
for screen in bpy.data.screens:
 for a in screen.areas:
  if a.type=='VIEW_3D':a.spaces.active.shading.type='MATERIAL';a.spaces.active.region_3d.view_distance=12
bpy.ops.wm.save_as_mainfile(filepath=OUT+'/ambachten_bron.blend')
with open(OUT+'/beroepen.json','w') as f:json.dump({'professions':8,'poses':catalog},f,indent=2,ensure_ascii=False)
exec((Path(OUT)/'normalize_grips.py').read_text())
print('WORKERS_DONE')
