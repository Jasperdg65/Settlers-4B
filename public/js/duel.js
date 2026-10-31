"use strict";
/* ---------- Duel: armpje drukken tussen twee krachtpatsers ----------
   Een duel = {a, b (eenheid links en rechts op het scherm), x, y (tafel, tegels), s, v, t, live, wait, ret}.
   s is de duelstand: −1 links wint, 0 gelijk, +1 rechts wint (de duel-sprite toont stand 1 = links wint bijna … 9).
   Verloop: uitdagen (challenge) → beide lopen naar hun stoel links en rechts van de tafel → zodra beide zitten,
   rekent duelStep elke tick → afloop (endDuel): de winnaar loopt terug naar waar hij stond (iets vermoeider), de
   verliezer loopt naar zijn eigen heler en is CFG.duel.outTicks uitgeschakeld. Alle getallen: CFG.duel. */
const DUELS=[];          // vrije plekken worden hergebruikt (null); S.du[i] = index + 1
function duelFree(i){return S.role[i]===2&&!S.ko[i]&&!S.du[i]&&S.ast[i]!==AS.OUT}
/* kracht van eenheid i: niveau, gevoed zijn, harmoniemeter van zijn volk, vermoeidheid */
function strength(i){
  const c=CFG.duel;
  return c.level[S.lvl[i]]*(S.fed[i]?1:c.hungry)*(1+c.harmony*(2*world.harm[S.pl[i]]-1))*(1-c.fatigue*S.fat[i]);
}
/* één tick van een lopend duel: kracht vergelijken, met wat toeval, en de stand bijwerken.
   Geeft −1 (links wint), +1 (rechts wint) of 0 (gaat door). */
function duelStep(d){
  const c=CFG.duel,ka=strength(d.a),kb=strength(d.b);
  d.v=d.v*c.keep+(drand()-0.5)*c.noise;
  d.s=Math.max(-1,Math.min(1,d.s+(kb-ka)/(ka+kb)*c.push+d.v));
  S.fat[d.a]=Math.min(1,S.fat[d.a]+c.tire);S.fat[d.b]=Math.min(1,S.fat[d.b]+c.tire);
  d.t++;
  if(d.s<=-1)return -1;if(d.s>=1)return 1;
  if(d.t>=c.maxTicks)return d.s<=0?-1:1;
  return 0;
}
/* tafelplek bij (X, Y): de tafel en beide stoelen beloopbaar, niet op een andere tafel */
function tableSpot(X,Y){
  const {W,H,walk}=world,c=CFG.duel.seat,ok=(x,y)=>x>1&&y>1&&x<W-2&&y<H-2&&walk[(y|0)*W+(x|0)];
  for(let r=0;r<6;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
    if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
    const x=(X|0)+dx+0.5,y=(Y|0)+dy+0.5;
    if(!ok(x,y)||!ok(x-c,y)||!ok(x+c,y))continue;
    if(DUELS.some(d=>d&&Math.hypot(d.x-x,d.y-y)<1.5))continue;
    return [x,y];
  }
  return null;
}
/* eenheid i daagt j uit; false als dat niet kan */
function challenge(i,j){
  if(i===j||!duelFree(i)||!duelFree(j)||S.pl[i]===S.pl[j])return false;
  const sp=tableSpot((S.x[i]+S.x[j])/2,(S.y[i]+S.y[j])/2);if(!sp)return false;
  const si=S.x[i]-S.y[i]/2,sj=S.x[j]-S.y[j]/2,[a,b]=si<=sj?[i,j]:[j,i];   // wie nu links staat, gaat links zitten
  const d={a,b,x:sp[0],y:sp[1],s:0,v:0,t:0,live:0,wait:0,ret:[[S.x[a],S.y[a]],[S.x[b],S.y[b]]]};
  let k=DUELS.indexOf(null);if(k<0)k=DUELS.push(null)-1;DUELS[k]=d;
  S.du[a]=S.du[b]=k+1;
  armyGo(a,d.x-CFG.duel.seat,d.y,AIM.SEAT);armyGo(b,d.x+CFG.duel.seat,d.y,AIM.SEAT);
  return true;
}
/* gaat niet door (geen route, te lang onderweg): beide blijven staan waar ze zijn */
function cancelDuel(k){
  const d=DUELS[k];if(!d)return;DUELS[k]=null;
  for(const i of [d.a,d.b]){S.du[i]=0;armyStop(i)}
  ARMY.last='Duel gaat niet door: de tafel is niet te bereiken.';
}
function tickDuels(){
  for(let k=0;k<DUELS.length;k++){
    const d=DUELS[k];if(!d)continue;
    if(!d.live){
      if(S.ast[d.a]===AS.SEAT&&S.ast[d.b]===AS.SEAT){
        d.live=1;S.ast[d.a]=S.ast[d.b]=AS.DUEL;
        S.x[d.a]=d.x-CFG.duel.seat;S.x[d.b]=d.x+CFG.duel.seat;S.y[d.a]=S.y[d.b]=d.y;
      }else if(++d.wait>CFG.duel.meetTicks)cancelDuel(k);
      continue;
    }
    const w=duelStep(d);if(w)endDuel(k,w);
  }
}
function endDuel(k,w){
  const d=DUELS[k];DUELS[k]=null;
  const [win,lose]=w<0?[d.a,d.b]:[d.b,d.a],r=d.ret[w<0?0:1];
  S.du[win]=S.du[lose]=0;
  armyGo(win,r[0],r[1],AIM.IDLE);
  S.ko[lose]=1;S.fat[lose]=1;
  const h=healerSpot(lose);armyGo(lose,h[0],h[1],AIM.HEAL);
  const nm=i=>`speler ${S.pl[i]+1} (${LVLNAME[S.lvl[i]]})`;
  ARMY.last=`${nm(win)} wint van ${nm(lose)} na ${(d.t/CFG.ticksPerSec).toFixed(1).replace('.',',')} s`;
  ARMY.won[S.pl[win]]++;
}
/* plek naast de dichtstbijzijnde eigen heler; zonder heler de deur van de eigen burcht */
function healerSpot(i){
  let best=-1,bd=Infinity;
  for(let j=0;j<S.n;j++)if(S.role[j]===4&&S.pl[j]===S.pl[i]){const dd=Math.hypot(S.x[j]-S.x[i],S.y[j]-S.y[i]);if(dd<bd){bd=dd;best=j}}
  if(best<0){const b=world.blds.find(o=>o.type==='burcht'&&o.p===S.pl[i]);return b?[b.x+0.5,b.y+1.5]:[S.x[i],S.y[i]]}
  const a=i*2.39996;return freeSpot(S.x[best]+Math.cos(a)*0.9,S.y[best]+Math.sin(a)*0.6);
}
