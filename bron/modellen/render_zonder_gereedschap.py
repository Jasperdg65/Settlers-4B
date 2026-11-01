from pathlib import Path
import bpy,json
from mathutils import Vector
out=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(out/'ambachten_bron.blend'))
scene=bpy.context.scene;cam=scene.camera;target=Vector((0,-.08,1.05));cam.location=target+Vector((2.6,-7,2.4));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=2.65
for j in json.loads((out/'beroepen.json').read_text())['poses']:
 key=Path(j['file']).stem;unit=bpy.data.objects['WERKER_'+key];old=unit.location.copy();unit.location=(0,0,0)
 visible=set(unit.children_recursive)
 for o in scene.objects:
  if o.type=='MESH':o.hide_render=o not in visible
 scene.render.filepath=str(out/(key+'_zonder_gereedschap.png'));bpy.ops.render.render(write_still=True);unit.location=old
print('CLEAN_RENDERS_DONE',flush=True)
