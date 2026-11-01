from pathlib import Path
import struct,json
from PIL import Image
p=Path(__file__).parent
jobs=json.loads((p/'beroepen.json').read_text())['poses']
for j in jobs:
 b=(p/j['file']).read_bytes();assert struct.unpack_from('<III',b)==(0x46546c67,2,len(b));n=struct.unpack_from('<I',b,12)[0];g=json.loads(b[20:20+n]);names=[o.get('name','') for o in g['nodes']]
 assert 'GRIP_RIGHT' in names and 'GRIP_LEFT' in names
 assert not any(s.startswith(('Axe_','Pickaxe_','Shovel_','Scythe_','Watering_can_','Basket_','Hammer_','Sapling_','Seed_bag','Sword_','Helmet_','Shield_')) for s in names)
 assert any(m.get('name','').startswith('TEAM_') for m in g['materials'])
 assert not g.get('animations') and not g.get('skins')
 im=Image.open(p/(Path(j['file']).stem+'.png'));assert im.mode=='RGBA';assert im.getextrema()[3]==(0,255)
print('11 workers: tools separate, two grip nodes, player color, transparent previews; passed')
