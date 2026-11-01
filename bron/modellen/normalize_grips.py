from pathlib import Path
import json,struct
for p in Path(__file__).parent.glob('*.glb'):
 if p.stem.endswith('_gereedschap'):continue
 b=p.read_bytes();n=struct.unpack_from('<I',b,12)[0];g=json.loads(b[20:20+n])
 for o in g['nodes']:
  if o.get('name','').startswith('GRIP_'):o['name']=o['name'].split('.')[0]
 j=json.dumps(g,separators=(',',':')).encode();j+=b' '*((-len(j))%4);tail=b[20+n:]
 p.write_bytes(struct.pack('<III',0x46546c67,2,20+len(j)+len(tail))+struct.pack('<II',len(j),0x4e4f534a)+j+tail)
