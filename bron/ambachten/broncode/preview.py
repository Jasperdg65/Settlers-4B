"""Lightweight GLB animation preview renderer (numpy and Pillow)."""
import math,copy,json,ctypes
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw
from maak_loopanimatie import load,matrix,accessor

def world_nodes(d,b,t):
    ns=copy.deepcopy(d['nodes'])
    for ch in d.get('animations',[{}])[0].get('channels',[]):
        s=d['animations'][0]['samplers'][ch['sampler']]
        ts=accessor(d,b,s['input'])[:,0];vs=accessor(d,b,s['output'])
        i=min(len(ts)-2,max(0,int(np.searchsorted(ts,t,side='right')-1)))
        u=(t-ts[i])/(ts[i+1]-ts[i]);v=vs[i]*(1-u)+vs[i+1]*u
        if ch['target']['path']=='rotation':v/=np.linalg.norm(v)
        ns[ch['target']['node']][ch['target']['path']]=v.tolist()
    worlds={}
    def visit(i,parent):
        worlds[i]=parent@matrix(ns[i])
        for c in ns[i].get('children',[]):visit(c,worlds[i])
    for i in d['scenes'][0]['nodes']:visit(i,np.eye(4))
    return worlds

def render(d,b,t,size=480,transparent=False):
    worlds=world_nodes(d,b,t)
    eye=np.array([3.,2.5,5.]);target=np.array([0,1.05,0]);z=(eye-target);z/=np.linalg.norm(z)
    x=np.cross([0,1,0],z);x/=np.linalg.norm(x);y=np.cross(z,x);cam=np.stack([x,y,z])
    vertices=[];colors=[];depths=[];smoothcolors=[];rastervertices=[]
    for i,n in enumerate(d['nodes']):
        if 'mesh' not in n:continue
        for p in d['meshes'][n['mesh']]['primitives']:
            v=accessor(d,b,p['attributes']['POSITION']);v=np.c_[v,np.ones(len(v))]
            v=(worlds[i]@v.T).T[:,:3];ids=accessor(d,b,p['indices']).flatten()
            tri=v[ids].reshape(-1,3,3)
            norm=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]);norm/=np.maximum(np.linalg.norm(norm,axis=1,keepdims=True),1e-9)
            l=np.array([-3,6,5]);l=l/np.linalg.norm(l)
            shade=.45+.55*np.maximum(0,norm@l)
            col=np.array(d['materials'][p.get('material',0)]['pbrMetallicRoughness']['baseColorFactor'][:3])
            cols=np.clip((col[None,:]*shade[:,None])**(1/2.2)*255,0,255).astype('uint8')
            view=(tri-target)@cam.T;xy=view[:,:,:2]*np.array([size*.38,-size*.38])+[size*.5,size*.52]
            vertices.extend(xy);colors.extend(cols);depths.extend(view[:,:,2].mean(axis=1))
            norms=accessor(d,b,p['attributes']['NORMAL'])@np.linalg.inv(worlds[i][:3,:3])
            norms/=np.maximum(np.linalg.norm(norms,axis=1,keepdims=True),1e-9)
            sh=.40+.60*np.maximum(0,norms@l)
            scol=np.clip((col[None,:]*sh[:,None])**(1/2.2)*255,0,255)
            smoothcolors.extend(scol[ids].reshape(-1,3,3))
            rastervertices.extend(np.concatenate([xy,view[:,:,2:3]],axis=2))
    out=Image.new('RGBA' if transparent else 'RGB',(size,size),(0,0,0,0) if transparent else (36,46,49));draw=ImageDraw.Draw(out)
    if not transparent:draw.ellipse([size*.27,size*.88,size*.73,size*.93],fill=(27,35,37))
    libpath=Path(__file__).parent/'raster.so'
    if libpath.exists():
        lib=ctypes.CDLL(str(libpath));v=np.ascontiguousarray(rastervertices,dtype=np.float64);c=np.ascontiguousarray(smoothcolors,dtype=np.float64);pix=np.array(out)
        ptr=ctypes.POINTER(ctypes.c_double)
        lib.raster.argtypes=[ctypes.c_int,ctypes.c_int,ptr,ptr,ctypes.POINTER(ctypes.c_uint8),ctypes.c_int]
        lib.raster(size,len(v),v.ctypes.data_as(ptr),c.ctypes.data_as(ptr),pix.ctypes.data_as(ctypes.POINTER(ctypes.c_uint8)),4 if transparent else 3)
        out=Image.fromarray(pix)
    else:
        for i in np.argsort(depths):draw.polygon([tuple(p) for p in vertices[i]],fill=tuple(colors[i]))
    return out

if __name__=='__main__':
    here=Path(__file__).parent;d,b=load(here/'boer_lopen.glb')
    frames=[render(d,b,i/16) for i in range(16)]
    frames[0].save(here/'boer_lopen.png')
    frames[0].save(here/'boer_lopen_preview.gif',save_all=True,append_images=frames[1:],duration=[60,60,60,70]*4,loop=0)
    sheet=Image.new('RGB',(480*4,480),(36,46,49))
    for k,i in enumerate([0,4,8,12]):sheet.paste(frames[i],(k*480,0))
    sheet.save(here/'loopcontrole.jpg')
    print('Preview rendered')
