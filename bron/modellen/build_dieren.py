from pathlib import Path
exec((Path(__file__).resolve().parent/'animal_helpers.py').read_text())
OUT=str(Path(__file__).resolve().parent)
mat('Deer_fur',(.39,.19,.075));mat('Deer_light',(.65,.39,.18));mat('Cream',(.87,.76,.54));mat('Pink',(.52,.245,.205));mat('Dark',(.025,.019,.014));mat('Hoof',(.10,.063,.035))
mat('Rabbit_fur',(.46,.34,.22));mat('Rabbit_light',(.67,.56,.40));mat('Fox_fur',(.68,.22,.045));mat('Fox_light',(.87,.37,.08));mat('Fox_dark',(.16,.075,.036))
mat('Bird_brown',(.27,.17,.085));mat('Bird_wing',(.18,.105,.05));mat('Bird_red',(.68,.22,.065));mat('Bird_belly',(.73,.66,.50));mat('Beak',(.095,.069,.034));mat('Foot',(.27,.145,.055))
mat('Animal_eye',(.009,.014,.015),rough=.26);mat('Animal_glint',(.95,.96,.89),rough=.22)

def eye_pair(cx,cy,cz,spacing,r=.038):
 for s in [-1,1]:
  uv('Eye',(cx+s*spacing,cy,cz),(r,r*.55,r*1.1),'Animal_eye')
  uv('Eye_highlight',(cx+s*spacing-r*.23,cy-r*.49,cz+r*.32),(r*.27,r*.12,r*.27),'Animal_glint')

def paw(name,p,sc,material):
 uv(name,p,sc,material)

def deer(rest):
 global objects
 objects=[];bz=.36 if rest else .78;hz=1.02 if rest else 1.43
 uv('Fawn_body',(0,.05,bz),(.265,.45,.265),'Deer_fur')
 uv('Fawn_belly',(0,-.015,bz-.095),(.227,.365,.16),'Cream')
 uv('Fawn_haunch',(0,.30,bz+.015),(.25,.26,.255),'Deer_fur')
 for s in [-1,1]:
  x=s*.174
  if not rest:
   for y in [-.25,.30]:
    limb('Deer_upper_leg',(x,y,.70),(x,y+.015,.40),.067,.075,'Deer_fur')
    uv('Deer_knee',(x,y+.015,.39),(.067,.065,.067),'Deer_light')
    limb('Deer_lower_leg',(x,y+.015,.38),(x,y-.035,.10),.044,.046,'Deer_light')
    paw('Deer_hoof',(x,y-.06,.055),(.064,.09,.055),'Hoof')
  else:
   for y in [-.23,.27]:
    limb('Folded_upper_leg',(x,y,.38),(x+s*.055,y-.04,.17),.072,.08,'Deer_fur')
    limb('Folded_lower_leg',(x+s*.055,y-.04,.17),(x,y+.13,.075),.048,.05,'Deer_light')
    paw('Resting_hoof',(x,y+.13,.052),(.06,.095,.052),'Hoof')
 limb('Fawn_neck',(0,-.25,bz+.11),(0,-.40,hz-.10),.125,.14,'Deer_fur')
 limb('Cream_throat',(0,-.365,bz+.11),(0,-.478,hz-.12),.071,.055,'Cream')
 uv('Fawn_head',(0,-.48,hz),(.174,.22,.185),'Deer_light')
 uv('Fawn_muzzle',(0,-.662,hz-.055),(.115,.135,.09),'Cream')
 uv('Fawn_nose',(0,-.778,hz-.027),(.061,.034,.039),'Dark')
 eye_pair(0,-.646,hz+.052,.125,.038)
 curve('Gentle_smile',[(-.038,-.753,hz-.09),(0,-.773,hz-.102),(.038,-.753,hz-.09)],'Hoof',.005)
 for s in [-1,1]:
  o=uv('Long_ear',(s*.177,-.445,hz+.18),(.077,.065,.218),'Deer_fur');o.rotation_euler.y=s*.40
  o=uv('Cream_inner_ear',(s*.183,-.498,hz+.19),(.044,.019,.164),'Cream');o.rotation_euler.y=s*.40
  # Scattered creamy spots stay on the body in both poses.
  for j,(y,dz) in enumerate([(-.10,.12),(.04,.18),(.19,.14),(.28,.06),(.06,.045)]):
   uv('Fawn_spot',(s*(.237 if dz<.14 else .197),y,bz+dz),(.015,.037,.026),'Cream')
 uv('Small_tail',(0,.476,bz+.10),(.084,.13,.09),'Deer_fur')
 uv('White_tail_tip',(0,.553,bz+.09),(.065,.062,.065),'Cream')
 return objects[:]

def rabbit(rest):
 global objects
 objects=[]
 if rest:
  uv('Rabbit_body',(0,.04,.24),(.23,.30,.225),'Rabbit_fur')
  head=(0,-.20,.47);uv('Rabbit_chest',(0,-.12,.24),(.17,.17,.19),'Rabbit_light')
 else:
  uv('Rabbit_body',(0,.03,.34),(.22,.23,.31),'Rabbit_fur')
  uv('Rabbit_cream_chest',(0,-.17,.38),(.145,.062,.22),'Cream');head=(0,-.095,.66)
 for s in [-1,1]:
  uv('Rabbit_hind_leg',(s*.17,.07,.16 if rest else .17),(.13,.17,.14),'Rabbit_fur')
  paw('Long_hind_paw',(s*.15,-.04,.06),(.095,.20,.06),'Rabbit_light')
  if rest:
   paw('Tucked_front_paw',(s*.09,-.21,.052),(.057,.105,.05),'Rabbit_light')
  else:
   limb('Little_front_arm',(s*.14,-.10,.48),(s*.075,-.19,.35),.054,.06,'Rabbit_fur')
   paw('Little_front_paw',(s*.075,-.21,.35),(.06,.06,.072),'Rabbit_light')
 hx,hy,hz=head
 uv('Rabbit_head',head,(.19,.18,.185),'Rabbit_fur')
 for s in [-1,1]:
  uv('Rabbit_cheek',(s*.063,hy-.139,hz-.06),(.093,.071,.074),'Cream')
 uv('Rabbit_nose',(0,hy-.204,hz-.025),(.028,.018,.021),'Pink')
 eye_pair(0,hy-.153,hz+.04,.119,.038)
 curve('Rabbit_smile',[(0,hy-.213,hz-.047),(0,hy-.207,hz-.079),(.023,hy-.20,hz-.092)],'Hoof',.004)
 for s in [-1,1]:
  o=uv('Rabbit_ear',(s*.086,hy+.01,hz+.24),(.062,.052,.24),'Rabbit_fur');o.rotation_euler.y=s*(.28 if rest else .12)
  o=uv('Rabbit_pink_ear',(s*.09,hy-.035,hz+.245),(.034,.013,.181),'Pink');o.rotation_euler.y=s*(.28 if rest else .12)
 uv('Rabbit_tail',(0,.293 if rest else .245,.20 if rest else .26),(.094,.087,.09),'Cream')
 return objects[:]

def fox(rest):
 global objects
 objects=[]
 if rest:
  uv('Fox_sitting_haunch',(0,.13,.26),(.25,.235,.23),'Fox_fur')
  uv('Fox_upright_chest',(0,-.075,.44),(.19,.22,.30),'Fox_fur');hz=.79;hy=-.18
 else:
  uv('Fox_body',(0,.035,.43),(.205,.36,.22),'Fox_fur');hz=.67;hy=-.36
 for s in [-1,1]:
  if not rest:
   for y in [-.20,.25]:
    limb('Fox_leg',(s*.14,y,.43),(s*.14,y-.012,.115),.059,.065,'Fox_fur')
    limb('Fox_dark_sock',(s*.14,y,.185),(s*.14,y-.025,.07),.045,.05,'Fox_dark')
    paw('Fox_paw',(s*.14,y-.047,.045),(.058,.088,.045),'Fox_dark')
  else:
   uv('Fox_folded_hind_leg',(s*.17,.14,.15),(.12,.16,.13),'Fox_fur')
   paw('Fox_hind_paw',(s*.17,.05,.047),(.065,.13,.047),'Fox_dark')
   limb('Fox_front_leg',(s*.105,-.19,.48),(s*.105,-.23,.085),.052,.059,'Fox_fur')
   limb('Fox_front_sock',(s*.105,-.23,.18),(s*.105,-.23,.065),.044,.049,'Fox_dark')
   paw('Fox_front_paw',(s*.105,-.26,.045),(.057,.085,.045),'Fox_dark')
 uv('White_fox_bib',(0,hy+.10,hz-.19),(.145,.095,.17),'Cream')
 uv('Fox_head',(0,hy,hz),(.205,.17,.178),'Fox_fur')
 for s in [-1,1]:
  uv('Fox_white_cheek',(s*.105,hy-.105,hz-.065),(.123,.098,.08),'Cream')
  # Solid triangular ears with inset inner triangles.
  vs=[(s*.075,hy-.035,hz+.09),(s*.234,hy-.01,hz+.105),(s*.17,hy+.015,hz+.36),(s*.115,hy+.085,hz+.15)]
  mesh('Fox_pointed_ear',vs,[(0,1,2),(0,2,3),(1,3,2),(0,3,1)],'Fox_fur')
  mesh('Fox_inner_ear',[(s*.113,hy-.039,hz+.145),(s*.207,hy-.02,hz+.151),(s*.168,hy+.004,hz+.297)],[(0,1,2)],'Fox_dark',False)
 uv('Fox_tapered_muzzle',(0,hy-.18,hz-.06),(.077,.13,.069),'Cream')
 uv('Fox_nose',(0,hy-.293,hz-.035),(.035,.028,.029),'Dark')
 eye_pair(0,hy-.138,hz+.035,.12,.033)
 curve('Fox_smile',[(-.038,hy-.248,hz-.099),(0,hy-.272,hz-.11),(.038,hy-.248,hz-.099)],'Fox_dark',.004)
 # Bushy tail rests beside the body; separate white tip.
 if rest:
  limb('Fox_bushy_tail',(0,.28,.23),(.33,.23,.13),.14,.14,'Fox_fur')
  limb('Fox_tail_sweep',(.30,.23,.13),(.37,-.05,.105),.13,.12,'Fox_fur')
  limb('Fox_white_tail_tip',(.37,-.07,.10),(.28,-.28,.085),.10,.09,'Cream')
 else:
  limb('Fox_bushy_tail',(0,.29,.46),(.08,.59,.36),.13,.13,'Fox_fur')
  limb('Fox_tail_sweep',(.08,.58,.36),(.22,.76,.26),.14,.13,'Fox_fur')
  limb('Fox_white_tail_tip',(.21,.74,.27),(.34,.85,.22),.105,.10,'Cream')
 return objects[:]

def bird(rest):
 global objects
 objects=[];bz=.18 if rest else .26;hz=bz+.14
 uv('Robin_round_body',(0,.015,bz),(.151,.19,.165),'Bird_brown')
 uv('Robin_belly',(0,-.08,bz-.04),(.127,.105,.11),'Bird_belly')
 uv('Robin_head',(0,-.095,hz),(.123,.12,.12),'Bird_brown')
 uv('Robin_red_breast',(0,-.151,hz-.055),(.109,.056,.125),'Bird_red')
 for s in [-1,1]:
  o=uv('Robin_folded_wing',(s*.134,.04,bz),(.043,.139,.094),'Bird_wing');o.rotation_euler.x=-.25
  for j in range(3):
   limb('Robin_wing_feather',(s*.158,.012+j*.022,bz+.025-j*.014),(s*.154,.13+j*.009,bz-.045-j*.01),.012,.013,'Bird_brown')
  if not rest:
   cyl('Robin_leg',(s*.057,-.005,.14),(s*.057,-.025,.034),.012,'Foot',verts=12)
   for dx in [-.035,0,.035]:cyl('Robin_toe',(s*.057,-.025,.027),(s*.057+dx,-.095,.018),.008,'Foot',verts=10)
 eye_pair(0,-.193,hz+.037,.071,.022)
 cyl('Robin_beak',(0,-.193,hz+.005),(0,-.276,hz-.003),.026,'Beak',r2=.002,verts=12)
 for j in [-1,0,1]:
  o=uv('Robin_tail_feather',(j*.037,.21,bz+.01),(.027,.13,.015),'Bird_wing');o.rotation_euler.x=.20
 return objects[:]

def duck(swimming):
 global objects
 objects=[]
 for key,col in [('Duck_grey',(.43,.43,.37)),('Duck_green',(.045,.25,.105)),('Duck_chest',(.30,.115,.055)),('Duck_bill',(.89,.48,.055)),('Duck_foot',(.78,.255,.035)),('Duck_blue',(.04,.15,.40)),('Duck_wing',(.29,.28,.235))]:
  if key not in M:mat(key,col,rough=.67)
 # Full bird geometry; swimming version is authored around a Z=0 waterline.
 bz=.095 if swimming else .34;hy=-.245;hz=bz+.305
 uv('Duck_body',(0,.045,bz),(.215,.335,.198),'Duck_grey')
 uv('Duck_cream_belly',(0,.015,bz-.067),(.19,.265,.125),'Cream')
 uv('Duck_brown_chest',(0,-.195,bz+.045),(.181,.137,.172),'Duck_chest')
 limb('Duck_green_neck',(0,-.22,bz+.08),(0,hy,hz-.025),.09,.10,'Duck_green')
 # Pale neck ring is an actual mesh, not painted scenery.
 cyl('Duck_white_neck_ring',(0,-.235,bz+.17),(0,-.24,bz+.202),.104,'Cream',r2=.103)
 uv('Duck_round_head',(0,hy,hz),(.141,.147,.142),'Duck_green')
 uv('Duck_flat_bill',(0,hy-.176,hz-.035),(.105,.13,.031),'Duck_bill')
 uv('Duck_bill_lower',(0,hy-.178,hz-.057),(.100,.12,.014),'Duck_foot')
 for s in [-1,1]:
  uv('Duck_nostril',(s*.039,hy-.225,hz-.007),(.009,.014,.004),'Hoof')
 eye_pair(0,hy-.111,hz+.039,.101,.028)
 for s in [-1,1]:
  o=uv('Duck_folded_wing',(s*.19,.066,bz+.015),(.052,.23,.133),'Duck_wing');o.rotation_euler.x=-.13
  o=uv('Duck_blue_wing_panel',(s*.232,.135,bz+.013),(.014,.089,.052),'Duck_blue');o.rotation_euler.x=-.24
  curve('Duck_white_wing_edge',[(s*.24,.06,bz+.049),(s*.244,.14,bz+.066),(s*.231,.205,bz+.036)],'Cream',.008)
  for j in range(3):limb('Duck_wing_feather',(s*.226,.015+j*.035,bz+.067-j*.022),(s*.226,.19+j*.022,bz+.008-j*.023),.009,.01,'Duck_grey')
  # Genuine webbed foot with three broad toe tips and a small solid thickness.
  y=(-.045 if s==-1 else .045) if not swimming else .055
  x=s*.085;z=.028 if not swimming else -.145
  if swimming:
   limb('Duck_tucked_thigh',(x,.04,bz-.10),(x,.11,-.095),.027,.03,'Duck_foot')
   cyl('Duck_folded_ankle',(x,.11,-.095),(x,y,z+.014),.017,'Duck_foot',verts=14)
  else:
   cyl('Duck_leg',(x,.012,.235),(x,y,z+.025),.020,'Duck_foot',verts=16)
  outline=[(-.029,.041),(.029,.041),(.081,-.085),(.035,-.066),(0,-.13),(-.035,-.066),(-.081,-.085)]
  vs=[(x+px,y+py,z+dz) for dz in [-.012,.012] for px,py in outline];n=len(outline)
  fs=[tuple(range(n-1,-1,-1)),tuple(n+j for j in range(n))]+[(j,(j+1)%n,(j+1)%n+n,j+n) for j in range(n)]
  foot=mesh('Duck_webbed_foot',vs,fs,'Duck_foot',False)
  mod=foot.modifiers.new('Soft toe edges','BEVEL');mod.width=.009;mod.segments=3
  bpy.context.view_layer.objects.active=foot;bpy.ops.object.modifier_apply(modifier=mod.name)
 for j in [-1,0,1]:
  o=uv('Duck_tail_feather',(j*.036,.37,bz+.045),(.038,.12,.022),'Cream');o.rotation_euler.x=.32
 return objects[:]

models=[]
for species,fn in [('hert',deer),('konijn',rabbit),('vos',fox),('vogel',bird),('eend',duck)]:
 for rest in [False,True]:
  name=species+('_zwemmend' if rest else '_lopend') if species=='eend' else species+('_rustend' if rest else '_staand');parts=fn(rest)
  root=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(root)
  for o in parts:o.parent=root
  bpy.ops.object.select_all(action='DESELECT')
  for o in parts:o.select_set(True)
  root.select_set(True)
  bpy.ops.export_scene.gltf(filepath=OUT+'/'+name+'.glb',export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_animations=False)
  models.append((name,root,parts))
  # Move completed models aside so individual renders can use identical origins.
  root.location.x=len(models)*4

# Studio without ground: transparent PNGs, same warm key light as the characters.
scene=bpy.context.scene;scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.20,.23,.27,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.45
for loc,power,size,c in [((-3,-4,6),650,4,(1,.84,.68)),((3,-1,4),350,4,(.70,.82,1)),((1,3,5),550,3,(1,.78,.52))]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name='STUDIO_light';o.data.energy=power;o.data.size=size;o.data.color=c;o.rotation_euler=(Vector((0,0,.5))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(3,-6,3));cam=bpy.context.object;cam.data.type='ORTHO';scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True;scene.render.resolution_x=700;scene.render.resolution_y=700;scene.render.resolution_percentage=100;scene.render.film_transparent=True;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.view_settings.view_transform='AgX'
for name,root,parts in models:
 for _,r,_ in models:r.hide_render=r!=root
 root.location.x=0;bpy.context.view_layer.update()
 pts=[o.matrix_world@Vector(c) for o in parts for c in o.bound_box]
 lo=Vector(tuple(min(p[i] for p in pts) for i in range(3)));hi=Vector(tuple(max(p[i] for p in pts) for i in range(3)));target=(lo+hi)/2
 cam.location=target+Vector((3,-6,2.6));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=max(hi.x-lo.x,hi.y-lo.y,hi.z-lo.z)*1.42
 scene.render.filepath=OUT+'/'+name+'.png';bpy.ops.render.render(write_still=True)
 root.location.x=(models.index((name,root,parts))+1)*4
 print('ANIMAL_DONE',name,flush=True)
for i,(name,root,parts) in enumerate(models):
 root.hide_render=False;root.location=((i//2-2)*1.8,(i%2)*2.2,0)
cam.location=(5,-9,7);cam.rotation_euler=(Vector((0,.8,.55))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=10.8
bpy.ops.object.select_all(action='DESELECT')
for screen in bpy.data.screens:
 for a in screen.areas:
  if a.type=='VIEW_3D':a.spaces.active.shading.type='MATERIAL';a.spaces.active.region_3d.view_distance=9
bpy.ops.wm.save_as_mainfile(filepath=OUT+'/dieren_bron.blend')
print('ANIMALS_DONE')
