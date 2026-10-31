from pathlib import Path
exec((Path(__file__).resolve().parent/'carrier_helpers.py').read_text())
OUT=str(Path(__file__).resolve().parent)
mat('Wood',(.39,.205,.075));mat('Wood_Light',(.52,.30,.12));mat('Wood_Dark',(.22,.10,.035))
mat('Grain_sack',(.60,.46,.27));mat('Shirt_trim',(.72,.65,.48));mat('Lips',(.48,.22,.13))
# Sturdy young adult, clean-shaven, athletic torso and exposed muscular arms.
for s in [-1,1]:
 x=s*.175
 box('Boot_sole',(x,-.04,.052),(.265,.38,.085),'Leather',.03)
 uv('Boot_toe',(x,-.075,.14),(.14,.22,.11),'Leather_Light')
 limb('Boot_shaft',(x,.035,.15),(x,.04,.38),.12,.13,'Leather')
 cyl('Boot_cuff',(x,.04,.345),(x,.04,.40),.137,'Leather_Light')
 box('Boot_strap',(x,-.102,.285),(.225,.035,.045),'Leather_Light',.01)
 box('Boot_buckle',(x+.045,-.13,.285),(.055,.02,.055),'Brass',.009)
 limb('Trouser_calf',(x,.04,.40),(x,.04,.65),.13,.135,'Linen')
 limb('Trouser_thigh',(x,.04,.64),(s*.15,.02,.96),.15,.16,'Linen')
ringbody('TEAM_Tunic_hem',[(.87,.28,.195),(.91,.295,.205),(1.055,.25,.18)],'TEAM_Cloth')
ringbody('TEAM_Athletic_torso',[(1.01,.25,.18),(1.15,.27,.19),(1.38,.37,.225),(1.49,.35,.205),(1.55,.15,.13)],'TEAM_Cloth')
# Side seams, open collar, restrained leather belt.
for s in [-1,1]:
 curve('Shirt_side_stitch',[(s*.22,-.15,.91),(s*.225,-.17,1.04),(s*.25,-.18,1.18)],'Seam',.005)
 curve('Collar_piping',[(s*.12,-.086,1.55),(s*.10,-.168,1.49),(s*.045,-.205,1.43),(0,-.214,1.415)],'Shirt_trim',.013)
ringbody('Work_belt',[(1.014,.265,.197),(1.07,.265,.197)],'Leather')
box('Belt_buckle',(0,-.205,1.04),(.105,.035,.08),'Brass',.014)
box('Buckle_leather',(0,-.228,1.04),(.055,.014,.042),'Leather',.004)
box('Belt_pouch',(.275,.015,1.00),(.14,.15,.18),'Leather_Light',.025)
box('Pouch_flap',(.288,-.07,1.05),(.15,.035,.075),'Leather',.012)
uv('Pouch_stud',(.29,-.095,1.03),(.014,.007,.014),'Brass')
for s in [-1,1]:
 shoulder=(s*.36,0,1.435);elbow=(s*.53,-.14,1.12);wrist=(s*.43,-.52,1.10)
 # Fitted short sleeve and rolled linen cuff, exposed upper-arm mass.
 limb('TEAM_Short_sleeve',shoulder,(s*.405,-.028,1.365),.155,.146,'TEAM_Cloth')
 cyl('Rolled_sleeve',(s*.405,-.029,1.37),(s*.43,-.052,1.31),.15,'Shirt_trim',r2=.15)
 limb('Upper_arm',(s*.43,-.05,1.31),elbow,.124,.125,'Skin_Light')
 limb('Biceps',(s*.44,-.09,1.31),(s*.51,-.17,1.17),.127,.122,'Skin_Light')
 limb('Triceps',(s*.455,.005,1.30),(s*.53,-.08,1.16),.106,.10,'Skin')
 uv('Elbow',elbow,(.115,.115,.108),'Skin_Light')
 limb('Strong_forearm',elbow,wrist,.107,.105,'Skin_Light')
 # Arms reach beneath crate; hands grip its outside lower corners.
 uv('Palm',(s*.442,-.552,1.105),(.074,.10,.055),'Skin_Light')
 for j in range(4):
  uv('Finger',(s*.465,-.49-j*.038,1.14),(.031,.022,.064),'Skin_Light')
 uv('Thumb',(s*.394,-.55,1.17),(.038,.06,.032),'Skin_Light')
 cyl('Wrist_wrap',(s*.445,-.455,1.105),(s*.43,-.50,1.102),.095,'Leather_Light',r2=.092)
# Head in same family as soldiers, youthful cheeks and cheeky smile.
cyl('Neck',(0,0,1.48),(0,-.005,1.66),.105,'Skin')
uv('Head',(0,-.015,1.80),(.222,.197,.25),'Skin_Light')
uv('Chin',(0,-.107,1.618),(.115,.077,.055),'Skin_Light')
for s in [-1,1]:
 uv('Ear',(s*.215,-.003,1.80),(.046,.042,.073),'Skin')
 uv('Ear_inner',(s*.241,-.03,1.80),(.016,.022,.04),'Skin_Light')
 uv('Cheek',(s*.13,-.16,1.748),(.074,.042,.064),'Skin_Light')
 uv('Eye_white',(s*.084,-.19,1.84),(.049,.022,.034),'Eye_White')
 uv('Pupil',(s*.083,-.213,1.838),(.018,.009,.025),'Eye')
 uv('Eye_glint',(s*.083-.006,-.221,1.848),(.006,.003,.007),'Eye_White')
 curve('Brow',[(s*.043,-.202,1.884),(s*.088,-.21,1.902),(s*.136,-.19,1.888)],'Hair',.014)
uv('Nose',(0,-.222,1.79),(.052,.068,.066),'Skin_Light')
curve('Smile',[(-.063,-.185,1.697),(-.032,-.202,1.678),(0,-.208,1.674),(.033,-.202,1.68),(.064,-.182,1.706)],'Lips',.011)
uv('Smile_teeth',(0,-.207,1.685),(.039,.006,.009),'Eye_White')
# Sculpted tousled short hair; no helmet, no moustache or beard.
vs=[];fs=[];N=40;R=12
for k in range(R+1):
 t=.015+(1.47-.015)*k/R
 for j in range(N):
  a=j*math.pi*2/N;vs.append((.231*math.sin(t)*math.cos(a),.008+.204*math.sin(t)*math.sin(a),1.85+.218*math.cos(t)))
for k in range(R):
 for j in range(N):fs.append((k*N+j,k*N+(j+1)%N,(k+1)*N+(j+1)%N,(k+1)*N+j))
mesh('Hair_cap',vs,fs,'Hair')
for i in range(7):
 x=-.15+i*.045
 o=uv('Swept_hair_lock',(x,-.115,2.015-abs(x)*.13),(.068,.105,.055),'Hair');o.rotation_euler.y=-.3;o.rotation_euler.z=-.45
for s in [-1,1]:
 o=uv('Sideburn',(s*.202,-.035,1.884),(.024,.045,.076),'Hair');o.rotation_euler.y=s*.13
# Cargo root and all its parts remain separate from carrier geometry.
start=len(objects)
# Wooden crate, open at top, plank construction with small chamfered edges.
box('Cargo_floor',(0,-.55,1.115),(.82,.50,.055),'Wood_Dark',.01)
for s in [-1,1]:
 for side in [-1,1]:
  box('Cargo_corner_post',(s*.402,-.55+side*.235,1.305),(.055,.06,.41),'Wood_Dark',.012)
for row in range(3):
 z=1.18+row*.11
 for side in [-1,1]:
  box('Cargo_front_back_slat',(0,-.55+side*.243,z),(.83,.042,.098),'Wood_Light' if row%2==0 else 'Wood',.01)
 for side in [-1,1]:
  box('Cargo_side_slat',(side*.405,-.55,z),(.043,.49,.098),'Wood',.01)
for side in [-1,1]:
 box('Cargo_top_rim',(0,-.55+side*.25,1.465),(.86,.055,.045),'Wood_Light',.01)
 box('Cargo_top_side_rim',(side*.415,-.55,1.465),(.055,.53,.045),'Wood_Light',.01)
# A diagonal brace and restrained wooden grain cut into the front face.
o=box('Cargo_diagonal_brace',(0,-.827,1.31),(.75,.034,.055),'Wood_Dark',.008);o.rotation_euler.y=-.28
for s in [-1,1]:
 for z in [1.18,1.40]:
  uv('Cargo_iron_nail',(s*.36,-.818,z),(.011,.006,.011),'Steel')
for row in range(3):
 for j in range(2):
  z=1.16+row*.11+j*.027
  curve('Cargo_wood_grain',[(-.29,-.817,z),(-.15,-.819,z+.007),(.03,-.818,z-.004),(.19,-.818,z+.003),(.30,-.817,z)],'Wood_Dark',.002)
# Two rounded sacks of goods visible above the open crate.
for x,y,z,sc in [(-.17,-.54,1.42,(.17,.155,.20)),(.17,-.54,1.40,(.15,.15,.18))]:
 uv('Cargo_sack',(x,y,z),sc,'Grain_sack')
 uv('Cargo_sack_neck',(x,y,z+sc[2]*.83),(.045,.047,.058),'Grain_sack')
 cyl('Cargo_sack_tie',(x,y,z+sc[2]*.8),(x,y,z+sc[2]*.8+.018),.052,'Leather_Light',verts=16)
 uv('Cargo_sack_top',(x,y,z+sc[2]*1.05),(.057,.055,.05),'Grain_sack')
cargo_parts=objects[start:]
cargo=bpy.data.objects.new('Cargo_REMOVABLE',None);bpy.context.collection.objects.link(cargo)
for o in cargo_parts:o.parent=cargo
body=objects[:start]
bpy.ops.object.select_all(action='DESELECT')
for o in objects:o.select_set(True)
cargo.select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'drager.glb'),export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_materials='EXPORT')
# Native source and studio render, excluded from GLB.
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.015));floor=bpy.context.object;floor.name='STUDIO_floor';floor.data.materials.append(mat('Studio_sand',(.19,.16,.12)))
world=bpy.context.scene.world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.20,.23,.27,1);world.node_tree.nodes['Background'].inputs[1].default_value=.4
def area(name,loc,power,size,color):
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.size=size;o.data.color=color;o.rotation_euler=(Vector((0,-.1,1))-o.location).to_track_quat('-Z','Y').to_euler()
area('STUDIO_key',(-3,-4,6),750,4,(1,.82,.63));area('STUDIO_fill',(3,-1,4),450,4,(.65,.78,1));area('STUDIO_rim',(1,3,5),850,3,(1,.76,.46))
bpy.ops.object.camera_add(location=(3.0,-6,2.9));cam=bpy.context.object;cam.rotation_euler=(Vector((0,-.17,1.08))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=2.8
scene=bpy.context.scene;scene.camera=cam;scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=True;scene.render.resolution_x=1100;scene.render.resolution_y=1100;scene.render.resolution_percentage=100;scene.view_settings.view_transform='AgX';scene.render.image_settings.file_format='PNG';scene.render.filepath=os.path.join(OUT,'drager_voorbeeld.png')
bpy.ops.object.select_all(action='DESELECT')
for a in bpy.context.screen.areas:
 if a.type=='VIEW_3D':a.spaces.active.shading.type='MATERIAL';a.spaces.active.region_3d.view_distance=4
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'drager_bron.blend'))
bpy.ops.render.render(write_still=True)
print('CARRIER_DONE')
