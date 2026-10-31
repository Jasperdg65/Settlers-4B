"use strict";
/* ---------- Goederen: soorten en getekende sprites (eigen ontwerp) ---------- */
const GOODS=[
  {k:'boomstam',n:'Boomstam',gr:'Bouwmaterialen'},{k:'plank',n:'Plank',gr:'Bouwmaterialen'},{k:'steen',n:'Steen',gr:'Bouwmaterialen'},
  {k:'graan',n:'Graan',gr:'Voedsel'},{k:'meel',n:'Meel',gr:'Voedsel'},{k:'brood',n:'Brood',gr:'Voedsel'},{k:'water',n:'Water',gr:'Voedsel'},
  {k:'peulvruchten',n:'Peulvruchten',gr:'Voedsel'},{k:'groente',n:'Groente',gr:'Voedsel'},{k:'fruit',n:'Fruit',gr:'Voedsel'},{k:'noten',n:'Noten',gr:'Voedsel'},
  {k:'stoofpot',n:'Stoofpot',gr:'Voedsel'},{k:'notenmix',n:'Fruit-notenmix',gr:'Voedsel'},
  {k:'kolen',n:'Kolen',gr:'Grondstoffen'},{k:'ijzererts',n:'IJzererts',gr:'Grondstoffen'},{k:'gouderts',n:'Gouderts',gr:'Grondstoffen'},
  {k:'ijzer',n:'IJzer',gr:'Metalen'},{k:'goud',n:'Goud',gr:'Metalen'},
  {k:'bijl',n:'Bijl',gr:'Gereedschap'},{k:'zaag',n:'Zaag',gr:'Gereedschap'},{k:'houweel',n:'Houweel',gr:'Gereedschap'},{k:'hamer',n:'Hamer',gr:'Gereedschap'},
  {k:'schop',n:'Schop',gr:'Gereedschap'},{k:'zeis',n:'Zeis',gr:'Gereedschap'},
  {k:'zwaard',n:'Zwaard',gr:'Wapens'},{k:'boog',n:'Boog',gr:'Wapens'}];
const GI={};GOODS.forEach((d,i)=>GI[d.k]=i);
/* één exemplaar rond (0,0), ongeveer 4,4 breed en 2 hoog */
const bag=(g,col,mark)=>{ell(g,0,-0.3,1.5,1.3,col);poly(g,[-0.5,-1.4,0.5,-1.4,0.3,-2,-0.3,-2],sh(col,0.85));line(g,[-0.5,-1.6,0.5,-1.6],'#7a6340',0.3);
  if(mark)for(const dx of [-0.6,0,0.6])line(g,[dx,0.2,dx*1.3,-0.6],mark,0.3)};
const lumps=(g,col,spot)=>{for(const [x,y,r] of [[-1.3,0.2,0.9],[0.9,0.3,1],[-0.2,-0.5,0.9],[1.6,-0.4,0.6]]){circ(g,x,y,r,col);if(spot)circ(g,x+r*0.3,y-r*0.3,r*0.3,spot)}};
const handle=(g,x0,y0,x1,y1)=>line(g,[x0,y0,x1,y1],'#8a5a34',0.45);
const GDRAW={
  boomstam:g=>{poly(g,[-2.2,-0.8,1.8,-0.8,1.8,0.8,-2.2,0.8],'#7a4e2c',OUT,0.3);line(g,[-1.8,-0.2,1.2,-0.2],'#5e3b20',0.25);
    ell(g,1.8,0,0.55,0.8,'#d8b07a');ell(g,1.8,0,0.22,0.35,'#b98a55')},
  plank:g=>{box(g,-2.2,2.2,0.6,0.55,1.6,'#d6ad72');line(g,[-1.6,0.35,1.6,0.35],'#b88c55',0.15)},
  steen:g=>box(g,-1.6,1.4,0.8,1.5,1.8,'#a9a39a'),
  graan:g=>bag(g,'#e2c873','#b48a2c'),
  meel:g=>bag(g,'#f2ede1',null),
  brood:g=>{ell(g,0,0,1.9,1.1,'#b9773a');for(const dx of [-0.8,0,0.8])line(g,[dx-0.3,-0.6,dx+0.3,0.2],'#e4b77a',0.3);ell(g,-0.6,-0.5,0.6,0.25,'rgba(255,230,180,.45)')},
  water:g=>{poly(g,[-1.2,-1.6,1.2,-1.6,0.9,0.8,-0.9,0.8],'#8a5a34',OUT,0.3);line(g,[-1.1,-0.6,1.05,-0.6],'#5e3b20',0.3);ell(g,0,-1.6,1.2,0.4,'#4f8fc4')},
  /* veganistisch: geen vis of vlees (ontwerpkeuze) */
  peulvruchten:g=>{ell(g,0,0.5,2.1,0.75,'#9a7a4a');for(const [x,y,c] of [[-1.2,0,'#7a4a2a'],[-0.4,-0.3,'#a8763c'],[0.4,0,'#5f7a35'],[1.2,-0.2,'#7a4a2a'],[-0.8,-0.7,'#5f7a35'],[0.1,-0.9,'#a8763c'],[0.9,-0.7,'#7a4a2a']])ell(g,x,y,0.42,0.3,c)},
  groente:g=>{poly(g,[-2.2,-0.5,0.2,-0.1,-2.0,0.4],'#e07a26',OUT,0.2);for(const a of [-0.4,0,0.4])line(g,[-2.1,0,-2.8,a*1.6-0.2],'#4f8a35',0.35);
    circ(g,1.1,-0.2,1.15,'#6fa84a');circ(g,1.1,-0.2,0.7,'#8cc260');line(g,[0.5,-0.2,1.7,-0.2],'#4f8a35',0.2)},
  fruit:g=>{for(const [x,y,c] of [[-1.2,0.1,'#c8382e'],[0.2,0.2,'#d9a32a'],[1.4,0,'#b8302a'],[-0.5,-0.9,'#c8382e'],[0.8,-0.9,'#8db83a']]){circ(g,x,y,0.75,c);circ(g,x-0.25,y-0.25,0.22,'rgba(255,255,255,.35)');line(g,[x,y-0.7,x+0.15,y-1.05],'#5e3b20',0.18)}},
  noten:g=>{for(const [x,y] of [[-1.3,0.2],[0,0.3],[1.3,0.2],[-0.65,-0.6],[0.65,-0.6],[0,-1.3]]){circ(g,x,y,0.62,'#9a6a3a');ell(g,x,y-0.4,0.5,0.25,'#c9a26a')}},
  stoofpot:g=>{ell(g,0,0.3,2,1.2,'#8a4f2e');ell(g,0,-0.6,1.8,0.45,'#6b3a20');ell(g,0,-0.7,1.4,0.32,'#b8742e');circ(g,-0.4,-0.75,0.18,'#e0a040');circ(g,0.5,-0.7,0.16,'#5f8a35');
    line(g,[-2,-0.3,-2.5,-0.6],'#5e3b20',0.35);line(g,[2,-0.3,2.5,-0.6],'#5e3b20',0.35)},
  notenmix:g=>{bag(g,'#d6b98a',null);for(const [x,y,c] of [[-0.6,-0.6,'#9a6a3a'],[0.3,-0.4,'#c8382e'],[0.7,0.2,'#d9a32a'],[-0.3,0.3,'#9a6a3a'],[0,-0.1,'#7a3a5a']])circ(g,x,y,0.3,c)},
  kolen:g=>lumps(g,'#2a2a2c','#4a4a4f'),
  ijzererts:g=>lumps(g,'#7d6a5e','#b8622f'),
  gouderts:g=>lumps(g,'#8a857a','#e6b422'),
  ijzer:g=>box(g,-1.8,1.6,0.6,0.9,1.4,'#8d949c'),
  goud:g=>box(g,-1.8,1.6,0.6,0.9,1.4,'#e6b422'),
  bijl:g=>{handle(g,-2.1,0.8,1.6,-0.6);poly(g,[1.1,-1.4,2.3,-1.2,2.1,0.2,1.3,-0.2],'#9aa1a8',OUT,0.2)},
  zaag:g=>{poly(g,[-1.4,-0.6,2.2,-0.3,2.2,0.3,-1.4,0.6],'#b8bec4',OUT,0.2);for(let x=-1.2;x<2.1;x+=0.5)line(g,[x,0.55,x+0.25,0.85],'#8d949c',0.2);
    poly(g,[-2.3,-0.7,-1.4,-0.7,-1.4,0.7,-2.3,0.7],'#8a5a34',OUT,0.2)},
  houweel:g=>{handle(g,-2,0.9,1.2,-0.7);g.strokeStyle='#8d949c';g.lineWidth=0.5;g.beginPath();g.moveTo(-0.2,-1.6);g.quadraticCurveTo(1.4,-1.3,2.4,0.2);g.stroke()},
  hamer:g=>{handle(g,-2,0.8,1.2,-0.5);box(g,0.6,2,-0.1,1.1,0.8,'#7c8087')},
  schop:g=>{handle(g,-2.3,0.9,0.6,-0.3);poly(g,[0.4,-0.9,2.3,-0.6,2.1,0.5,0.6,0.4],'#9aa1a8',OUT,0.2)},
  zeis:g=>{handle(g,-2.2,0.8,1.6,-0.4);g.strokeStyle='#b8bec4';g.lineWidth=0.45;g.beginPath();g.moveTo(1.6,-0.4);g.quadraticCurveTo(1.2,-1.8,-0.8,-1.6);g.stroke()},
  zwaard:g=>{line(g,[-0.9,0.4,2.3,-0.8],'#d4d8dc',0.55);line(g,[-1.2,-0.4,-0.6,1.2],'#8a6a2c',0.45);line(g,[-2.2,0.9,-0.9,0.4],'#5e3b20',0.45);circ(g,-2.3,0.95,0.3,'#c9a54a')},
  boog:g=>{g.strokeStyle='#8a5a34';g.lineWidth=0.45;g.beginPath();g.moveTo(-2,0.9);g.quadraticCurveTo(0.6,1.1,1.9,-1.2);g.stroke();line(g,[-2,0.9,1.9,-1.2],'#efe6d4',0.15)},
};
const GSC=1.5; // schaal van stapels op de kaart t.o.v. de tekening
/* stapel van n stuks (1..8): onderste laag 4 plekken van achter naar voren, daarboven nog 4 */
const GSLOT=[[-2.3,-0.8],[2.3,-0.8],[-2.3,0.9],[2.3,0.9]];
const GSPR=[];
function goodSprite(gd,n){const k=gd*9+n;
  return GSPR[k]||(GSPR[k]=spr(13,10,6.5,7,g=>{ell(g,0,1.2,5.4,1.7,'rgba(40,30,10,.22)');const d=GDRAW[GOODS[gd].k];
    for(let j=0;j<n;j++){const [x,y]=GSLOT[j&3];g.save();g.translate(x*(j>3?0.8:1),y-(j>3?2.1:0));d(g);g.restore()}},n?GSC:1))}
/* één goed in de handen van een drager (zelfde schaal als de kolonist) */
const GCAR=[];
function carrySprite(gd){return GCAR[gd]||(GCAR[gd]=spr(8,6,4,3.5,g=>GDRAW[GOODS[gd].k](g),1.2))}
