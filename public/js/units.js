"use strict";
/* ---------- Inwoners (middeleeuws, eigen ontwerp) ----------
   varianten: 0 = man met baard, 1 = man zonder baard, 2 = vrouw          */
const ROLES=[
  {name:'Drager',bld:['pakhuis','houthakker','zagerij','steenhouwer','bakkerij','molen','boerderij','burcht','kolenmijn','ijzermijn','goudmijn','ijzersmelterij','goudsmelterij'],share:0.6,vars:3},
  {name:'Bouwer',bld:['woonhuis','pakhuis','zagerij','smidse','wapensmid','bosbouwer','houthakker','kazerne'],share:0.14,vars:2},
  {name:'Soldaat',bld:['kazerne','wachttoren','burcht'],share:0.12,vars:1},
  {name:'Boogschutter',bld:['wachttoren','kazerne'],share:0.08,vars:1},
  {name:'Heler',bld:['kruidenhuis','burcht','woonhuis'],share:0.06,vars:3}];
const SKIN='#f0c9a0',HAIRS=['#4a2e1a','#6b3f22','#2f2118','#8a5a2e'];
/* pose (alleen economie): 1 = vrije drager met lege handen, 2 = drager met beide handen vooruit (het goed tekent loop.js erop) */
function drawUnit(g,role,v,pc,f,hairCol,pose,look){
  const sw=[0,1.3,0,-1.3][f],bob=(f%2)?-0.45:0,fem=v===2;
  ell(g,0.4,0.1,3.4,1.15,'rgba(30,25,10,.3)');
  g.save();g.translate(0,bob);
  if(role===2)line(g,[-2.8,-4.6,-4.9,-1.6],'#d8d8d2',0.7);
  if(role===3){poly(g,[-3.8,-9.6,-2.4,-10.1,-1.2,-3.8,-2.6,-3.3],'#7a4e2a',OUT,0.35);for(let k=0;k<3;k++)line(g,[-3.4+k*0.5,-9.9,-3.8+k*0.5,-11.3],'#f2efe6',0.45)}
  if(role===4)poly(g,[-2.6,-8.8,-0.5,-9.4,-1,-7,-3,-6.6],'#7c6a52'); // kap
  g.restore();
  // benen of rok
  const trou=['#56603d','#6b5136','#4c4f58','#5d6a3a','#6a5a48'][role];
  if(fem||role===4){const sk=fem?(role===4?'#7d6a50':'#4f6386'):'#7d6a50';
    g.fillStyle='#4a3020';g.fillRect(-1.6+sw*0.5,-0.9,1.7,0.9);g.fillRect(0.1-sw*0.5,-0.9,1.7,0.9);
    poly(g,[-3.1,-0.7,3.1,-0.7,2.2,-5.6,-2.2,-5.6],sk,OUT,0.4);
    if(fem&&role!==4)poly(g,[-1.6,-1.1,1.9,-1.1,1.5,-5.4,-1.3,-5.4],'#f1e9d6',OUT,0.3);
  }else{
    line(g,[-0.8,-3.8+bob,-0.8+sw,-0.7],trou,1.3);line(g,[0.8,-3.8+bob,0.8-sw,-0.7],sh(trou,0.85),1.3);
    g.fillStyle='#4a3020';g.fillRect(-1.6+sw,-1.2,1.9,1.2);g.fillRect(-0.1-sw,-1.2,1.9,1.2);
  }
  g.save();g.translate(0,bob);
  // romp
  const shirt='#efe3c8';
  if(role===2){poly(g,[-2.7,-3.4,2.7,-3.4,2.2,-8.8,-2.2,-8.8],'#a7a7a4',OUT,0.4);
    poly(g,[-2.1,-3.2,2.1,-3.2,1.8,-8.9,-1.8,-8.9],pc,OUT,0.4);poly(g,[-0.5,-4.2,0.5,-4.2,0.5,-8.4,-0.5,-8.4],'#f4efe4');
    line(g,[-2.5,-5.4,2.5,-5.4],'#5a3b22',0.7)}
  else if(role===4)poly(g,[-2.5,-4.8,2.5,-4.8,2.1,-8.9,-2.1,-8.9],'#7d6a50',OUT,0.4);
  else{poly(g,[-2.6,-3.6,2.6,-3.6,2.1,-8.8,-2.1,-8.8],role===3?'#577040':shirt,OUT,0.4);
    if(!fem&&role===0)poly(g,[-2.5,-3.8,-0.6,-3.8,-0.7,-8.7,-2.1,-8.7],'#6e4a2c');
    if(!fem&&role===0)poly(g,[2.5,-3.8,0.6,-3.8,0.7,-8.7,2.1,-8.7],'#6e4a2c');
    if(role===1)poly(g,[-1.9,-3.6,1.9,-3.6,1.6,-7.6,-1.6,-7.6],'#8a5a34',OUT,0.3);
    if(fem)poly(g,[-2.2,-5.4,2.2,-5.4,1.9,-8.4,-1.9,-8.4],'#4f6386',OUT,0.3);
    line(g,[-2.4,-5.3,2.4,-5.3],role===4?'#c9b68c':'#5a3b22',0.6)}
  if(role===4)line(g,[-2.3,-5.6,2.3,-5.6],'#d9c99e',0.5);
  poly(g,[0.4,-3.6,2.6,-3.6,2.1,-8.8,0.4,-8.8],'rgba(0,0,0,.1)');
  circ(g,-2.5,-6.7,0.95,SKIN);
  // hoofd
  g.strokeStyle=OUT;g.lineWidth=0.4;g.beginPath();g.arc(0.3,-11,2.8,0,6.2832);g.fillStyle=SKIN;g.fill();g.stroke();
  const hair=role===4&&v===0?'#cfc7b8':hairCol;
  g.beginPath();g.arc(0.3,-11.3,2.9,Math.PI*0.95,Math.PI*1.95);g.fillStyle=hair;g.fill();circ(g,-2,-10.6,1.25,hair);
  if(fem){circ(g,-2.4,-9.6,1.1,hair)}
  if(v===0&&!fem){g.beginPath();g.moveTo(-0.6,-10.2);g.quadraticCurveTo(0.6,-6.9,2.9,-9.1);g.lineTo(3.1,-10.1);g.quadraticCurveTo(1.6,-9.2,-0.4,-10.4);g.fillStyle=hair;g.fill()}
  circ(g,1.4,-11,0.42,'#2a1b10');circ(g,2.55,-10.9,0.42,'#2a1b10');
  line(g,[1.2,-11.8,1.8,-12],sh(hair,0.8),0.35);circ(g,2.3,-9.8,0.6,'rgba(220,110,90,.45)');
  if(!(v===0&&!fem))line(g,[1.6,-9.3,2.5,-9.4],'rgba(120,60,40,.6)',0.35);
  // hoofddeksel
  if(role===0&&!fem){g.beginPath();g.arc(0.3,-11.6,2.95,Math.PI*1.02,Math.PI*1.98);g.fillStyle=pc;g.fill();poly(g,[-2.6,-11.4,-4,-12.4,-3.6,-10.6],pc)}
  if(fem&&role!==4){g.beginPath();g.arc(0.3,-11.5,3,Math.PI*0.98,Math.PI*2.02);g.fillStyle='#f4efe2';g.fill();g.strokeStyle=OUT;g.lineWidth=0.3;g.stroke();
    poly(g,[-2.6,-11.2,-3.8,-9.8,-2,-10.4],'#f4efe2');line(g,[-2.7,-11,3.3,-11],pc,0.6)}
  if(role===1){g.beginPath();g.arc(0.3,-11.7,2.95,Math.PI,2*Math.PI);g.fillStyle=pc;g.fill();line(g,[-2.7,-11.6,3.6,-11.6],sh(pc,0.7),0.6)}
  if(role===2){g.beginPath();g.arc(0.3,-11.6,3.15,Math.PI,2*Math.PI);g.fillStyle='#b9bcc2';g.fill();g.strokeStyle=OUT;g.stroke();
    line(g,[-3.4,-11.5,4,-11.5],'#8d9097',0.8);poly(g,[2.2,-11.4,2.8,-11.4,2.6,-9.4],'#9da0a6');line(g,[-0.6,-14.4,1.2,-14.5],'rgba(255,255,255,.5)',0.4)}
  if(role===3){g.beginPath();g.moveTo(-3,-9.4);g.quadraticCurveTo(-3.6,-14.8,0.6,-14.4);g.quadraticCurveTo(3.6,-14,3.4,-11.4);g.lineTo(2.2,-12.2);
    g.quadraticCurveTo(0,-13,-1.4,-11);g.lineTo(-1.6,-8.8);g.closePath();g.fillStyle=pc;g.fill();g.strokeStyle=OUT;g.lineWidth=0.35;g.stroke()}
  if(role===4&&v!==0){g.beginPath();g.moveTo(-3,-8.8);g.quadraticCurveTo(-3.8,-14.6,0.4,-14.4);g.quadraticCurveTo(3.4,-14.2,3.4,-11.6);
    g.quadraticCurveTo(1,-13.2,-1.2,-11.2);g.lineTo(-1.4,-8.8);g.closePath();g.fillStyle='#8b7558';g.fill();g.strokeStyle=OUT;g.lineWidth=0.35;g.stroke()}
  // voorkant
  if(pose===1){line(g,[1.6,-7.7,2.9,-5.4],shirt,1.25);circ(g,3,-5.2,0.78,SKIN)}
  else if(pose===2){line(g,[1.4,-7.9,1.2,-6.5],shirt,1.1);circ(g,1.1,-6.2,0.8,SKIN);circ(g,4.8,-6.2,0.8,SKIN)}
  else if(role===0&&!fem){poly(g,[0.6,-8.2,5,-8.2,5,-4.4,0.6,-4.4],'#a8773f',OUT,0.35);line(g,[0.6,-6.3,5,-6.3],'#7a5228',0.35);
    line(g,[2.8,-8.2,2.8,-4.4],'#7a5228',0.3);circ(g,1,-6.2,0.8,SKIN);circ(g,4.8,-6.2,0.8,SKIN)}
  else if(role===0){ell(g,2.8,-6,2.6,1.6,'#a7783d');g.strokeStyle='#7a5228';g.lineWidth=0.3;g.beginPath();g.ellipse(2.8,-6,2.6,1.6,0,0,6.283);g.stroke();
    circ(g,1.9,-6.9,0.9,'#d9a052');circ(g,3.5,-7,0.9,'#c98f45');circ(g,2.7,-7.6,0.8,'#e3ad5f');circ(g,0.6,-6,0.75,SKIN)}
  else if(role===2){g.strokeStyle='#e8d6a0';g.lineWidth=0.45;g.beginPath();g.moveTo(1.2,-9.6);g.lineTo(5,-9.6);g.lineTo(5,-6.2);g.quadraticCurveTo(4.6,-3.2,3.1,-2.4);
    g.quadraticCurveTo(1.6,-3.2,1.2,-6.2);g.closePath();g.fillStyle=pc;g.fill();g.stroke();
    poly(g,[2.7,-9.6,3.5,-9.6,3.5,-2.8,2.7,-2.8],'rgba(255,255,255,.75)');poly(g,[1.2,-6.6,5,-6.6,5,-5.8,1.2,-5.8],'rgba(255,255,255,.75)')}
  else{line(g,[1.6,-7.7,2.9,-5.4],role===4?'#7d6a50':role===3?'#577040':shirt,1.25);circ(g,3,-5.2,0.78,SKIN);
    if(role===1){line(g,[2.9,-5,1.9,-10.2],'#7a5434',0.6);poly(g,[0.8,-10.6,3.2,-10.4,3.1,-9.4,0.8,-9.6],'#8d8f94',OUT,0.3)}
    if(role===3){g.strokeStyle='#7c5226';g.lineWidth=0.8;g.beginPath();g.arc(1.4,-7,5.6,-1.15,1.15);g.stroke();
      line(g,[1.4+5.6*Math.cos(-1.15),-7+5.6*Math.sin(-1.15),1.4+5.6*Math.cos(1.15),-7+5.6*Math.sin(1.15)],'#efe9da',0.25)}
    if(role===4){line(g,[3.1,-0.4,3.5,-14.2],'#7a5434',0.6);for(let k=0;k<3;k++)ell(g,3.5+(k-1)*0.9,-14.8+(k%2)*0.4,0.5,1,'#5aa043',(k-1)*0.6);
      poly(g,[-3.8,-5.6,-1.8,-5.6,-1.6,-3.2,-3.8,-3.2],'#8a6a40',OUT,0.3);line(g,[-3.4,-5.3,-2.2,-3.6],'#5aa043',0.5)}
  }
  if(look)drawLook(g,look,pc,fem);
  g.restore();
}
/* beroepen (economie): hoed, schort en wat ze in de hand houden (gereedschap of een kenmerkend goed, zie GDRAW).
   Basis is de vrije drager met lege handen (pose 1). hat: cap, wide (brede rand), tall (bakkersmuts), helm (met lampje) */
const JOBLOOK={
  graver:{hat:'#7a5a3a',kind:'cap',item:'schop'},
  bouwer:{hat:'#c9a55a',kind:'wide',apron:'#8a5a34',item:'hamer'},
  houthakker:{hat:'#2f5d32',kind:'cap',apron:'#6b4a2c',item:'bijl'},
  bosbouwer:{hat:'#6f9a3e',kind:'wide',apron:'#4f7a36',item:'schop'},
  zager:{hat:'#8a6a40',kind:'cap',apron:'#c9b68c',item:'zaag'},
  steenhouwer:{hat:'#9a9a94',kind:'cap',apron:'#7c7c78',item:'houweel'},
  mijnwerker:{hat:'#3a3a3c',kind:'helm',item:'houweel'},
  boer:{hat:'#e0c070',kind:'wide',item:'zeis'},
  molenaar:{hat:'#f2ede1',kind:'cap',apron:'#e8e2d2',item:'meel'},
  bakker:{hat:'#ffffff',kind:'tall',apron:'#f4f0e6',item:'brood'},
  smelter:{hat:'#5a4030',kind:'cap',apron:'#6b4a30',item:'kolen'},
  smid:{hat:'#3a2a20',kind:'cap',apron:'#5a3b22',item:'ijzer'},
};
function drawLook(g,L,pc,fem){
  if(L.apron){poly(g,[-1.7,-3.2,2.1,-3.2,1.8,-7.9,-1.4,-7.9],L.apron,OUT,0.3);line(g,[-1.4,-7.9,0.2,-8.8,1.8,-7.9],sh(L.apron,0.7),0.3)}
  const h=L.hat;
  if(L.kind==='tall'){poly(g,[-2.2,-12.2,2.8,-12.2,3.3,-16.4,-2.7,-16.4],h,OUT,0.3);line(g,[-2.6,-12.4,3.2,-12.4],pc,0.6)}
  else{g.beginPath();g.arc(0.3,-11.8,3,Math.PI,2*Math.PI);g.fillStyle=h;g.fill();g.strokeStyle=OUT;g.lineWidth=0.3;g.stroke();
    const w=L.kind==='wide'?[-4.2,4.9]:[-3,3.9];line(g,[w[0],-11.7,w[1],-11.7],sh(h,0.75),0.8);line(g,[-2.6,-12.5,3.2,-12.5],pc,0.5);
    if(L.kind==='helm')circ(g,2.6,-13.2,0.75,'#ffd25a')}
  /* in de hand (3, −5,2): gereedschap schuin omhoog, een goed ervoor */
  const tool=['schop','hamer','bijl','zaag','houweel','zeis'].includes(L.item);
  g.save();if(tool){g.translate(3.2,-5.4);g.rotate(-1.15);g.scale(0.95,0.95);g.translate(0.9,-0.3)}else{g.translate(4.4,-5.6);g.scale(0.62,0.62)}
  GDRAW[L.item](g);g.restore();circ(g,3,-5.2,0.78,SKIN);
}
const JSPR=[];
/* sprite van beroep job (index in CFG.jobs), variant v, speler p, frame fr = f*2+dir; pas gemaakt als hij nodig is */
function jobSprite(job,v,p,fr){
  const k=((job*3+v)*8+p)*8+fr;if(JSPR[k])return JSPR[k];
  const f=fr>>1,L=JOBLOOK[CFG.jobs[job].k],s=spr(16,22,7,20,g=>drawUnit(g,0,v,PCOL[p],f,HAIRS[(v+p)%4],1,L),1.2);
  JSPR[k-(fr&1)]=s;JSPR[k-(fr&1)+1]=flipped(s);return JSPR[k];
}
const UNITS=[],UNITC=[]; // UNITS[role][var][p][f*2+dir]
function makeUnits(pcols){
  for(let r=0;r<5;r++){UNITS[r]=[];for(let v=0;v<3;v++){UNITS[r][v]=[];for(let p=0;p<8;p++){UNITS[r][v][p]=[];
    const hair=HAIRS[(r*3+v+p)%4];
    for(let f=0;f<4;f++){const s=spr(16,20,7,18,g=>drawUnit(g,r,r===2||r===3?1:(r===1&&v===2?0:v),pcols[p],f,hair),1.2);
      UNITS[r][v][p][f*2]=s;UNITS[r][v][p][f*2+1]=flipped(s)}}}}
  /* dragers (economie): UNITC[pose-1][var][speler][f*2+dir] */
  for(let q=0;q<2;q++){UNITC[q]=[];for(let v=0;v<3;v++){UNITC[q][v]=[];for(let p=0;p<8;p++){UNITC[q][v][p]=[];const hair=HAIRS[(v+p)%4];
    for(let f=0;f<4;f++){const s=spr(16,20,7,18,g=>drawUnit(g,0,v,pcols[p],f,hair,q+1),1.2);UNITC[q][v][p][f*2]=s;UNITC[q][v][p][f*2+1]=flipped(s)}}}}
}
