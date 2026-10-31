"use strict";
/* ---------- Goederen: soorten en getekende sprites (eigen ontwerp) ---------- */
const GOODS=[
  {k:'boomstam',n:'Boomstam',gr:'Bouwmaterialen'},{k:'plank',n:'Plank',gr:'Bouwmaterialen'},{k:'steen',n:'Steen',gr:'Bouwmaterialen'},
  {k:'graan',n:'Graan',gr:'Voedsel'},{k:'meel',n:'Meel',gr:'Voedsel'},{k:'brood',n:'Brood',gr:'Voedsel'},{k:'water',n:'Water',gr:'Voedsel'},
  {k:'vis',n:'Vis',gr:'Voedsel'},{k:'vlees',n:'Vlees',gr:'Voedsel'},
  {k:'kolen',n:'Kolen',gr:'Grondstoffen'},{k:'ijzererts',n:'IJzererts',gr:'Grondstoffen'},{k:'gouderts',n:'Gouderts',gr:'Grondstoffen'},
  {k:'ijzer',n:'IJzer',gr:'Metalen'},{k:'goud',n:'Goud',gr:'Metalen'},
  {k:'bijl',n:'Bijl',gr:'Gereedschap'},{k:'zaag',n:'Zaag',gr:'Gereedschap'},{k:'houweel',n:'Houweel',gr:'Gereedschap'},{k:'hamer',n:'Hamer',gr:'Gereedschap'},
  {k:'schop',n:'Schop',gr:'Gereedschap'},{k:'zeis',n:'Zeis',gr:'Gereedschap'},{k:'hengel',n:'Hengel',gr:'Gereedschap'},
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
  vis:g=>{poly(g,[1.4,0,2.3,-0.7,2.3,0.7],'#6f8b9b');ell(g,-0.1,0,1.7,0.75,'#9fb8c6');line(g,[-1.2,0.2,1.2,0.2],'#7c96a4',0.2);circ(g,-1.1,-0.2,0.18,'#1d2a33')},
  vlees:g=>{ell(g,-0.4,0,1.5,1,'#a8443a');ell(g,-0.6,-0.2,0.8,0.45,'#c4655a');line(g,[0.8,0.1,2,0.3],'#efe6d4',0.5);circ(g,2.1,0.3,0.35,'#efe6d4')},
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
  hengel:g=>{line(g,[-2.3,0.8,2.3,-0.9],'#9a7046',0.3);g.strokeStyle='rgba(240,240,240,.8)';g.lineWidth=0.15;g.beginPath();g.moveTo(2.3,-0.9);g.quadraticCurveTo(2.1,0.2,1.2,0.6);g.stroke();circ(g,1.2,0.6,0.25,'#d33b3b')},
  zwaard:g=>{line(g,[-0.9,0.4,2.3,-0.8],'#d4d8dc',0.55);line(g,[-1.2,-0.4,-0.6,1.2],'#8a6a2c',0.45);line(g,[-2.2,0.9,-0.9,0.4],'#5e3b20',0.45);circ(g,-2.3,0.95,0.3,'#c9a54a')},
  boog:g=>{g.strokeStyle='#8a5a34';g.lineWidth=0.45;g.beginPath();g.moveTo(-2,0.9);g.quadraticCurveTo(0.6,1.1,1.9,-1.2);g.stroke();line(g,[-2,0.9,1.9,-1.2],'#efe6d4',0.15)},
};
/* stapel van n stuks (1..8): onderste laag 4 plekken van achter naar voren, daarboven nog 4 */
const GSLOT=[[-2.3,-0.8],[2.3,-0.8],[-2.3,0.9],[2.3,0.9]];
const GSPR=[];
function goodSprite(gd,n){const k=gd*9+n;
  return GSPR[k]||(GSPR[k]=spr(13,10,6.5,7,g=>{ell(g,0,1.2,5.4,1.7,'rgba(40,30,10,.22)');const d=GDRAW[GOODS[gd].k];
    for(let j=0;j<n;j++){const [x,y]=GSLOT[j&3];g.save();g.translate(x*(j>3?0.8:1),y-(j>3?2.1:0));d(g);g.restore()}}))}
