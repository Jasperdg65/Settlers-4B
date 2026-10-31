import bpy, math, os, json
from mathutils import Vector

OUT=str(Path(__file__).resolve().parent)
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
