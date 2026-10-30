"use strict";
/* ---------- Natuur ---------- */
function crown(g,blobs,dark,mid,light,hi){
  for(const b of blobs)circ(g,b[0],b[1],b[2]+0.75,dark);
  for(const b of blobs)circ(g,b[0],b[1],b[2],mid);
  for(const b of blobs)circ(g,b[0]-b[2]*0.25,b[1]-b[2]*0.3,b[2]*0.62,light);
  for(const b of blobs)circ(g,b[0]-b[2]*0.42,b[1]-b[2]*0.48,b[2]*0.22,hi);
}
function trunk(g,w,h,col,lt){poly(g,[-w,0.3,-w*0.55,-h,w*0.55,-h,w,0.3],col,OUT,0.4);line(g,[-w*0.45,-0.4,-w*0.25,-h+0.6],lt,0.5)}
const shadow=(g,rx)=>ell(g,2.4,0.3,rx,rx*0.32,'rgba(40,35,10,.3)');
const TREES=[];
function makeTrees(){
  for(let sp=0;sp<5;sp++)for(let v=0;v<3;v++){
    const r=mulberry32(sp*131+v*17+5),j=a=>(r()-0.5)*a;let s;
    if(sp===0)s=spr(28,34,14,31,g=>{shadow(g,8.5);trunk(g,1.9,12,'#6b4a2b','#94704a');
      const b=[[-5,-15,5.2],[5,-15,5],[0,-20,6],[-3.5,-23,4.6],[3.6,-23,4.6],[0,-13,5],[-7,-19,3.8],[7,-19,3.8]].map(q=>[q[0]+j(1.8),q[1]+j(1.6),q[2]+j(0.8)]);
      crown(g,b,'#34531f','#5a8a33','#7ea544','#b6cf63');if(v===2)for(let k=0;k<5;k++)circ(g,j(10),-19+j(8),0.55,'#c2412d')});
    if(sp===1)s=spr(22,36,11,33,g=>{shadow(g,6);poly(g,[-1.1,0.3,-0.7,-16,0.7,-16,1.1,0.3],'#ece6d8',OUT,0.4);
      for(let k=0;k<6;k++){const y=-1.5-k*2.5-r()*0.8;line(g,[-0.9+r()*0.6,y,0.2+r()*0.6,y-0.3],'#3b3530',0.45)}
      const b=[[-3.5,-17,3.6],[3.4,-18,3.5],[0,-23,4.2],[0,-15.5,3.4],[-2,-27,3],[2.5,-26,3]].map(q=>[q[0]+j(1.4),q[1]+j(1.4),q[2]+j(0.6)]);
      crown(g,b,'#4b6a26','#86a340','#a9c159','#d9e48a')});
    if(sp===2)s=spr(22,38,11,35,g=>{shadow(g,6.5);poly(g,[-1.1,0.3,-0.8,-6,0.8,-6,1.1,0.3],'#5a3b22',OUT,0.4);
      const hgt=5.4+j(0.8);
      for(let k=0;k<5;k++){const base=-4.5-k*hgt*0.95,hw=8.2-k*1.55+j(0.5),top=base-hgt-2;
        poly(g,[-hw-0.6,base+0.5,hw+0.6,base+0.5,0,top-0.6],'#1d3524');poly(g,[-hw,base,hw,base,0,top],'#2f5636');
        poly(g,[-hw,base,-hw*0.15,base,0,top],'#3f6e43');line(g,[-hw*0.7,base-0.4,-hw*0.2,base-1.6],'#5a8a52',0.4)}});
    if(sp===3)s=spr(30,30,15,27,g=>{shadow(g,9);trunk(g,2.2,9,'#5d4128','#836042'); // beuk: breed en laag
      const b=[[-7,-12,4.4],[7,-12,4.4],[-3.5,-15,5],[3.5,-15.5,5],[0,-19,5],[-9,-14.5,3.2],[9,-14.5,3.2],[0,-11,4.5]].map(q=>[q[0]+j(1.4),q[1]+j(1.2),q[2]+j(0.6)]);
      crown(g,b,'#3d5420','#6c8c34','#94ad4a','#c9d473')});
    if(sp===4)s=spr(28,30,14,27,g=>{shadow(g,7); // appelboom
      g.fillStyle='#6f5136';g.beginPath();g.moveTo(-1.6,0.3);g.bezierCurveTo(-0.4,-4,-2.2,-6,-0.4,-9);g.lineTo(1.2,-8.8);g.bezierCurveTo(0,-6,2.2,-3,1.7,0.3);g.fill();
      const b=[[-5,-12,4],[5,-12.5,4],[0,-15,4.8],[-2.5,-18,3.6],[3,-18,3.6]].map(q=>[q[0]+j(1.4),q[1]+j(1.2),q[2]+j(0.5)]);
      crown(g,b,'#3e5a22','#679037','#8db04b','#c3d66f');
      for(let k=0;k<7;k++)circ(g,j(13),-14+j(7),0.6,v===1?'#e6b93a':'#c8402e')});
    TREES.push(s,flipped(s));
  }
}
const BUSHES=[],STONES=[];
function makeNature(){
  for(let v=0;v<3;v++){const r=mulberry32(900+v),j=a=>(r()-0.5)*a;
    const s=spr(18,14,9,11,g=>{ell(g,1.5,0.2,6.5,1.8,'rgba(40,35,10,.25)');
      const b=[[-3.5,-3,3],[3.2,-3,3],[0,-5,3.6],[-1.5,-2.2,2.8],[2,-2,2.6]].map(q=>[q[0]+j(1.2),q[1]+j(0.8),q[2]+j(0.5)]);
      crown(g,b,'#36531f','#5c8a34','#7fa647','#b0cd62');
      if(v===1)for(let k=0;k<7;k++)circ(g,j(9),-3.5+j(4),0.55,'#c53b3b');
      if(v===2)for(let k=0;k<7;k++){const x=j(9),y=-4+j(4);circ(g,x,y,0.6,'#fbf6ea');circ(g,x,y,0.22,'#f1c437')}});
    BUSHES.push(s,flipped(s));
  }
  for(let v=0;v<4;v++){const r=mulberry32(700+v),j=a=>(r()-0.5)*a,big=v===3;
    const s=spr(18,14,9,11,g=>{const k=big?1.5:1;ell(g,1.2,0.4,5*k,1.6*k,'rgba(30,25,15,.26)');
      poly(g,[-4*k,0,-4.4*k,-2.2*k+j(1),-2*k,-4.2*k+j(1),1.5*k,-4.6*k+j(1),4.2*k,-2.4*k,4*k,0],'#958e82',OUT,0.4);
      poly(g,[-4.4*k,-2.2*k,-2*k,-4.2*k,1.5*k,-4.6*k,0.6*k,-2.4*k,-2.2*k,-1.6*k],'#c2baa9');
      poly(g,[1.5*k,-4.6*k,4.2*k,-2.4*k,4*k,0,1*k,0,0.6*k,-2.4*k],'#7a7368');
      if(v%2)circ(g,-1.8*k,-3.4*k,0.8,'rgba(120,150,60,.75)');
      if(!big&&v!==2)poly(g,[3.6,0.2,3.8,-1.6,6,-2,6.8,0.2],'#a0998c',OUT,0.35)});
    STONES.push(s,flipped(s));
  }
}

/* ---------- Dieren ---------- */
const ANIM=[[],[],[]];
function makeAnimals(){
  for(let f=0;f<2;f++){
    const deer=spr(20,22,8,20,g=>{ell(g,0.5,0,6,1.5,'rgba(30,25,10,.25)');const lg=f?1.3:-1.3;
      line(g,[-3.6,-6,-3.6-lg,0],'#5c3a1f',0.9);line(g,[-2.4,-6,-2.4+lg,0],'#4a2f19',0.9);line(g,[2.8,-6,2.8+lg,0],'#5c3a1f',0.9);line(g,[3.9,-6,3.9-lg,0],'#4a2f19',0.9);
      g.strokeStyle=OUT;g.lineWidth=0.4;g.beginPath();g.ellipse(0,-7.6,5.6,3,0,0,6.2832);g.fillStyle='#9b6537';g.fill();g.stroke();
      ell(g,0.3,-6.3,4,1.3,'#d1a676');for(let k=0;k<5;k++)circ(g,-3+k*1.4,-8.8+(k%2)*0.7,0.35,'#f3e3c4');
      poly(g,[3.1,-9,5.3,-13.4,6.9,-12.5,5.3,-7.4],'#9b6537',OUT,0.35);ell(g,6.8,-13.5,2.3,1.5,'#a46b3b',0.15);
      circ(g,8.9,-13.1,0.5,'#2a1b10');circ(g,7.1,-14,0.38,'#1d130b');ell(g,5.2,-14.8,1.2,0.5,'#8c5a30',-0.6);
      g.strokeStyle='#e9dab5';g.lineWidth=0.55;g.beginPath();g.moveTo(6,-14.7);g.lineTo(5.4,-17.4);g.lineTo(4.4,-18.6);g.moveTo(5.6,-16.4);g.lineTo(6.9,-17.6);
      g.moveTo(7,-14.7);g.lineTo(7.6,-17.2);g.lineTo(8.6,-18.2);g.stroke();circ(g,-5.6,-8.6,0.95,'#fbf6ec')});
    const rab=spr(10,10,4,8,g=>{const up=f?-1.4:0;ell(g,0.3,0,2.8,0.8,'rgba(30,25,10,.22)');g.translate(0,up);
      ell(g,0,-2.4,2.7,1.9,'#8b7864');ell(g,2.3,-3.9,1.5,1.3,'#93806b');ell(g,1.7,-6,0.5,1.5,'#8b7864',-0.2);ell(g,2.6,-6,0.5,1.5,'#9a876f',0.15);
      circ(g,3.1,-4.1,0.32,'#1d130b');circ(g,-2.6,-2.6,0.8,'#f6efe2')});
    const duck=spr(11,8,5,5,g=>{const b=f?0.45:0;g.strokeStyle='rgba(255,255,255,.55)';g.lineWidth=0.35;g.beginPath();g.ellipse(0,0.2,4.2+b*2,1.1,0,0,6.2832);g.stroke();
      g.translate(0,b);ell(g,0,-1.4,3.2,1.6,'#d9d3c4');ell(g,-0.6,-1.7,2,0.9,'#8b6b4a');circ(g,2.5,-3.3,1.3,'#2f6e3e');poly(g,[3.6,-3.4,5,-3,3.6,-2.7],'#e8a33a');
      circ(g,2.8,-3.6,0.28,'#111');poly(g,[-3.2,-1.6,-4.4,-2.4,-3.6,-1],'#3b3b3b')});
    ANIM[0][f*2]=deer;ANIM[0][f*2+1]=flipped(deer);ANIM[1][f*2]=rab;ANIM[1][f*2+1]=flipped(rab);ANIM[2][f*2]=duck;ANIM[2][f*2+1]=flipped(duck);
  }
}
