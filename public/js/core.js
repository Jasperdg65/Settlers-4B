"use strict";
const $=id=>document.getElementById(id);
/* ======================================================================
   Sprites: eigen ontwerp, procedureel getekend. Gebouwen kunnen per type
   vervangen worden door eigen geschilderde afbeeldingen (zie CUSTOM).
   ====================================================================== */
const SS=3;
function spr(w,h,ax,ay,fn,sc=1){
  const c=document.createElement('canvas');c.width=Math.ceil(w*sc*SS);c.height=Math.ceil(h*sc*SS);
  const g=c.getContext('2d');g.scale(SS*sc,SS*sc);g.translate(ax,ay);g.lineJoin='round';g.lineCap='round';fn(g);
  return {c,w:w*sc,h:h*sc,ax:ax*sc,ay:ay*sc};
}
function flipped(s){
  const c=document.createElement('canvas');c.width=s.c.width;c.height=s.c.height;
  const g=c.getContext('2d');g.translate(c.width,0);g.scale(-1,1);g.drawImage(s.c,0,0);
  return {c,w:s.w,h:s.h,ax:s.w-s.ax,ay:s.ay};
}
const sh=(hex,f)=>{const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;
  if(f<1){r*=f;g*=f;b*=f}else{r+=(255-r)*(f-1);g+=(255-g)*(f-1);b+=(255-b)*(f-1)}return `rgb(${r|0},${g|0},${b|0})`};
const circ=(g,x,y,r,col)=>{g.fillStyle=col;g.beginPath();g.arc(x,y,r,0,6.2832);g.fill()};
const ell=(g,x,y,rx,ry,col,rot=0)=>{g.fillStyle=col;g.beginPath();g.ellipse(x,y,rx,ry,rot,0,6.2832);g.fill()};
const line=(g,pts,col,lw)=>{g.strokeStyle=col;g.lineWidth=lw;g.beginPath();g.moveTo(pts[0],pts[1]);for(let k=2;k<pts.length;k+=2)g.lineTo(pts[k],pts[k+1]);g.stroke()};
const OUT='rgba(52,32,18,.6)';
function poly(g,p,fill,stroke,lw){g.beginPath();g.moveTo(p[0],p[1]);for(let k=2;k<p.length;k+=2)g.lineTo(p[k],p[k+1]);g.closePath();
  if(fill){g.fillStyle=fill;g.fill()}if(stroke){g.strokeStyle=stroke;g.lineWidth=lw||0.4;g.stroke()}}
