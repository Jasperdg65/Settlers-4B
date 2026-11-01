"""Animate the supplied modular farmer GLB without external 3D dependencies.
Usage: python maak_loopanimatie.py input.glb output.glb
Requires numpy. Source geometry and materials are retained.
"""
import copy, json, math, struct, sys
from pathlib import Path
import numpy as np

def load(path):
    data=Path(path).read_bytes()
    assert data[:4]==b'glTF'
    n=struct.unpack_from('<I',data,12)[0]
    doc=json.loads(data[20:20+n]); p=20+n
    size,kind=struct.unpack_from('<II',data,p)
    assert kind==0x004e4942
    return doc,bytearray(data[p+8:p+8+size])

def quat(axis,angle):
    axis=np.array(axis,float); axis/=np.linalg.norm(axis)
    return [*(axis*math.sin(angle/2)),math.cos(angle/2)]

def matrix(n):
    if 'matrix' in n:return np.array(n['matrix']).reshape(4,4).T
    x,y,z,w=n.get('rotation',[0,0,0,1]); m=np.eye(4)
    m[:3,:3]=np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],
        [2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],
        [2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])@np.diag(n.get('scale',[1,1,1]))
    m[:3,3]=n.get('translation',[0,0,0]); return m

def translation(v):
    m=np.eye(4);m[:3,3]=v;return m

def rotation_between(a,b):
    a=np.array(a,float);a/=np.linalg.norm(a)
    b=np.array(b,float);b/=np.linalg.norm(b)
    v=np.cross(a,b); c=np.dot(a,b);s=np.linalg.norm(v)
    r=np.eye(4)
    if s>1e-7:
        k=np.array([[0,-v[2],v[1]],[v[2],0,-v[0]],[-v[1],v[0],0]])
        r[:3,:3]=np.eye(3)+k+k@k*((1-c)/(s*s))
    return r

def accessor(d,b,index):
    a=d['accessors'][index];v=d['bufferViews'][a['bufferView']]
    dt={5126:'<f4',5125:'<u4',5123:'<u2',5121:'u1'}[a['componentType']]
    width={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']]
    offset=v.get('byteOffset',0)+a.get('byteOffset',0)
    return np.ndarray((a['count'],width),dtype=dt,buffer=b,offset=offset,
        strides=(v.get('byteStride',np.dtype(dt).itemsize*width),np.dtype(dt).itemsize)).copy()

def add_accessor(d,b,values,typ):
    values=np.asarray(values,dtype='<f4'); b.extend(b'\0'*((-len(b))%4));off=len(b);b.extend(values.tobytes())
    vi=len(d['bufferViews']);d['bufferViews'].append({'buffer':0,'byteOffset':off,'byteLength':values.nbytes})
    ai=len(d['accessors']);a={'bufferView':vi,'componentType':5126,'count':len(values),'type':typ}
    if typ=='SCALAR':a.update(min=[float(values.min())],max=[float(values.max())])
    d['accessors'].append(a);return ai

def save(d,b,path):
    d['buffers']=[{'byteLength':len(b)}]
    js=json.dumps(d,separators=(',',':')).encode();js+=b' '*((-len(js))%4)
    b+=b'\0'*((-len(b))%4)
    out=struct.pack('<4sII',b'glTF',2,12+8+len(js)+8+len(b))
    out+=struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(b),0x004e4942)+b
    Path(path).write_bytes(out)

def animate(source,target):
    d,b=load(source);nodes=d['nodes']; original_count=len(nodes)
    root=d['scenes'][0]['nodes'][0]; original=copy.deepcopy(nodes)
    def new(name,pos=(0,0,0),children=None):
        i=len(nodes);nodes.append({'name':name,'translation':list(pos),'children':children or []});return i
    def reparent(index,parent,world):
        n=nodes[index]
        for key in ['translation','rotation','scale','matrix']:n.pop(key,None)
        n['matrix']=(np.linalg.inv(world)@matrix(original[index])).T.flatten().tolist()
        nodes[parent]['children'].append(index)
    profession=original[root].get('extras',{}).get('profession','boer')
    nodes[root]['name']='WERKER_'+profession+'_lopen'
    nodes[root]['children']=[]
    core=new('BODY'); nodes[root]['children'].append(core)
    classified=set()
    hip_nodes=[];knee_nodes=[];shoulder_nodes=[];elbow_nodes=[]
    # Legs: upper leg and boot use separate pivots, retaining original meshes.
    for x in [-.155,.155]:
        hip=np.array([x,.89,-.02]);knee=np.array([x,.43,-.02])
        hi=new('HIP_'+('R' if x<0 else 'L'),hip)
        ki=new('KNEE_'+('R' if x<0 else 'L'),knee-hip)
        nodes[root]['children'].append(hi);nodes[hi]['children'].append(ki)
        hip_nodes.append(hi);knee_nodes.append(ki)
        for i,n in enumerate(original):
            name=n.get('name','');pos=matrix(n)[:3,3]
            if name.startswith(('Boot_','Trouser_leg')) and pos[0]*x>0:
                isboot=name.startswith('Boot_'); reparent(i,ki if isboot else hi,translation(knee if isboot else hip));classified.add(i)
    # Repose the two arms from the mowing grip to a relaxed walking stance.
    for side,sgn in [('Left',1),('Right',-1)]:
        sh=np.array([sgn*.32,1.36,0.])
        oldel=matrix(next(n for n in original if n.get('name','').startswith(side+'_Elbow')))[:3,3]
        oldwr=matrix(next(n for n in original if n.get('name','').startswith(side+'_Palm')))[:3,3]
        ua=oldel-sh; upperlen=np.linalg.norm(ua); lowerlen=np.linalg.norm(oldwr-oldel)
        newel=sh+np.array([sgn*.12,-math.sqrt(upperlen**2-.12**2),.005])
        # Relaxed elbows, hands at hip height rather than in front of the chest.
        newwr=newel+np.array([-sgn*.045,-math.sqrt(lowerlen**2-.045**2-.045**2),.045])
        uppermap=translation(sh)@rotation_between(ua,newel-sh)@translation(-sh)
        lowermap=translation(newel)@rotation_between(oldwr-oldel,newwr-newel)@translation(-oldel)
        shi=new('SHOULDER_'+side,sh); eli=new('ELBOW_'+side,newel-sh)
        nodes[core]['children'].append(shi);nodes[shi]['children'].append(eli)
        shoulder_nodes.append(shi);elbow_nodes.append(eli)
        for i,n in enumerate(original):
            name=n.get('name','')
            if name.startswith(side+'_') or name=='GRIP_'+side.upper():
                parent=shi if name.startswith((side+'_Sleeve',side+'_Rolled_cuff',side+'_Upper_arm')) else eli
                mapping=uppermap if parent==shi else lowermap
                node=nodes[i]
                for k in ['translation','rotation','scale','matrix']:node.pop(k,None)
                node['matrix']=(np.linalg.inv(translation(sh if parent==shi else newel))@mapping@matrix(n)).T.flatten().tolist()
                nodes[parent]['children'].append(i);classified.add(i)
    for i,n in enumerate(original):
        if i!=root and i not in classified:reparent(i,core,np.eye(4))
    duration=1.;times=np.linspace(0,duration,33)
    anim={'name':'Walk','samplers':[],'channels':[]}
    ti=add_accessor(d,b,times,'SCALAR')
    def channel(node,path,vals):
        ai=add_accessor(d,b,vals,'VEC4' if path=='rotation' else 'VEC3');s=len(anim['samplers'])
        anim['samplers'].append({'input':ti,'output':ai,'interpolation':'LINEAR'})
        anim['channels'].append({'sampler':s,'target':{'node':node,'path':path}})
    hiprot=[[],[]];kneerot=[[],[]];shoulderrot=[[],[]]
    shifts=[]
    # Ground correction uses all original boot vertices transformed by leg motion.
    bootpts=[[] for _ in range(2)]
    for j,hi in enumerate(hip_nodes):
        ki=knee_nodes[j]
        for ni in nodes[ki]['children']:
            n=nodes[ni]
            for p in d['meshes'][n['mesh']]['primitives']:
                pts=accessor(d,b,p['attributes']['POSITION']);pts=np.c_[pts,np.ones(len(pts))]
                bootpts[j].append((matrix(n)@pts.T).T)
    for t in times:
        phase=2*math.pi*t
        miny=100.
        for j in range(2):
            p=phase+j*math.pi; swing=.32*math.cos(p); bend=.50*max(0,math.sin(p))**2
            hr=quat([1,0,0],swing);kr=quat([1,0,0],-bend)
            hiprot[j].append(hr);kneerot[j].append(kr)
            shoulderrot[j].append(quat([1,0,0],-.25*math.cos(phase+(1-j)*math.pi)))
            hm=matrix({'translation':nodes[hip_nodes[j]]['translation'],'rotation':hr})
            km=matrix({'translation':nodes[knee_nodes[j]]['translation'],'rotation':kr})
            for pts in bootpts[j]:miny=min(miny,float((hm@km@pts.T)[1].min()))
        shifts.append([0,.005-miny,0])
    for j in range(2):
        channel(hip_nodes[j],'rotation',hiprot[j]);channel(knee_nodes[j],'rotation',kneerot[j])
        channel(shoulder_nodes[j],'rotation',shoulderrot[j])
    channel(root,'translation',shifts)
    channel(core,'rotation',[quat([0,0,1],.018*math.sin(2*math.pi*t)) for t in times])
    d['animations']=[anim]
    nodes[root]['extras']={'profession':profession,'work_pose':'lopen','animated':True,'tool_included':False,
        'animation':'Walk','duration_seconds':duration,'in_place':True,'forward_axis':'+Z',
        'rig_type':'rigid_node_hierarchy','recommended_speed_units_per_second':.7}
    d['asset']['generator']='Terrana modular walk conversion'
    save(d,b,target)
    return d,b

if __name__=='__main__':
    animate(sys.argv[1],sys.argv[2]);print('Created',sys.argv[2])
