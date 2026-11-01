"""Standalone stylized windmill sails. Geometry and colors embedded in GLB."""
import math,sys,copy,json
from pathlib import Path
import numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'boer_lopen'))
from maak_loopanimatie import save,add_accessor,quat
from maak_ambachten import geometry,material
from preview import render

OUT=Path(__file__).parent
d={'asset':{'version':'2.0','generator':'Terrana detailed modular windmill sails'},
   'scene':0,'scenes':[{'name':'Molenwieken','nodes':[0]}],
   'nodes':[{'name':'MOLEN_WIEKEN','children':[1]},
            {'name':'WIEKEN_ROTATOR','children':[]}],
   'meshes':[],'materials':[],'accessors':[],'bufferViews':[],'buffers':[]}
b=bytearray()
wood=material(d,'Eikenhout_warm',[.24,.115,.041]);edge=material(d,'Eikenhout_licht',[.37,.205,.080])
grain=material(d,'Houtnerf',[.13,.057,.019]);iron=material(d,'Smeedijzer',[.065,.055,.042],.65)
brass=material(d,'Verouderd_messing',[.43,.27,.09],.65)
cloth=[material(d,'Zeildoek_'+str(i),c) for i,c in enumerate([[.81,.73,.54],[.87,.80,.63],[.76,.68,.50]])]
seam=material(d,'Zeilnaden',[.54,.43,.27])

def object_mesh(name,verts,faces,mat,angle=0):
    v=np.asarray(verts,float)
    if angle:
        c,s=math.cos(angle),math.sin(angle);v=v@np.array([[c,s,0],[-s,c,0],[0,0,1]])
    mi=geometry(d,b,name,v,faces,mat);ni=len(d['nodes'])
    d['nodes'].append({'name':name,'mesh':mi});d['nodes'][1]['children'].append(ni)

def beam(name,a,z,width,depth,mat,angle=0):
    a=np.array(a,float);z=np.array(z,float);direction=z-a;direction/=np.linalg.norm(direction)
    u=np.cross(direction,[0,0,1]);
    if np.linalg.norm(u)<1e-6:u=np.array([1.,0,0])
    u/=np.linalg.norm(u);v=np.cross(u,direction)
    w=width/2;h=depth/2;bev=min(w,h)*.22
    pts=[(-w+bev,-h),(w-bev,-h),(w,-h+bev),(w,h-bev),(w-bev,h),(-w+bev,h),(-w,h-bev),(-w,-h+bev)]
    verts=[p+x*u+y*v for p in [a,z] for x,y in pts];faces=[]
    for i in range(8):j=(i+1)%8;faces.extend([[i,j,j+8],[i,j+8,i+8]])
    for i in range(1,7):faces.extend([[0,i+1,i],[8,8+i,8+i+1]])
    object_mesh(name,verts,faces,mat,angle)

def cylinder(name,radius,length,center,mat,segments=16,angle=0,radius2=None):
    cx,cy,cz=center;rr=radius if radius2 is None else radius2;verts=[]
    for z,r in [(cz-length/2,radius),(cz+length/2,rr)]:
        for k in range(segments):
            t=2*math.pi*k/segments;verts.append([cx+r*math.cos(t),cy+r*math.sin(t),z])
    verts.extend([[cx,cy,cz-length/2],[cx,cy,cz+length/2]])
    faces=[]
    for i in range(segments):
        j=(i+1)%segments
        faces.extend([[i,j,j+segments],[i,j+segments,i+segments],[2*segments,j,i],[2*segments+1,i+segments,j+segments]])
    object_mesh(name,verts,faces,mat,angle)

for k in range(4):
    angle=k*math.pi/2;label='Wiek_'+str(k+1)
    # Long main spar, framed open lattice and transverse ribs.
    beam(label+'_hoofdroede',[0,.10,0],[0,2.86,0],.115,.13,wood,angle)
    for j,x in enumerate([.13,.39,.65]):
        beam(label+'_langslat_'+str(j),[x,.48,.015],[x,2.76,.015],.035,.045,edge,angle)
    rows=np.linspace(.48,2.76,10)
    for j,y in enumerate(rows):
        beam(label+'_dwarslat_'+str(j),[-.055,y,.035],[.68,y,.035],.037,.048,wood,angle)
    beam(label+'_buitenrand',[.675,.46,.012],[.675,2.79,.012],.045,.055,wood,angle)
    # Bare lattice at the root, billowed fabric panels farther out.
    for j in range(2,9):
        lo,hi=rows[j],rows[j+1];vs=[];fs=[];nx=6;ny=4
        for iy in range(ny+1):
            t=iy/ny;y=lo+(hi-lo)*t
            for ix in range(nx+1):
                u=ix/nx;x=.075+.59*u
                bulge=.041*math.sin(math.pi*u)*math.sin(math.pi*t)
                vs.append([x,y,.073+bulge])
        for iy in range(ny):
            for ix in range(nx):
                q=iy*(nx+1)+ix;fs.extend([[q,q+1,q+nx+2],[q,q+nx+2,q+nx+1]])
        object_mesh(label+'_zeilvak_'+str(j),vs,fs,cloth[(j+k)%3],angle)
        beam(label+'_stiknaad_'+str(j),[.08,lo,.079],[.66,lo,.079],.008,.006,seam,angle)
    # Fine grain and iron straps on the leading beam.
    for j,x in enumerate([-.023,.019]):
        beam(label+'_nerf_'+str(j),[x,.42,.067],[x,2.78,.067],.005,.003,grain,angle)
    for j,y in enumerate([.43,1.30,2.43]):
        beam(label+'_ijzerband_'+str(j),[-.061,y,.073],[.061,y,.073],.033,.016,iron,angle)
        cylinder(label+'_bout_'+str(j),.019,.014,[0,y,.09],brass,10,angle)

cylinder('Houten_as',.135,.78,[0,0,-.34],wood,12)
cylinder('Achterring',.30,.13,[0,0,-.045],iron,16)
cylinder('Achtkantige_naaf',.285,.25,[0,0,.06],wood,8,radius2=.25)
cylinder('Voorste_ijzeren_band',.255,.055,[0,0,.18],iron,16)
cylinder('Houten_naafdop',.237,.09,[0,0,.225],edge,12,radius2=.19)
cylinder('Centrale_asbout',.057,.035,[0,0,.286],iron,10)
for k in range(8):
    a=k*math.pi/4
    cylinder('Naafbouten_'+str(k),.018,.02,[.19*math.cos(a),.19*math.sin(a),.277],brass,8)

d['nodes'][0]['extras']={'pivot':'hub center','spin_axis':'+Z','front_axis':'+Z','blade_count':4,
    'separate_from_building':True,'materials_embedded':True}
save(d,b.copy(),OUT/'molen_wieken.glb')
animated=copy.deepcopy(d);ab=b.copy();ts=np.linspace(0,12,65)
ai=add_accessor(animated,ab,ts,'SCALAR');ri=add_accessor(animated,ab,[quat([0,0,1],2*math.pi*t/12) for t in ts],'VEC4')
animated['animations']=[{'name':'Spin','samplers':[{'input':ai,'output':ri,'interpolation':'LINEAR'}],
    'channels':[{'sampler':0,'target':{'node':1,'path':'rotation'}}]}]
save(animated,ab,OUT/'molen_wieken_draaiend.glb')

def preview(t=0,size=900,alpha=False):
    # Preview-only wrapper; exported GLB retains original hub origin and scale.
    pd=copy.deepcopy(animated);pb=ab
    pd['nodes'].append({'name':'PREVIEW_ONLY','translation':[0,1.05,0],'scale':[.32,.32,.32],'children':[0]})
    pd['scenes'][0]['nodes']=[len(pd['nodes'])-1]
    return render(pd,pb,t,size,alpha)

preview(0,1000).save(OUT/'molen_wieken.jpg',quality=95)
preview(0,1000,True).save(OUT/'molen_wieken.png')
frames=[preview(i/24*12,420) for i in range(24)]
frames[0].save(OUT/'molen_wieken_preview.gif',save_all=True,append_images=frames[1:],duration=120,loop=0)
print('Created static/animated GLB, PNG, JPG, GIF')
