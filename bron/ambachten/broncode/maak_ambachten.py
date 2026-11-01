"""Create 17 modular profession variants from boer_lopen.glb.
All models retain source materials, geometry, tool grips and Walk animation.
"""
import copy,json,math,struct
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw,ImageFont
from maak_loopanimatie import load,save,add_accessor,animate,accessor,matrix
from preview import render,world_nodes

HERE=Path(__file__).parent;OUT=HERE.parent/'gegenereerd';OUT.mkdir(exist_ok=True)
ROLES=[
 ('houthakker','Houthakker','cap',[.24,.10,.035],True),
 ('steenhouwer','Steenhouwer','cap',[.37,.34,.27],True),
 ('bosbouwer','Bosbouwer','field',[.20,.29,.10],False),
 ('boer','Boer','straw',None,False),
 ('tuinier','Tuinier','field',[.25,.38,.12],True),
 ('plukker','Plukker','cap',[.39,.20,.08],False),
 ('graver','Graver','cap',[.28,.18,.08],False),
 ('bouwer','Bouwer','cap',[.30,.17,.07],True),
 ('molenaar','Molenaar','cloth',[.73,.64,.43],True),
 ('bakker','Bakker','baker',[.86,.81,.66],True),
 ('kok','Kok','chef',[.88,.85,.73],True),
 ('smid','Smid','cap',[.12,.065,.03],True),
 ('smelter','Smelter','protect',[.29,.12,.045],True),
 ('mijnwerker','Mijnwerker','miner',[.23,.12,.04],False),
 ('zager','Zager','cap',[.21,.26,.11],True),
 ('droger','Droger','field',[.47,.30,.10],True),
 ('waterhaler','Waterhaler','cloth',[.20,.41,.43],False),
]
SOURCES={
 'houthakker':'houthakker_hakken.glb', 'steenhouwer':'steenhouwer_slaan.glb',
 'bosbouwer':'bosbouwer_graven.glb','boer':'boer_maaien.glb',
 'tuinier':'tuinier_oogsten.glb','plukker':'plukker_plukken.glb',
 'graver':'graver_egaliseren.glb','bouwer':'bouwer_timmeren.glb'}

def material(d,name,color,metal=0):
    d['materials'].append({'name':name,'doubleSided':True,'pbrMetallicRoughness':{
        'baseColorFactor':[*color,1],'metallicFactor':metal,'roughnessFactor':.8}})
    return len(d['materials'])-1

def geometry(d,b,name,verts,faces,mat):
    v=np.asarray(verts,float);f=np.asarray(faces,int);ns=np.zeros_like(v)
    norms=np.cross(v[f[:,1]]-v[f[:,0]],v[f[:,2]]-v[f[:,0]])
    for j in range(3):np.add.at(ns,f[:,j],norms)
    ns/=np.maximum(1e-10,np.linalg.norm(ns,axis=1,keepdims=True))
    pa=add_accessor(d,b,v,'VEC3');na=add_accessor(d,b,ns,'VEC3')
    d['accessors'][pa].update(min=v.min(axis=0).tolist(),max=v.max(axis=0).tolist())
    b.extend(b'\0'*((-len(b))%4));off=len(b);ids=f.astype('<u2').flatten();b.extend(ids.tobytes())
    vi=len(d['bufferViews']);d['bufferViews'].append({'buffer':0,'byteOffset':off,'byteLength':ids.nbytes,'target':34963})
    ia=len(d['accessors']);d['accessors'].append({'bufferView':vi,'componentType':5123,'count':len(ids),'type':'SCALAR'})
    mi=len(d['meshes']);d['meshes'].append({'name':name,'primitives':[{'attributes':{'POSITION':pa,'NORMAL':na},'indices':ia,'material':mat}]})
    return mi

def cylinder(d,b,name,radius,height,mat,topradius=None):
    tr=radius if topradius is None else topradius;n=32;v=[]
    for y,r in [(-height/2,radius),(height/2,tr)]:
        for i in range(n):v.append([r*math.cos(i*2*math.pi/n),y,r*math.sin(i*2*math.pi/n)])
    v.extend([[0,-height/2,0],[0,height/2,0]]);f=[]
    for i in range(n):
        j=(i+1)%n;f.extend([[i,j,n+j],[i,n+j,n+i],[2*n,j,i],[2*n+1,n+i,n+j]])
    return geometry(d,b,name,v,f,mat)

def build(role,label,hat,color,apron):
    if role in SOURCES:
        source=HERE.parent.parent/'upload'/SOURCES[role]
        d,b=animate(source,OUT/(role+'_lopen.glb'))
        render(d,b,.125,640).save(OUT/(role+'_lopen.jpg'),quality=92)
        render(d,b,.125,640,True).save(OUT/(role+'_lopen.png'))
        return d,b
    d,b=load(HERE/'boer_lopen.glb');nodes=d['nodes'];core=next(i for i,n in enumerate(nodes) if n['name']=='BODY')
    root=d['scenes'][0]['nodes'][0]
    nodes[root]['name']='WERKER_'+role+'_lopen';nodes[root]['extras']['profession']=role
    nodes[root]['extras']['derived_from']='boer_maaien.glb'
    nodes[root]['extras']['appearance_note']='New profession variant of uploaded farmer, not a reconstruction of other existing profession files.'
    def node(name,mesh,pos,scale=None):
        n={'name':name,'mesh':mesh,'translation':list(pos)}
        if scale:n['scale']=list(scale)
        ni=len(nodes);nodes.append(n);nodes[core]['children'].append(ni);return ni
    def clone_hat(name,meshname,pos,scale,mat):
        orig=next(n for n in nodes if n['name']==meshname)
        mesh=copy.deepcopy(d['meshes'][orig['mesh']]);mesh['name']=name
        for p in mesh['primitives']:p['material']=mat
        mi=len(d['meshes']);d['meshes'].append(mesh);return node(name,mi,pos,scale)
    if hat!='straw':
        nodes[core]['children']=[i for i in nodes[core]['children'] if nodes[i]['name'] not in ['Straw_hat_brim','Straw_hat_crown','TEAM_Hat_band']]
        cloth=material(d,'WORK_'+role,color)
        bandmat=material(d,'BAND_'+role,[.1,.075,.045])
        cream=material(d,'LINEN_'+role,[.87,.81,.65])
        if hat in ['cap','cloth','baker','protect']:
            h=.115 if hat in ['cap','protect'] else .14
            clone_hat('Work_cap_'+role,'Straw_hat_crown',[0,1.92,0],[.235,h,.22],cloth)
            mi=cylinder(d,b,'Cap_band_'+role,.218,.07,cream if hat=='baker' else bandmat)
            node('Cap_band_'+role,mi,[0,1.87,0],[1,1,.88])
            if hat=='protect':
                clone_hat('Protective_cap_brim','Straw_hat_brim',[0,1.865,.025],[.25,.018,.27],cloth)
        elif hat=='field':
            clone_hat('Field_hat_crown_'+role,'Straw_hat_crown',[0,1.96,0],[.23,.115,.2],cloth)
            clone_hat('Field_hat_brim_'+role,'Straw_hat_brim',[0,1.88,0],[.33,.026,.28],cloth)
        elif hat=='chef':
            mi=cylinder(d,b,'Chef_toque',.19,.25,cloth,.21);node('Chef_toque',mi,[0,1.98,0],[1,1,.9])
            clone_hat('Chef_toque_top','Straw_hat_crown',[0,2.105,0],[.235,.075,.21],cloth)
            mi=cylinder(d,b,'Chef_band',.215,.07,cream);node('Chef_band',mi,[0,1.88,0],[1,1,.9])
        elif hat=='miner':
            clone_hat('Miner_leather_helmet','Straw_hat_crown',[0,1.94,0],[.25,.14,.225],cloth)
            bronze=material(d,'Miner_brass',[.56,.31,.08],.5)
            mi=cylinder(d,b,'Miner_helmet_band',.248,.035,bronze);node('Miner_helmet_band',mi,[0,1.875,0],[1,1,.9])
            candle=material(d,'Miner_candle_wax',[.86,.70,.37])
            mi=cylinder(d,b,'Miner_candle',.018,.105,candle);node('Miner_candle',mi,[0,2.07,.12])
    else:cloth=material(d,'WORK_boer',[.025,.22,.54])
    if apron:
        # Reuse the original stonemason's modeled apron and shoulder straps.
        sd,sb=load(HERE.parent.parent/'upload'/'steenhouwer_slaan.glb')
        for sn in sd['nodes']:
            if not sn.get('name','').startswith(('Felt_work_apron','Apron_strap')):continue
            for p in sd['meshes'][sn['mesh']]['primitives']:
                vs=accessor(sd,sb,p['attributes']['POSITION']);vs=(matrix(sn)@np.c_[vs,np.ones(len(vs))].T).T[:,:3]
                vs[:,2]+=.012
                ids=accessor(sd,sb,p['indices']).reshape(-1,3)
                mi=geometry(d,b,sn['name']+'_'+role,vs,ids,cloth);node(sn['name']+'_'+role,mi,[0,0,0])
    # Distinguishing cloth bands at the neck for outdoor trades without aprons.
    if not apron and role not in ['boer','mijnwerker']:
        vv=[[-.13,1.48,.15],[.13,1.48,.15],[0,1.25,.264]]
        mi=geometry(d,b,'Neckerchief_'+role,vv,[[0,1,2]],cloth);node('Neckerchief_'+role,mi,[0,0,0])
    # Remove detached source hat nodes and unreferenced meshes from the final GLB.
    used=set()
    def visit(i):
        used.add(i)
        for c in nodes[i].get('children',[]):visit(c)
    visit(root);oldids=sorted(used);remap={old:new for new,old in enumerate(oldids)}
    d['nodes']=[nodes[i] for i in oldids]
    for n in d['nodes']:
        if 'children' in n:n['children']=[remap[c] for c in n['children']]
    d['scenes'][0]['nodes']=[remap[root]]
    for a in d['animations']:
        for c in a['channels']:c['target']['node']=remap[c['target']['node']]
    usedmesh=sorted({n['mesh'] for n in d['nodes'] if 'mesh'in n});mm={old:new for new,old in enumerate(usedmesh)}
    d['meshes']=[d['meshes'][i] for i in usedmesh]
    for n in d['nodes']:
        if 'mesh'in n:n['mesh']=mm[n['mesh']]
    save(d,b,OUT/(role+'_lopen.glb'))
    render(d,b,.125,640).save(OUT/(role+'_lopen.jpg'),quality=92)
    render(d,b,.125,640,True).save(OUT/(role+'_lopen.png'))
    return d,b

if __name__=='__main__':
    thumbs=[]
    for args in ROLES:
        d,b=build(*args)
        im=render(d,b,.125,320);thumbs.append((args[1],im))
        print(args[0],flush=True)
    sheet=Image.new('RGB',(320*6,360*3),(36,46,49));dr=ImageDraw.Draw(sheet)
    font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',20)
    for i,(label,im) in enumerate(thumbs):
        x=(i%6)*320;y=(i//6)*360;sheet.paste(im,(x,y));dr.text((x+160,y+330),label,anchor='mt',fill='white',font=font)
    sheet.save(OUT/'overzicht_17_ambachten.jpg',quality=94)
    manifest={'format':'glTF 2.0 binary','animation':'Walk','duration_seconds':1,'in_place':True,
        'forward_axis':'+Z','up_axis':'+Y','rig':'rigid node hierarchy (no skinned skeleton)',
        'professions':[{'id':r[0],'name':r[1],'file':r[0]+'_lopen.glb'} for r in ROLES]}
    (OUT/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
