"use strict";
/* ---------- Gebouwen (tijdelijke getekende versies) ----------
   Sleutels blijven stabiel als de naam verandert: kazerne = Krachthal (training), wapensmid = Uitrustingsmaker.
   off:1 = voorlopig niet in het spel (niet in het startdorp, het bouwmenu of de galerij); de tekening blijft bewaard. */
function ground(g,w,d){const ox=d*0.55,oy=-d*0.7;poly(g,[-w/2-2,1.2,w/2+2,1.2,w/2+2+ox,oy+1.2,-w/2-2+ox,oy+1.2],'rgba(170,138,92,.55)')}
function box(g,x0,x1,y0,h,d,col){const ox=d*0.55,oy=-d*0.7;
  poly(g,[x1,y0,x1+ox,y0+oy,x1+ox,y0+oy-h,x1,y0-h],sh(col,0.74),OUT,0.4);
  poly(g,[x0,y0-h,x1,y0-h,x1+ox,y0+oy-h,x0+ox,y0+oy-h],sh(col,1.12),OUT,0.4);
  poly(g,[x0,y0,x1,y0,x1,y0-h,x0,y0-h],col,OUT,0.4)}
function stoneTex(g,x0,x1,y0,h,col){g.strokeStyle=sh(col,0.78);g.lineWidth=0.25;let row=0;
  for(let y=y0-1.8;y>y0-h+0.3;y-=1.8,row++){g.beginPath();g.moveTo(x0+0.2,y);g.lineTo(x1-0.2,y);g.stroke();
    for(let x=x0+(row%2?1.5:3);x<x1-0.5;x+=3){g.beginPath();g.moveTo(x,y);g.lineTo(x,y+1.8);g.stroke()}}}
function cren(g,x0,x1,yt,col){for(let x=x0;x<x1-0.6;x+=2.4)poly(g,[x,yt,x+1.3,yt,x+1.3,yt-1.6,x,yt-1.6],col,OUT,0.3)}
function door(g,x,w,h,col,y0=0){g.beginPath();g.moveTo(x-w/2,y0);g.lineTo(x-w/2,y0-h+w/2);g.arc(x,y0-h+w/2,w/2,Math.PI,0);g.lineTo(x+w/2,y0);g.closePath();
  g.fillStyle=col;g.fill();g.strokeStyle=OUT;g.lineWidth=0.4;g.stroke();for(const dx of [-w/4,w/4])line(g,[x+dx,y0,x+dx,y0-h+w/2+0.3],sh(col,0.75),0.25);circ(g,x+w/4+0.4,y0-h*0.45,0.25,'#2a1b10')}
function win(g,x,y,w,h){poly(g,[x-w/2-0.4,y+0.4,x+w/2+0.4,y+0.4,x+w/2+0.4,y-h-0.4,x-w/2-0.4,y-h-0.4],'#5a3b22');
  poly(g,[x-w/2,y,x+w/2,y,x+w/2,y-h,x-w/2,y-h],'#2a211b');line(g,[x,y,x,y-h],'#5a3b22',0.3);line(g,[x-w/2,y-h/2,x+w/2,y-h/2],'#5a3b22',0.3);
  poly(g,[x-w/2+0.2,y-h+0.2,x-w/2+1,y-h+0.2,x-w/2+0.2,y-h+1.2],'rgba(255,230,170,.35)')}
const ROOF={tile:'#b65a35',slate:'#5c6370',thatch:'#c9a55a',wood:'#7d5a38'};
function roofTex(g,A,R,ox,oy,kind,col){
  g.strokeStyle=kind==='thatch'?sh(col,0.78):sh(col,0.68);g.lineWidth=kind==='thatch'?0.25:0.35;
  if(kind==='thatch'){for(let t=0.06;t<1;t+=0.07){const px=A[0]+(R[0]-A[0])*t,py=A[1]+(R[1]-A[1])*t;g.beginPath();g.moveTo(px,py);g.lineTo(px+ox,py+oy);g.stroke()}}
  else{for(let t=0.2;t<1;t+=0.2){g.beginPath();g.moveTo(A[0]+ox*t,A[1]+oy*t);g.lineTo(R[0]+ox*t,R[1]+oy*t);g.stroke()}
    for(let t=0.14;t<0.99;t+=kind==='slate'?0.12:0.14){const px=A[0]+(R[0]-A[0])*t,py=A[1]+(R[1]-A[1])*t;g.beginPath();g.moveTo(px,py);g.lineTo(px+ox,py+oy);g.stroke()}}
}
function timber(g,x0,x1,y0,h){const B='#4e3322';
  line(g,[x0+0.3,y0-1.2,x0+0.3,y0-h],B,0.8);line(g,[x1-0.3,y0-1.2,x1-0.3,y0-h],B,0.8);line(g,[x0,y0-h+0.4,x1,y0-h+0.4],B,0.8);
  line(g,[x0,y0-h*0.5,x1,y0-h*0.5],B,0.6);line(g,[x0,y0-1.4,x1,y0-1.4],B,0.7);
  for(let x=x0+3.2;x<x1-1.5;x+=3.2)line(g,[x,y0-1.4,x,y0-h],B,0.55);
  line(g,[x0+0.3,y0-h*0.5,x0+2.6,y0-h+0.4],B,0.5);line(g,[x1-0.3,y0-h*0.5,x1-2.6,y0-h+0.4],B,0.5)}
function house(g,o){
  const w=o.w,h=o.h,d=o.d,ph=o.ph,e=1.4,ox=d*0.55,oy=-d*0.7,wall=o.wall,kind=o.roof||'tile',roof=ROOF[kind];
  poly(g,[w/2,0,w/2+ox,oy,w/2+ox,oy-h,w/2,-h],sh(wall,0.74),OUT,0.4);
  if(o.timber){const B='#4e3322';line(g,[w/2+ox-0.3,oy-0.8,w/2+ox-0.3,oy-h],B,0.7);line(g,[w/2,-h*0.5,w/2+ox,oy-h*0.5],B,0.55);line(g,[w/2,-h+0.4,w/2+ox,oy-h+0.4],B,0.7)}
  const L=[-w/2-e,-h+0.3],R=[w/2+e,-h+0.3],A=[0,-h-ph];
  poly(g,[L[0],L[1],A[0],A[1],A[0]+ox,A[1]+oy,L[0]+ox,L[1]+oy],sh(roof,0.8),OUT,0.4);
  poly(g,[A[0],A[1],R[0],R[1],R[0]+ox,R[1]+oy,A[0]+ox,A[1]+oy],roof,OUT,0.4);
  roofTex(g,A,R,ox,oy,kind,roof);
  line(g,[A[0],A[1],A[0]+ox,A[1]+oy],kind==='thatch'?sh(roof,0.7):sh(roof,1.3),kind==='thatch'?1.2:0.6);
  poly(g,[-w/2,0,w/2,0,w/2,-h,-w/2,-h],wall,OUT,0.4);
  if(o.stone)stoneTex(g,-w/2,w/2,0,h,wall);if(o.planks)for(let x=-w/2+1.3;x<w/2;x+=1.3)line(g,[x,-1.2,x,-h],sh(wall,0.8),0.3);
  poly(g,[-w/2,0,w/2,0,w/2,-1.3,-w/2,-1.3],'#8f8678');
  poly(g,[L[0]+0.5,L[1],R[0]-0.5,R[1],A[0],A[1]+0.4],o.ped||(o.timber?wall:sh(wall,1.05)),OUT,0.4);
  if(o.timber){timber(g,-w/2,w/2,0,h);const B='#4e3322';line(g,[0,A[1]+0.6,0,-h],B,0.6);line(g,[-w/4,-h,0,A[1]+ph*0.45],B,0.45);line(g,[w/4,-h,0,A[1]+ph*0.45],B,0.45)}
  line(g,[L[0],L[1],A[0],A[1],R[0],R[1]],kind==='thatch'?sh(roof,0.72):sh(roof,0.55),kind==='thatch'?1.4:0.9);
  return {ox,oy,A,R,L};
}
function logs(g,x,y){for(let row=0;row<3;row++)for(let k=0;k<3-row;k++){const cx=x+k*1.7+row*0.85,cy=y-0.9-row*1.5;
  circ(g,cx,cy,0.95,'#7a5434');circ(g,cx,cy,0.75,'#d9b27c');circ(g,cx,cy,0.3,'#a57a45')}}
function barrel(g,x,y){g.strokeStyle=OUT;g.lineWidth=0.35;g.beginPath();g.moveTo(x-1.3,y);g.quadraticCurveTo(x-1.8,y-1.6,x-1.3,y-3.2);g.lineTo(x+1.3,y-3.2);
  g.quadraticCurveTo(x+1.8,y-1.6,x+1.3,y);g.closePath();g.fillStyle='#9a6a38';g.fill();g.stroke();line(g,[x-1.6,y-0.8,x+1.6,y-0.8],'#55524d',0.35);line(g,[x-1.6,y-2.4,x+1.6,y-2.4],'#55524d',0.35);ell(g,x,y-3.2,1.3,0.4,'#b9844a')}
function sack(g,x,y){ell(g,x,y-1.3,1.4,1.5,'#e3d3ac');line(g,[x-0.5,y-2.7,x+0.5,y-2.7],'#a58d5e',0.4)}
function crate(g,x,y,s){box(g,x,x+s,y,s,s*0.9,'#a9773f');line(g,[x,y,x+s,y-s],'#7f5528',0.3);line(g,[x,y-s,x+s,y],'#7f5528',0.3)}
function banner(g,x,y,pc,w=3.6,h=5){line(g,[x-w/2-0.6,y,x+w/2+0.6,y],'#6b4a2b',0.6);
  poly(g,[x-w/2,y,x+w/2,y,x+w/2,y+h-1,x,y+h,x-w/2,y+h-1],pc,OUT,0.35);poly(g,[x-0.5,y+0.6,x+0.5,y+0.6,x+0.5,y+h-1.4,x-0.5,y+h-1.4],'rgba(255,240,200,.8)')}
function flag(g,x,y,pc,len=9){line(g,[x,y,x,y-len],'#5a3b22',0.55);circ(g,x,y-len-0.4,0.5,'#e5c56c');
  g.beginPath();g.moveTo(x,y-len+0.3);g.quadraticCurveTo(x+2.5,y-len-0.6,x+5,y-len+0.6);g.lineTo(x+4.6,y-len+3.4);g.quadraticCurveTo(x+2.3,y-len+2.4,x,y-len+3.4);
  g.closePath();g.fillStyle=pc;g.fill();g.strokeStyle=OUT;g.lineWidth=0.3;g.stroke()}
function chimney(g,x,y,h){box(g,x,x+1.8,y,h,1.6,'#9c7461');line(g,[x,y-h+0.8,x+1.8,y-h+0.8],'#6e4f40',0.3)}
function cone(g,cx,yb,r,hgt,col){poly(g,[cx-r-0.6,yb,cx+r+0.6,yb,cx+0.4,yb-hgt],col,OUT,0.4);poly(g,[cx+0.4,yb,cx+r+0.6,yb,cx+0.4,yb-hgt],sh(col,0.8));
  for(let k=1;k<4;k++){const t=k/4;line(g,[cx-(r+0.6)*(1-t),yb-hgt*t,cx+(r+0.6)*(1-t)+0.4*t,yb-hgt*t],sh(col,0.7),0.3)}}
function wheat(g,x0,x1,y0,rows){for(let r=0;r<rows;r++){const y=y0-r*1.5;poly(g,[x0+r*0.8,y,x1+r*0.8,y,x1+r*0.8+0.8,y-1.6,x0+r*0.8+0.8,y-1.6],r%2?'#d9b24c':'#e5c35a');
  for(let x=x0+r*0.8+0.4;x<x1+r*0.8;x+=0.9)line(g,[x,y,x+0.3,y-2.2],'#b8902f',0.3)}}

const BTYPES={
  burcht:{name:t('bld.burcht'),fp:[-3,3,-4,0],sc:1.7,box:[60,58,28,52],pc:true,draw:(g,pc)=>{
    ground(g,44,14);
    g.save();g.translate(1,-10);box(g,-7,7,0,20,9,'#bdb3a2');stoneTex(g,-7,7,0,20,'#bdb3a2');
    const ox=9*0.55,oy=-9*0.7;poly(g,[-8,-20,8,-20,8+ox,-20+oy,-8+ox,-20+oy],'#a69b89',OUT,0.4);
    poly(g,[-8,-20,8,-20,ox*0.5,-29+oy*0.5],ROOF.slate,OUT,0.4);poly(g,[8,-20,8+ox,-20+oy,ox*0.5,-29+oy*0.5],sh(ROOF.slate,0.8),OUT,0.4);
    win(g,-3,-12,1.6,2.6);win(g,3,-12,1.6,2.6);chimney(g,8.6,-23,4);flag(g,ox*0.5,-29+oy*0.5,pc,8);g.restore();
    box(g,-14,14,0,11,3,'#c2b8a6');stoneTex(g,-14,14,0,11,'#c2b8a6');cren(g,-14,14,-11,'#cdc4b3');
    door(g,0,7,9,'#5e3b22');for(let k=1;k<4;k++)line(g,[-3.3,-k*2,3.3,-k*2],'#3b2617',0.35);
    for(const x0 of [-22,13]){box(g,x0,x0+9,1,20,8,'#c9bfae');stoneTex(g,x0,x0+9,1,20,'#c9bfae');
      poly(g,[x0+4,-8,x0+5,-8,x0+5,-11,x0+4,-11],'#2f241b');poly(g,[x0+4,-14,x0+5,-14,x0+5,-16.5,x0+4,-16.5],'#2f241b');
      cone(g,x0+4.5+2.2,-19-2.8,6.4,11,ROOF.slate);}
    banner(g,-8,-10,pc,4,5.5);banner(g,8,-10,pc,4,5.5);
  }},
  woonhuis:{name:t('bld.woonhuis'),fp:[-1,1,-2,0],sc:1.7,box:[32,32,14,28],draw:(g)=>{
    ground(g,14,10);house(g,{w:14,h:9,d:10,ph:5.5,wall:'#efe4cc',roof:'tile',timber:true});chimney(g,6.3,-15,3.8);
    door(g,-3,3,5.6,'#6e4426');win(g,2.6,-5,3,2.6);
    g.fillStyle='#5a7e34';g.fillRect(0.9,-4.3,3.4,0.8);for(let k=0;k<4;k++)circ(g,1.3+k*0.85,-4.5,0.45,['#d94b4b','#f2d04a','#d94b4b','#f4f0e6'][k]);
    barrel(g,-7.6,0.8);
  }},
  houthakker:{name:t('bld.houthakker'),fp:[-1,1,-2,0],sc:1.7,box:[34,30,16,26],draw:(g)=>{
    ground(g,16,9);house(g,{w:12,h:8,d:9,ph:5,wall:'#9b6b3c',roof:'slate',planks:true});
    door(g,-2.4,3,5,'#5e3920');win(g,2.6,-4.6,2.4,2.2);logs(g,7.4,0.6);
    ell(g,-9.2,-0.3,1.8,0.8,'#7a5434');ell(g,-9.2,-1.2,1.8,0.7,'#d4b083');line(g,[-9.4,-1.3,-8.3,-4.3],'#7a5434',0.55);
    poly(g,[-8.7,-4.4,-7.2,-5.2,-6.9,-4.3,-8.2,-3.6],'#a9a7a0',OUT,0.3);
  }},
  bosbouwer:{name:t('bld.bosbouwer'),fp:[-1,1,-2,0],sc:1.7,box:[34,28,18,24],draw:(g)=>{
    ground(g,16,8);house(g,{w:11,h:7,d:8,ph:4.5,wall:'#ece0c4',roof:'thatch',timber:true});door(g,-2,2.8,4.6,'#4d7a3a');win(g,2.5,-4,2.2,2);
    for(const [x,y] of [[-9.5,0.2],[-12.5,1.2],[-7,1.6]]){ell(g,x,y,1.4,0.5,'#7a5a3a');line(g,[x,y,x,y-2.6],'#6b4a2b',0.4);
      circ(g,x-0.6,y-3,1.1,'#5a8a33');circ(g,x+0.6,y-3.4,1.1,'#6e9a3c');circ(g,x,y-4,0.9,'#8db04b')}
    poly(g,[6.6,0.3,8.8,0.3,8.6,-1.8,6.8,-1.8],'#8c929a',OUT,0.3);line(g,[8.7,-1.4,10,-2.6],'#8c929a',0.5);
  }},
  zagerij:{name:t('bld.zagerij'),fp:[-1,2,-2,0],sc:1.7,box:[40,32,20,27],draw:(g)=>{
    ground(g,22,10);const ox=5,oy=-6.3;
    line(g,[-15,0,-15,-6],'#6b4a2b',0.7);line(g,[-15+ox,oy,-15+ox,oy-6],'#6b4a2b',0.7);
    poly(g,[-16.2,-5.6,-6,-8.4,-6+ox,-8.4+oy,-16.2+ox,-5.6+oy],ROOF.wood,OUT,0.4);
    ell(g,-11,-1.6,3.6,1,'#8a5c30');ell(g,-7.5,-1.6,0.9,1,'#d9b27c');
    line(g,[-13,0,-11.5,-2.4],'#6b4a2b',0.5);line(g,[-11.5,0,-13,-2.4],'#6b4a2b',0.5);line(g,[-9.6,-3.4,-9.6,-0.2],'#c9c9c4',0.5);
    house(g,{w:12,h:8,d:9,ph:5,wall:'#e6d6b4',roof:'slate',timber:true});door(g,1.8,3,5,'#6b4024');win(g,-2.8,-4.6,2.4,2.2);
    for(let k=0;k<4;k++)poly(g,[8,-k*0.9,14,-k*0.9,14+1.6,-k*0.9-1.2,8+1.6,-k*0.9-1.2],k%2?'#c79a5f':'#d7ab6f',OUT,0.3);
  }},
  steenhouwer:{name:t('bld.steenhouwer'),fp:[-1,1,-2,0],sc:1.7,box:[34,30,16,26],draw:(g)=>{
    ground(g,16,9);house(g,{w:12,h:8,d:9,ph:5,wall:'#bfb6a5',roof:'slate',stone:true});
    door(g,-2.4,3,5,'#5e3920');win(g,2.6,-4.6,2.4,2.2);
    box(g,7,9.6,0.8,2.4,2.6,'#d3ccbe');box(g,10,12.4,1,2.2,2.4,'#cbc4b5');box(g,8.2,10.6,-1.6,2.2,2.4,'#dad4c7');
    line(g,[-8,0.6,-9,-3],'#6b4a2b',0.5);poly(g,[-9.6,-3.4,-8.2,-3.6,-8.4,-2.6],'#9c9a94');
  }},
  pakhuis:{name:t('bld.pakhuis'),fp:[-2,2,-2,0],sc:1.7,box:[44,38,22,33],draw:(g)=>{
    ground(g,26,13);house(g,{w:24,h:11,d:13,ph:7,wall:'#a4743f',roof:'slate',planks:true});
    door(g,0,9,8.5,'#3b2b1f');crate(g,-3.4,-0.2,2.2);crate(g,1,-0.2,2);sack(g,-0.6,-2.6);
    win(g,-8,-6,2.6,2.4);win(g,8,-6,2.6,2.4);
    barrel(g,-13.6,0.8);barrel(g,-11,1.3);sack(g,-15.8,1.4);crate(g,12.6,1,2.4);crate(g,13.2,-1.4,1.8);
  }},
  kazerne:{name:t('bld.kazerne'),fp:[-2,2,-2,0],sc:1.7,box:[46,38,23,33],pc:true,draw:(g,pc)=>{
    ground(g,26,12);house(g,{w:24,h:10,d:12,ph:6,wall:'#c2b8a6',roof:'slate',stone:true});chimney(g,8.6,-18,4);
    door(g,0,3.6,6,'#4a2f1d');win(g,-7,-5.4,2.4,2.4);win(g,7,-5.4,2.4,2.4);
    for(const x of [-4,4]){g.strokeStyle='#e8d6a0';g.lineWidth=0.4;g.beginPath();g.moveTo(x-1.4,-9.4);g.lineTo(x+1.4,-9.4);g.lineTo(x+1.4,-7.6);
      g.quadraticCurveTo(x+1.2,-6,x,-5.4);g.quadraticCurveTo(x-1.2,-6,x-1.4,-7.6);g.closePath();g.fillStyle=pc;g.fill();g.stroke()}
    line(g,[-15,0.4,-15,-4],'#6b4a2b',0.6);line(g,[-17.5,0.6,-17.5,-4],'#6b4a2b',0.6);line(g,[-17.8,-3.4,-14.6,-3.4],'#6b4a2b',0.5);
    for(let k=0;k<3;k++)line(g,[-17+k*0.9,0.4,-16.6+k*0.9,-5.2],'#c8c8c4',0.4);
    line(g,[14.6,0.5,14.6,-17],'#5a3b22',0.6);circ(g,14.6,-17.4,0.6,'#e5c56c');banner(g,14.6,-15.8,pc,4,5.4);
  }},
  kruidenhuis:{off:1,name:t('bld.kruidenhuis'),fp:[-1,1,-2,0],sc:1.7,box:[36,30,16,26],draw:(g)=>{
    ground(g,18,10);house(g,{w:12,h:8,d:9,ph:5,wall:'#ede2c9',roof:'thatch',timber:true});chimney(g,5,-13.4,3.2);
    door(g,-2.4,2.8,5,'#557a3e');win(g,2.6,-4.6,2.4,2.2);
    for(let r=0;r<3;r++)for(let k=0;k<4;k++){const x=8+k*1.6+r*0.8,y=1.2-r*1.4;ell(g,x,y,0.9,0.4,'#6f5236');circ(g,x,y-0.8,0.8,['#5a9a3e','#7fae4a','#9c6ac0'][r])}
    for(let k=0;k<3;k++){poly(g,[-11+k*1.8,0.8,-10+k*1.8,0.8,-9.8+k*1.8,-0.8,-11.2+k*1.8,-0.8],'#b86a3e',OUT,0.3);circ(g,-10.5+k*1.8,-1.4,0.8,'#5a9a3e')}
  }},
  wachttoren:{name:t('bld.wachttoren'),fp:[-1,1,-1,0],sc:1.7,box:[26,52,10,46],pc:true,draw:(g,pc)=>{
    ground(g,12,8);box(g,-5,5,0,24,8,'#bdb4a3');stoneTex(g,-5,5,0,24,'#bdb4a3');door(g,0,2.8,4.4,'#4a2f1d');
    poly(g,[-0.5,-10,0.5,-10,0.5,-13,-0.5,-13],'#2f241b');poly(g,[-0.5,-17,0.5,-17,0.5,-20,-0.5,-20],'#2f241b');
    box(g,-6.5,6.5,-24,1.6,10,'#7d5a38');for(let x=-6;x<=6.5;x+=2.1)line(g,[x,-25.6,x,-27.8],'#5e4128',0.5);line(g,[-6.5,-27.6,6.5,-27.6],'#5e4128',0.5);
    const ox=5.5,oy=-7,ap=[ox*0.5,-38+oy*0.5];
    poly(g,[6.8,-28,6.8+ox,-28+oy,ap[0],ap[1]],sh(ROOF.slate,0.78),OUT,0.4);poly(g,[-6.8,-28,6.8,-28,ap[0],ap[1]],ROOF.slate,OUT,0.4);
    for(let t=0.25;t<1;t+=0.25)line(g,[-6.8+13.6*t,-28,ap[0],ap[1]],sh(ROOF.slate,0.7),0.3);flag(g,ap[0],ap[1],pc,8);
  }},
  bakkerij:{name:t('bld.bakkerij'),fp:[-1,2,-2,0],sc:1.7,box:[40,32,18,27],smoke:[-11.6,-12],glow:[-12.2,-2.4],draw:(g)=>{
    ground(g,22,10);
    g.strokeStyle=OUT;g.lineWidth=0.4;g.beginPath();g.moveTo(-17,0);g.quadraticCurveTo(-17,-7.5,-12,-7.5);g.quadraticCurveTo(-7,-7.5,-7,0);g.closePath();g.fillStyle='#b8664a';g.fill();g.stroke();
    for(let k=1;k<4;k++)line(g,[-16.6+k*0.3,-k*1.8,-7.4-k*0.3,-k*1.8],'#93503a',0.3);
    g.beginPath();g.moveTo(-14,0);g.lineTo(-14,-2.6);g.arc(-12.2,-2.6,1.8,Math.PI,0);g.lineTo(-10.4,0);g.closePath();g.fillStyle='#2a1a12';g.fill();
    box(g,-12.4,-10.8,-7,3,1.4,'#9c7461');
    house(g,{w:12,h:8,d:9,ph:5,wall:'#efe4cc',roof:'tile',timber:true});door(g,-2.2,2.8,5,'#6e4426');win(g,2.6,-4.6,2.4,2.2);
    poly(g,[7.6,-2.4,14,-2.4,14.8,-3.4,8.4,-3.4],'#a87b48',OUT,0.3);line(g,[8,-2.4,8,0.4],'#7a5228',0.5);line(g,[13.6,-2.4,13.6,0.4],'#7a5228',0.5);
    for(let k=0;k<4;k++)ell(g,9.2+k*1.4,-3.9,0.75,0.5,'#d79a4a');
  }},
  smidse:{name:t('bld.smidse'),fp:[-1,2,-2,0],sc:1.7,box:[40,32,18,27],glow:[-2.6,-3],draw:(g)=>{
    ground(g,22,10);house(g,{w:14,h:9,d:10,ph:5.5,wall:'#b3a996',roof:'slate',stone:true});chimney(g,5.4,-16,5);
    poly(g,[-6,0,1,0,1,-6.4,-6,-6.4],'#2a1d15',OUT,0.4);box(g,-5,-0.4,-0.2,1.8,2,'#7c7268');
    win(g,4,-5,2.4,2.2);
    poly(g,[8.6,-1.6,12.4,-1.6,12,-2.6,9,-2.6],'#4a4c52',OUT,0.3);poly(g,[9.8,0.4,11.2,0.4,11,-1.6,10,-1.6],'#3b3d42');poly(g,[12.4,-2.6,14,-2.3,12.4,-2],'#4a4c52');
    barrel(g,15.4,0.8);for(let k=0;k<3;k++)line(g,[-9.4+k*0.8,0.6,-9.6+k*0.8,-4.4],'#8d8f94',0.45);
  }},
  molen:{name:t('bld.molen'),fp:[-1,1,-2,0],sc:1.7,box:[42,58,21,52],hub:[0.9,-27.8],draw:(g)=>{
    ground(g,16,9);
    poly(g,[-6,0,6,0,4.4,-24,-4.4,-24],'#ece4d2',OUT,0.4);poly(g,[1,0,6,0,4.4,-24,1,-24],'rgba(0,0,0,.1)');
    poly(g,[6,0,8.6,-2.6,7,-25.6,4.4,-24],'#c9c0ad',OUT,0.4);
    stoneTex(g,-5.5,5.5,0,24,'#ece4d2');
    poly(g,[-5.2,-23.4,6.4,-23.4,7.4,-25,-4.2,-25],'#7d5a38',OUT,0.4);
    cone(g,1.2,-24.6,6,8.6,ROOF.slate);
    door(g,0,2.8,4.8,'#5e3920');win(g,0,-12,1.8,2.4);
    for(let k=0;k<3;k++)sack(g,-8+k*1.8,1.2);
  }},
  kolenmijn:{name:t('bld.kolenmijn'),fp:[-1,1,-2,0],sc:1.7,box:[36,30,16,26],ore:1,draw:(g)=>{
    ground(g,16,9);box(g,-9,9,0,9,9,'#8f8778');stoneTex(g,-9,9,0,9,'#8f8778');door(g,0,5,6,'#2a1d15');
    for(let k=0;k<4;k++)ell(g,6+k*1.4,0.2,0.9,0.7,['#222','#b8622f','#e6b422'][1-1])}},
  ijzermijn:{name:t('bld.ijzermijn'),fp:[-1,1,-2,0],sc:1.7,box:[36,30,16,26],ore:2,draw:(g)=>{
    ground(g,16,9);box(g,-9,9,0,9,9,'#8f8778');stoneTex(g,-9,9,0,9,'#8f8778');door(g,0,5,6,'#2a1d15');
    for(let k=0;k<4;k++)ell(g,6+k*1.4,0.2,0.9,0.7,['#222','#b8622f','#e6b422'][2-1])}},
  goudmijn:{name:t('bld.goudmijn'),fp:[-1,1,-2,0],sc:1.7,box:[36,30,16,26],ore:3,draw:(g)=>{
    ground(g,16,9);box(g,-9,9,0,9,9,'#8f8778');stoneTex(g,-9,9,0,9,'#8f8778');door(g,0,5,6,'#2a1d15');
    for(let k=0;k<4;k++)ell(g,6+k*1.4,0.2,0.9,0.7,['#222','#b8622f','#e6b422'][3-1])}},
  ijzersmelterij:{name:t('bld.ijzersmelterij'),fp:[-1,2,-2,0],sc:1.7,box:[40,34,18,29],glow:[-2.6,-3],draw:(g)=>{
    ground(g,22,10);house(g,{w:14,h:9,d:10,ph:5.5,wall:'#c9bfae',roof:'slate',stone:true});chimney(g,5.4,-16,6);
    poly(g,[-6,0,1,0,1,-6.4,-6,-6.4],'#2a1d15',OUT,0.4);for(let k=0;k<3;k++)box(g,8+k*2.2,10+k*2.2,0.6,1,1.4,'#8d8f94')}},
  goudsmelterij:{name:t('bld.goudsmelterij'),fp:[-1,2,-2,0],sc:1.7,box:[40,34,18,29],glow:[-2.6,-3],draw:(g)=>{
    ground(g,22,10);house(g,{w:14,h:9,d:10,ph:5.5,wall:'#c9bfae',roof:'slate',stone:true});chimney(g,5.4,-16,6);
    poly(g,[-6,0,1,0,1,-6.4,-6,-6.4],'#2a1d15',OUT,0.4);for(let k=0;k<3;k++)box(g,8+k*2.2,10+k*2.2,0.6,1,1.4,'#e6b422')}},
  wapensmid:{name:t('bld.wapensmid'),fp:[-1,2,-2,0],sc:1.7,box:[40,32,18,27],glow:[-2.6,-3],draw:(g)=>{
    ground(g,22,10);house(g,{w:14,h:9,d:10,ph:5.5,wall:'#e6d6b4',roof:'slate',timber:true});chimney(g,5.4,-16,5);
    poly(g,[-6,0,1,0,1,-6.4,-6,-6.4],'#2a1d15',OUT,0.4);for(let k=0;k<4;k++)line(g,[9+k*1.3,0.4,9.4+k*1.3,-6],'#c8c8c4',0.5)}},
  boerderij:{name:t('bld.boerderij'),fp:[-2,2,-2,0],sc:1.7,box:[52,34,30,29],draw:(g)=>{
    ground(g,22,11);wheat(g,-27,-12,1.6,5);
    line(g,[-22,-2.5,-22,-8.6],'#6b4a2b',0.5);line(g,[-23.6,-7,-20.4,-7],'#6b4a2b',0.5);circ(g,-22,-9.4,0.9,'#d9b06a');poly(g,[-23.4,-9.6,-20.6,-9.6,-22,-10.8],'#8a5a34');
    poly(g,[-21.6,-7.2,-20.2,-7.2,-20.6,-4,-22,-4],'#7d4b3a');
    house(g,{w:16,h:9,d:11,ph:6,wall:'#efe4cc',roof:'thatch',timber:true});chimney(g,5,-14,3.6);
    door(g,-3.6,3,5.6,'#6e4426');win(g,3,-5,3,2.4);
    for(let x=9;x<16;x+=1.8)line(g,[x,0.8,x,-2.4],'#7a5434',0.45);line(g,[8.6,-1.8,16,-1.8],'#7a5434',0.4);line(g,[8.6,-0.4,16,-0.4],'#7a5434',0.4);
  }},
  /* voedsel (mijlpaal 5b) */
  bonenakker:{name:t('bld.bonenakker'),fp:[-1,1,-2,0],sc:1.7,box:[34,30,16,26],draw:(g)=>{
    ground(g,16,9);house(g,{w:11,h:7,d:8,ph:4.5,wall:'#e8dcc0',roof:'thatch',timber:true});door(g,-2,2.8,4.6,'#6e4426');win(g,2.6,-4,2.2,2);
    for(const x of [-12.5,-10.5,-8.5])for(const y of [1.2,-0.6]){line(g,[x+y*0.5,y,x+y*0.5+0.3,y-5.4],'#7a5434',0.4);
      for(let k=0;k<4;k++)ell(g,x+y*0.5+(k%2?0.6:-0.5),y-1.4-k*1.1,0.7,0.45,k%2?'#5f8a35':'#6fa040')}
    ell(g,8.6,-0.2,1.6,0.7,'#9a7a4a');for(const [x,c] of [[8,'#7a4a2a'],[8.8,'#a8763c'],[9.4,'#5f7a35']])ell(g,x,-0.6,0.4,0.3,c);
  }},
  moestuin:{name:t('bld.moestuin'),fp:[-1,1,-2,0],sc:1.7,box:[34,30,16,26],draw:(g)=>{
    ground(g,16,9);house(g,{w:10,h:6.5,d:8,ph:4,wall:'#d9c7a0',roof:'wood',planks:true});door(g,-1.8,2.6,4.4,'#4d7a3a');
    for(let r=0;r<2;r++){const y=1.4-r*1.8,x0=-14+r*0.9;poly(g,[x0,y,x0+6,y,x0+6.8,y-1.2,x0+0.8,y-1.2],'#7a5a3a');
      for(let k=0;k<3;k++){circ(g,x0+1.4+k*2,y-1,0.85,'#6fa84a');circ(g,x0+1.4+k*2,y-1.1,0.5,'#8cc260')}}
    poly(g,[7,0.4,8.6,0.6,8.4,-0.4],'#e07a26');poly(g,[8.2,0.8,9.8,1,9.6,0],'#e07a26');line(g,[8.6,0.2,9.4,-1.2],'#4f8a35',0.35);
  }},
  plukkershut:{name:t('bld.plukkershut'),fp:[-1,1,-2,0],sc:1.7,box:[34,30,16,26],draw:(g)=>{
    ground(g,16,9);house(g,{w:11,h:7,d:8,ph:4.5,wall:'#efe4cc',roof:'thatch',timber:true});door(g,-2,2.8,4.6,'#7d4b3a');win(g,2.6,-4,2.2,2);
    for(const [x,f] of [[-9.6,'#c8382e'],[-6.8,'#9a6a3a'],[7.6,'#d9a32a']]){ell(g,x,0,1.6,0.8,'#a8763c');poly(g,[x-1.6,0,x+1.6,0,x+1.3,-1.6,x-1.3,-1.6],'#b98a55',OUT,0.3);
      for(const dx of [-0.7,0,0.7])circ(g,x+dx,-1.8,0.55,f)}
  }},
  waterput:{name:t('bld.waterput'),fp:[0,0,0,0],sc:1.7,box:[20,24,10,20],draw:(g)=>{
    ell(g,0.8,0.3,6.5,2.2,'rgba(40,35,10,.25)');
    ell(g,0,-0.4,4.2,1.8,'#8f8678');poly(g,[-4.2,-0.4,4.2,-0.4,4.2,-3.2,-4.2,-3.2],'#a9a39a',OUT,0.35);stoneTex(g,-4.2,4.2,-0.4,2.8,'#a9a39a');
    ell(g,0,-3.2,4.2,1.8,'#bdb3a2');ell(g,0,-3.2,3.2,1.2,'#2c4a6a');ell(g,-0.6,-3.4,1.2,0.4,'rgba(160,200,230,.5)');
    line(g,[-3.8,-3,-3.8,-10.6],'#6b4a2b',0.6);line(g,[3.8,-3,3.8,-10.6],'#6b4a2b',0.6);line(g,[-4.4,-9.4,4.4,-9.4],'#5a3b22',0.5);
    poly(g,[-5.4,-10.2,0,-13.6,5.4,-10.2,4.6,-9.6,0,-12.6,-4.6,-9.6],ROOF.wood,OUT,0.35);
    line(g,[0,-9.4,0,-6.6],'#4a3a2a',0.2);barrel(g,0,-4.4);
  }},
  gaarkeuken:{name:t('bld.gaarkeuken'),fp:[-1,2,-2,0],sc:1.7,box:[40,32,18,27],smoke:[5.4,-19],glow:[10.6,-1.2],draw:(g)=>{
    ground(g,22,10);house(g,{w:14,h:9,d:10,ph:5.5,wall:'#efe4cc',roof:'tile',timber:true});chimney(g,4.4,-15,4.2);
    door(g,-3,3,5.2,'#6e4426');win(g,3,-5,2.6,2.4);
    for(const [x0,y0,x1,y1] of [[8.6,0.6,10.6,-4.4],[12.6,0.6,10.6,-4.4]])line(g,[x0,y0,x1,y1],'#5a3b22',0.45);
    ell(g,10.6,-1.6,2.2,1.4,'#3a3a3c');ell(g,10.6,-2.6,2,0.55,'#b8742e');circ(g,10,-2.7,0.25,'#5f8a35');sack(g,-10,0.8);
  }},
  droogschuur:{name:t('bld.droogschuur'),fp:[-1,2,-2,0],sc:1.7,box:[40,32,20,27],draw:(g)=>{
    ground(g,22,10);const ox=5.5,oy=-7;
    for(const [x,y] of [[-12,0],[6,0],[-12+ox,oy],[6+ox,oy]])line(g,[x,y,x,y-8],'#6b4a2b',0.7);
    for(let r=0;r<3;r++){const y=-1.6-r*2.2;line(g,[-12,y,6,y],'#8a5a34',0.35);
      for(let x=-10.8;x<5;x+=1.6)circ(g,x+r*0.4,y+0.5,0.5,['#c8382e','#9a6a3a','#d9a32a'][(r+((x*2)|0))%3])}
    poly(g,[-13.2,-7.6,7.2,-7.6,7.2+ox,-7.6+oy,-13.2+ox,-7.6+oy],ROOF.thatch,OUT,0.4);roofTex(g,[-13.2,-7.6],[7.2,-7.6],ox,oy,'thatch',ROOF.thatch);
    crate(g,8.4,0.8,2.4);sack(g,12.6,0.8);
  }},
  /* harmonie (mijlpaal 7): getekend tot er geschilderde versies zijn */
  voederplaats:{name:t('bld.voederplaats'),fp:[-1,1,-1,0],sc:1.7,box:[34,28,16,23],draw:(g)=>{
    ground(g,16,8);const ox=4.4,oy=-5.6;
    for(const [x,y] of [[-7,0],[7,0],[-7+ox,oy],[7+ox,oy]])line(g,[x,y,x,y-9],'#6b4a2b',0.65);
    box(g,-5,5,0.4,2.6,3.2,'#8a5a34');poly(g,[-4.4,-2.2,4.4,-2.2,4.4+1.5,-4.1,-4.4+1.5,-4.1],'#e2c873');
    for(let k=0;k<7;k++)circ(g,-3.4+k*1.3+((k*7)%3)*0.2,-3.1+((k*5)%3)*0.3,0.32,'#b48a2c');
    poly(g,[-8.4,-8.6,8.4,-8.6,8.4+ox,-8.6+oy,-8.4+ox,-8.6+oy],ROOF.thatch,OUT,0.4);roofTex(g,[-8.4,-8.6],[8.4,-8.6],ox,oy,'thatch',ROOF.thatch);
    sack(g,-10.4,0.8);sack(g,10.2,0.6);
  }},
  bloemenweide:{name:t('bld.bloemenweide'),fp:[-1,1,-1,0],sc:1.7,box:[38,22,18,17],draw:(g)=>{
    const ox=6,oy=-7.6;poly(g,[-14,1,10,1,10+ox,1+oy,-14+ox,1+oy],'#7fae4a',OUT,0.3);
    let r=7;const R=()=>(r=(r*9301+49297)%233280)/233280,F=['#e8486a','#f2d23a','#ffffff','#b46ad9','#f08a2a'];
    for(let k=0;k<80;k++){const u=R(),v=R(),x=-13.4+u*22.8+v*ox,y=0.6+v*(oy+0.4);line(g,[x,y,x,y-1.2],'#4f7a2a',0.25);circ(g,x,y-1.4,0.55,F[k%5])}
    ell(g,13,-1.4,2.1,2.5,'#d6a84a');for(let k=0;k<4;k++)line(g,[11.1,-0.4-k*1.1,14.9,-0.4-k*1.1],'#a87a2a',0.3);circ(g,13,0.3,0.42,'#3a2a1a');
  }},
  dierenweide:{name:t('bld.dierenweide'),fp:[-2,2,-2,0],sc:1.7,box:[56,34,28,27],draw:(g)=>{
    const x0=-20,y0=1,w=40,ox=10,oy=-12.6,P=[[x0,y0],[x0+w,y0],[x0+w+ox,y0+oy],[x0+ox,y0+oy]];
    poly(g,[P[0][0],P[0][1],P[1][0],P[1][1],P[2][0],P[2][1],P[3][0],P[3][1]],'#6f9e40',OUT,0.3);
    let r=11;const R=()=>(r=(r*9301+49297)%233280)/233280;
    for(let k=0;k<40;k++){const u=R(),v=R(),x=x0+1+u*(w-2)+v*ox,y=y0-0.4+v*(oy+0.8);line(g,[x-0.4,y,x,y-1.3,x+0.4,y],'#4f7a2a',0.3)}
    const edge=(a,b,n)=>{for(let k=0;k<=n;k++){const x=a[0]+(b[0]-a[0])*k/n,y=a[1]+(b[1]-a[1])*k/n;line(g,[x,y,x,y-3.4],'#6b4a2b',0.65)}
      for(const h of [1.3,2.8])line(g,[a[0],a[1]-h,b[0],b[1]-h],'#8a5a34',0.45)};
    edge(P[3],P[2],8);edge(P[0],P[3],3);edge(P[1],P[2],3);
    box(g,4,10,-3.6,1.4,1.8,'#8a5a34');ell(g,7.6,-5.2,2.7,0.5,'#4a7aa8');
    edge(P[0],[-3,y0],3);edge([3,y0],P[1],3);   // voorkant met een opening bij de deur
  }},
};
/* eigen geschilderde afbeeldingen per gebouwtype */
const CUSTOM={};
const BSPR={};
function bldSprite(type,p,pcols){
  const cu=CUSTOM[type];if(cu&&cu.spr)return cu.sprP?cu.sprP[p]:cu.spr;
  const k=type+(BTYPES[type].pc?p:0);
  if(!BSPR[k]){const b=BTYPES[type],[w,h,ax,ay]=b.box;BSPR[k]=spr(w,h,ax,ay,g=>b.draw(g,pcols[p]),b.sc)}return BSPR[k];
}
function hsv(hex){const n=parseInt(hex.slice(1),16),r=(n>>16)/255,g=(n>>8&255)/255,b=(n&255)/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;
  let h=0;if(d){if(mx===r)h=((g-b)/d+6)%6;else if(mx===g)h=(b-r)/d+2;else h=(r-g)/d+4}return [h*60,mx?d/mx:0,mx]}
function hsv2rgb(h,s,v){const f=n=>{const k=(n+h/60)%6;return v*(1-s*Math.max(0,Math.min(k,4-k,1)))};return [f(5)*255,f(3)*255,f(1)*255]}
function tintVariants(bmp){
  const w=bmp.width,h=bmp.height,base=document.createElement('canvas');base.width=w;base.height=h;
  const bg=base.getContext('2d');bg.drawImage(bmp,0,0);let src;try{src=bg.getImageData(0,0,w,h)}catch(e){return null}
  const [,rs,rv]=hsv(PCOL[0]);const out=[base];
  for(let p=1;p<PCOL.length;p++){const [ph,ps,pv]=hsv(PCOL[p]);const d=new ImageData(new Uint8ClampedArray(src.data),w,h),a=d.data;
    for(let i=0;i<a.length;i+=4){if(a[i+3]<10)continue;const r=a[i],g=a[i+1],b=a[i+2],mx=Math.max(r,g,b),mn=Math.min(r,g,b);
      if(mx!==r||mx<60)continue;const s=(mx-mn)/mx;if(s<0.42)continue;const hh=(g-b)/(mx-mn)*60;if(hh>13||hh<-30)continue;
      const c=hsv2rgb(ph,Math.min(1,s*ps/rs),Math.min(1,mx/255*pv/rv));a[i]=c[0];a[i+1]=c[1];a[i+2]=c[2]}
    const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').putImageData(d,0,0);out.push(c)}
  return out}
function customSpr(type){const cu=CUSTOM[type];if(!cu||!cu.bmp)return;
  const m=DEFAULT_IMGS[type]||{};const w=cu.w,h=w*cu.bmp.height/cu.bmp.width;
  const mk=c=>({c,w,h,ax:w*cu.ax,ay:h*cu.ay,custom:true,flag:m.flag,hub:m.hub,sail:m.sail,smoke:m.smoke});
  cu.spr=mk(cu.bmp);
  if(BTYPES[type].pc){if(!cu.tint||cu.tintSrc!==cu.bmp){cu.tint=tintVariants(cu.bmp);cu.tintSrc=cu.bmp}cu.sprP=cu.tint?cu.tint.map(mk):null}else cu.sprP=null}
