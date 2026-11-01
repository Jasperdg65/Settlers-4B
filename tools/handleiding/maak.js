/* Maakt public/handleiding/index.html uit tools/handleiding/bron.html. Opnieuw draaien na elke wijziging in config of manifest:
     node tools/handleiding/maak.js
   In bron.html:
     {{uitdrukking}}           getal of tekst uit het spel, bv. {{CFG.build.cost.zagerij[0]}} of {{sec(CFG.prod.zagerij.ticks)}}
     <!--gen:soort args-->     tabel of schema: kosten, keten, startvoorraad, beroepen, dorp, gebouwen, goederen
     <!--shot:naam|tekst-->    schermafbeelding img/naam.webp (gemaakt door schermen.js) met bijschrift
     [[komt:wat]]              label "Komt eraan"; alle 'wat' komen in de README tussen <!-- komt:begin --> en <!-- komt:end --> */
const fs=require('fs'),path=require('path');
const {laadSpel,ROOT,PUB}=require('./spel.js');
const SP=laadSpel(),{CFG,GOODS,GI,BTYPES,manifest}=SP;
const OUT=path.join(PUB,'handleiding'),IMG=path.join(OUT,'img');

/* ---------- kleine hulpjes, ook bruikbaar in {{...}} ---------- */
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const nl=n=>Number(n).toLocaleString('nl-NL');
const sec=t=>{const s=t/CFG.ticksPerSec;if(s<90)return `${nl(Math.round(s*10)/10)} seconden`;const m=s/60;return `${nl(Math.round(m*10)/10)} ${m===1?'minuut':'minuten'}`};
const naam=t=>BTYPES[t].name.replace(/ \(.*\)/,'');
const goed=k=>GOODS[GI[k]].n;
const meer=(n,een,veel)=>`${nl(n)} ${n===1?een:veel}`;
const kosten=t=>{const c=CFG.build.cost[t];return `${meer(c[0],'plank','planken')} en ${meer(c[1],'steen','stenen')}`};
const lijst=(a,en='en')=>a.length<2?a.join(''):a.slice(0,-1).join(', ')+` ${en} `+a[a.length-1];
const bldImg=t=>manifest.buildings[t]?`../assets/buildings/${t}.webp`:null;
/* gebouwplaatje: op het scherm de transparante webp, in print een kleine jpg op wit (scheelt megabytes in de pdf) */
const DRUK=path.join(IMG,'druk');
function drukJpg(t){const src=path.join(PUB,'assets/buildings',t+'.webp'),dst=path.join(DRUK,t+'.jpg');
  if(!fs.existsSync(dst)||fs.statSync(dst).mtimeMs<fs.statSync(src).mtimeMs){fs.mkdirSync(DRUK,{recursive:true});
    require('child_process').execFileSync('php',['-r',`$i=imagecreatefromwebp($argv[1]);$w=360;$h=(int)round(imagesy($i)*$w/imagesx($i));$o=imagecreatetruecolor($w,$h);
      imagefill($o,0,0,imagecolorallocate($o,255,255,255));imagecopyresampled($o,$i,0,0,0,0,$w,$h,imagesx($i),imagesy($i));imagejpeg($o,$argv[2],84);`,src,dst])}
  return `img/druk/${t}.jpg`}
const bldPic=t=>{const s=bldImg(t);return s?`<img src="${s}" alt="${esc(naam(t))}" loading="lazy">`:''};
/* elk <img> van een gebouw krijgt een tweeling voor print (de css toont er steeds één) */
const drukTweeling=h=>h.replace(/<img\b[^>]*\bsrc="\.\.\/assets\/buildings\/(\w+)\.webp"[^>]*>/g,(m,t)=>{
  const cls=c=>/class="/.test(m)?m.replace(/class="/,`class="${c} `):m.replace('<img',`<img class="${c}"`);
  let d=cls('druk').replace(/src="[^"]*"/,`src="${drukJpg(t)}"`);if(!/loading=/.test(d))d=d.replace('<img','<img loading="lazy"');
  return cls('scherm')+d});
const goedImg=k=>fs.existsSync(path.join(IMG,'goed',k+'.png'))?`img/goed/${k}.png`:null;
const ikoon=k=>{const s=goedImg(k);return s?`<img class="gi" src="${s}" alt="${esc(goed(k))}" loading="lazy">`:''};
const jobVan=t=>CFG.jobs.find(j=>(j.bld||[]).includes(t));
const recipes=t=>{const pc=CFG.prod[t];if(!pc)return [];if(pc.recipes)return Object.entries(pc.recipes).map(([k,i])=>({in:i,out:{[k]:1}}));
  if(pc.mine)return [{in:{[CFG.mineFood[t]]:1},out:pc.out}];if(pc.in)return [{in:pc.in,out:pc.out}];return []};
const VILLAGE=SP.get('VILLAGE');
const KOMT=[];
const helpers={CFG,GOODS,GI,BTYPES,sec,nl,naam,goed,kosten,lijst,meer,VILLAGE};
const reken=e=>Function(...Object.keys(helpers),'return ('+e+')')(...Object.values(helpers));

/* ---------- wat een gebouw doet (uit de config) ---------- */
const CROP=['','graan','peulvruchten','groente'];
function functie(t){
  const pc=CFG.prod[t],r=CFG.territory[t];
  if(t==='burcht')return `Hoofdkwartier en grote opslag (${CFG.slots.burcht} stapelplekken). Geeft gebied in een straal van ${r} tegels.`;
  if(t==='pakhuis')return `Extra opslag met ${CFG.slots.pakhuis} stapelplekken, handig ver van de burcht.`;
  if(t==='woonhuis')return `Krijgt tot ${CFG.pop.house} nieuwe bewoners, elk voor één maaltijd: ${lijst(CFG.pop.food.map(k=>goed(k).toLowerCase()),'of')}.`;
  if(t==='wachttoren')return `Geeft gebied in een straal van ${r} tegels, zolang er iemand in woont.`;
  if(t==='kazerne')return 'Traint kolonisten tot krachtpatsers. [[komt:Krachthal die krachtpatsers traint (mijlpaal 6c)]]';
  if(!pc)return '';
  const o=pc.out&&typeof pc.out==='string'?goed(pc.out).toLowerCase():'';
  if(pc.gather==='tree')return `Hakt bomen binnen ${pc.area} tegels en maakt er ${o} van. Laat appelbomen staan voor de plukker.`;
  if(pc.gather==='stone')return `Hakt steen uit steenblokken binnen ${pc.area} tegels. Een blok is na ${CFG.nature.stoneUnits} stuks op.`;
  if(pc.gather==='plant')return `Plant boompjes binnen ${pc.area} tegels; na ${sec(CFG.nature.grow)} zijn het volwassen bomen.`;
  if(pc.gather==='farm')return `Zaait en oogst ${CROP[pc.crop]} op akkers binnen ${pc.area} tegels (rijp na ${sec(CFG.nature.crop[pc.crop])}).`;
  if(pc.gather==='pick')return `Plukt ${goed(pc.out).toLowerCase()} en ${goed(pc.out2).toLowerCase()} van bomen en struiken binnen ${pc.area} tegels.`;
  if(pc.mine)return `Haalt ${lijst(Object.keys(pc.out).map(k=>goed(k).toLowerCase()))} uit de berg (binnen ${pc.area} tegels); de mijnwerker eet er ${goed(CFG.mineFood[t]).toLowerCase()} bij.`;
  if(pc.recipes)return `Maakt ${lijst(Object.keys(pc.recipes).map(k=>goed(k).toLowerCase()))}, telkens in ${sec(pc.ticks)}.`;
  const io=x=>lijst(Object.entries(x).map(([k,n])=>`${n>1?n+' × ':''}${goed(k).toLowerCase()}`));
  return Object.keys(pc.in).length?`Maakt van ${io(pc.in)} ${io(pc.out)}, in ${sec(pc.ticks)}.`:`Maakt ${io(pc.out)}, elke ${sec(pc.ticks)}.`;
}
const werker=t=>{const j=jobVan(t);if(!j)return t==='woonhuis'?'bewoners':'–';return j.n+(j.tool?` <span class="tool">${ikoon(j.tool)}${goed(j.tool).toLowerCase()}</span>`:'')};
const bldCel=t=>`<span class="bcel">${bldPic(t)}<b>${esc(naam(t))}</b></span>`;

/* ---------- generatoren ---------- */
const GEN={
  kosten(args){
    return `<table class="tabel"><thead><tr><th>Gebouw</th><th class="n">Planken</th><th class="n">Stenen</th><th>Wie werkt er</th><th>Wat het doet</th></tr></thead><tbody>`+
      args.map(t=>{const c=CFG.build.cost[t]||['–','–'];return `<tr><td>${bldCel(t)}</td><td class="n">${c[0]}</td><td class="n">${c[1]}</td><td>${werker(t)}</td><td>${functie(t)}</td></tr>`}).join('')+'</tbody></table>';
  },
  startvoorraad(){
    const f=CFG.startFactor;
    return `<table class="tabel smal"><thead><tr><th>Goed</th><th class="n">Weinig</th><th class="n">Normaal</th><th class="n">Veel</th></tr></thead><tbody>`+
      Object.entries(CFG.startStock).map(([k,n])=>`<tr><td>${ikoon(k)}${goed(k)}</td><td class="n">${Math.round(n*f.weinig)}</td><td class="n">${Math.round(n*f.normaal)}</td><td class="n">${Math.round(n*f.veel)}</td></tr>`).join('')+'</tbody></table>';
  },
  beroepen(){
    return `<table class="tabel"><thead><tr><th>Beroep</th><th>Gereedschap</th><th>Werkt in</th></tr></thead><tbody>`+
      CFG.jobs.slice(1).map(j=>`<tr><td><b>${j.n}</b></td><td>${j.tool?ikoon(j.tool)+goed(j.tool):'<span class="zacht">geen</span>'}</td><td>${j.bld?lijst(j.bld.map(naam)):(j.k==='graver'?'bouwplaatsen (egaliseren)':'bouwplaatsen (bouwen)')}</td></tr>`).join('')+'</tbody></table>';
  },
  dorp(){
    const n={};for(const t of VILLAGE)n[t]=(n[t]||0)+1;for(const t of ['kolenmijn','ijzermijn','goudmijn'])n[t]=1;
    return '<ul class="dorp">'+['burcht',...Object.keys(n)].map(t=>`<li>${bldPic(t)}<span>${n[t]>1?n[t]+' × ':''}${esc(naam(t))}</span></li>`).join('')+'</ul>';
  },
  gebouwen(){
    const all=Object.keys(BTYPES).filter(t=>!BTYPES[t].off);
    return `<div class="kaarten">`+all.map(t=>{const c=CFG.build.cost[t];
      return `<article class="gkaart">${bldPic(t)}<h4>${esc(BTYPES[t].name)}</h4>
        <p class="kost">${c?`${ikoon('plank')}${c[0]} &nbsp; ${ikoon('steen')}${c[1]}`:'kan niet gebouwd worden'}</p>
        <p class="wie">${werker(t)}</p><p>${functie(t)}</p></article>`}).join('')+'</div>';
  },
  goederen(){
    const maak={},nodig={};const add=(m,k,v)=>{(m[k]=m[k]||new Set()).add(v)};
    for(const t in CFG.prod){const pc=CFG.prod[t];if(typeof pc!=='object')continue;
      for(const k of [pc.out,pc.out2].filter(x=>typeof x==='string'))add(maak,k,naam(t));
      for(const r of recipes(t)){for(const k in r.out)add(maak,k,naam(t));for(const k in r.in)add(nodig,k,naam(t))}}
    for(const k of CFG.pop.food)add(nodig,k,'Woonhuis');
    add(nodig,'plank','bouwen');add(nodig,'steen','bouwen');
    for(const j of CFG.jobs)if(j.tool)add(nodig,j.tool,'gereedschap van de '+j.n.toLowerCase());
    for(const k of Object.keys(CFG.prod.wapensmid.recipes))add(nodig,k,'krachtpatsers [[komt:Uitrusting (helm, schild, polsband) voor krachtpatsers]]');
    let gr='',h='';
    GOODS.forEach(g=>{if(g.gr!==gr){if(gr)h+='</tbody></table>';gr=g.gr;h+=`<h4>${esc(gr)}</h4><table class="tabel"><thead><tr><th>Goed</th><th>Gemaakt door</th><th>Nodig voor</th></tr></thead><tbody>`}
      h+=`<tr><td>${ikoon(g.k)}<b>${esc(g.n)}</b></td><td>${maak[g.k]?lijst([...maak[g.k]]):'<span class="zacht">startvoorraad</span>'}</td><td>${nodig[g.k]?lijst([...nodig[g.k]]):'<span class="zacht">–</span>'}</td></tr>`});
    return h+'</tbody></table>';
  },
  /* productieketen als SVG: knooppunten zijn de gebouwplaatjes, pijlen dragen het goed */
  keten(args){
    const N=new Map(),E=[];
    const node=(id,o)=>{if(!N.has(id))N.set(id,{id,...o});return id};
    const NAT={tree:['bos','Bos','../assets/nature/eik0.webp','boom'],stone:['steenblok','Steenblokken','../assets/nature/rots1.webp','steenblok'],
      pick:['struik','Bomen en struiken','../assets/nature/bes.webp','vruchten'],farm:['akker','Akkers',null,'oogst']};
    for(const t of args)node(t,{label:naam(t),img:bldImg(t)});
    for(const t of args){const pc=CFG.prod[t]||{};
      if(pc.gather==='plant'){node('bos',{label:'Bos',img:NAT.tree[2],nat:1});E.push([t,'bos','plant boompjes',null,1])}
      else if(NAT[pc.gather]){const [id,l,img,lab]=NAT[pc.gather];node(id,{label:l,img,nat:1});E.push([id,t,lab,null])}
      if(pc.mine){node('erts'+pc.mine,{label:'Ertsader',img:'../assets/nature/rots0.webp',nat:1});E.push(['erts'+pc.mine,t,'erts',null])}
      const outs=[pc.out,pc.out2].filter(x=>typeof x==='string');for(const r of recipes(t))outs.push(...Object.keys(r.out));
      for(const g of new Set(outs)){const users=args.filter(u=>recipes(u).some(r=>g in r.in));
        if(users.length)for(const u of users)E.push([t,u,goed(g),g]);
        else{node('voorraad',{label:'Voorraad',img:bldImg('burcht'),store:1});E.push([t,'voorraad',goed(g),g])}}}
    /* lagen: langste pad vanaf de bronnen; de voorraad altijd rechts */
    /* planten (bosbouwer → bos) telt niet mee voor de lagen: de planter staat in dezelfde kolom, boven het bos */
    const L=new Map([...N.keys()].map(k=>[k,0]));
    for(let it=0;it<N.size;it++)for(const [a,b,,,pl] of E)if(!pl&&L.get(b)<L.get(a)+1)L.set(b,L.get(a)+1);
    for(const [a,b,,,pl] of E)if(pl)L.set(a,L.get(b));
    const maxL=Math.max(...L.values());if(N.has('voorraad'))L.set('voorraad',Math.max(...[...E].filter(e=>e[1]==='voorraad').map(e=>L.get(e[0])))+1);
    const cols=[];for(const [k,l] of L)(cols[l]=cols[l]||[]).push(k);
    const CW=270,RH=150,W0=160,H0=118,rows=Math.max(...cols.map(c=>c?c.length:0));
    const pos=new Map();cols.forEach((c,l)=>{if(!c)return;
      if(l>0)c.sort((a,b)=>{const avg=k=>{const p=E.filter(e=>e[1]===k&&pos.has(e[0])).map(e=>pos.get(e[0])[1]);return p.length?p.reduce((s,v)=>s+v,0)/p.length:0};return avg(a)-avg(b)});
      const off=(rows-c.length)*RH/2;c.forEach((k,i)=>pos.set(k,[l*CW+CW/2,off+i*RH+RH/2]))});
    const W=cols.length*CW,H=rows*RH;let s='';
    for(const [a,b,lab,g] of E){const [x1,y1]=pos.get(a),[x2,y2]=pos.get(b);let lx,ly;
      if(x1===x2){const sy=y1<y2?y1+H0/2:y1-H0/2,ey=y1<y2?y2-H0/2:y2+H0/2;   // zelfde kolom: recht omhoog of omlaag
        s+=`<path class="pijl" d="M${x1},${sy} L${x2},${ey}" marker-end="url(#kop)"/>`;lx=x1;ly=(sy+ey)/2}
      else{const sx=x1+W0/2-4,ex=x2-W0/2+4,g=CW-W0+8;
        if(x2-x1<=CW){const mx=(sx+ex)/2;s+=`<path class="pijl" d="M${sx},${y1} C${mx},${y1} ${mx},${y2} ${ex},${y2}" marker-end="url(#kop)"/>`;lx=mx;ly=(y1+y2)/2}
        else{/* slaat kolommen over: route op een hoogte waar in de tussenliggende kolommen geen gebouw staat */
          const tussen=[...pos.values()].filter(([x])=>x>x1&&x<x2),vrij=y=>tussen.every(([,ny])=>Math.abs(ny-y)>H0/2+14);
          const yr=[y1,y2,...tussen.map(([,ny])=>ny+H0/2+18),...tussen.map(([,ny])=>ny-H0/2-18)].find(vrij)??y1;
          const a=sx+g/2,b=ex-g/2;
          s+=`<path class="pijl" d="M${sx},${y1} C${a},${y1} ${a},${yr} ${sx+g},${yr} L${ex-g},${yr} C${b},${yr} ${b},${y2} ${ex},${y2}" marker-end="url(#kop)"/>`;
          lx=a;ly=(y1+yr)/2}}
      const tw=lab.length*7.6+(g&&goedImg(g)?26:12);
      s+=`<g class="etiket"><rect x="${lx-tw/2}" y="${ly-12}" width="${tw}" height="24" rx="12"/>${g&&goedImg(g)?`<image href="${goedImg(g)}" x="${lx-tw/2+4}" y="${ly-9}" width="18" height="18"/>`:''}<text x="${lx-tw/2+(g&&goedImg(g)?24:6)}" y="${ly+5}">${esc(lab)}</text></g>`}
    for(const [k,n] of N){const [x,y]=pos.get(k);
      s+=`<g class="knoop${n.nat?' natuur':''}${n.store?' opslag':''}"><title>${esc(n.label)}</title><rect x="${x-W0/2}" y="${y-H0/2}" width="${W0}" height="${H0}" rx="12"/>`+
        (n.img?`<image href="${n.img}" x="${x-W0/2+10}" y="${y-H0/2+6}" width="${W0-20}" height="${H0-36}" preserveAspectRatio="xMidYMax meet"/>`:'')+
        `<text x="${x}" y="${y+H0/2-11}" text-anchor="middle">${esc(n.label)}</text></g>`}
    return `<figure class="keten"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Productieketen: ${esc(args.map(naam).join(', '))}">`+
      `<defs><marker id="kop" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="kop"/></marker></defs>${s}</svg></figure>`;
  },
};

/* ---------- bron verwerken ---------- */
let html=fs.readFileSync(path.join(__dirname,'bron.html'),'utf8');
html=html.replace(/<!--gen:(\w+)\s*([^>]*?)-->/g,(m,k,a)=>{if(!GEN[k])throw new Error('onbekende generator '+k);return GEN[k](a.trim()?a.trim().split(/\s+/):[])});
html=html.replace(/<!--shot:([\w-]+)\|([^>]*?)-->/g,(m,k,t)=>fs.existsSync(path.join(IMG,k+'.jpg'))
  ?`<figure class="shot"><a href="img/${k}.jpg" target="_blank" title="Groot bekijken"><img src="img/${k}.jpg?v=${fs.statSync(path.join(IMG,k+'.jpg')).mtimeMs/1000|0}" alt="${esc(t)}" loading="lazy"></a><figcaption>${t}</figcaption></figure>`
  :`<figure class="shot leeg"><div>Schermafbeelding volgt: ${esc(k)}</div><figcaption>${t}</figcaption></figure>`);
html=html.replace(/\{\{([^}]+)\}\}/g,(m,e)=>esc(reken(e)));
html=html.replace(/\[\[komt:([^\]]+)\]\]/g,(m,t)=>{if(!KOMT.includes(t))KOMT.push(t);return `<span class="komt" title="${esc(t)}">Komt eraan</span>`});

/* inhoudsopgave uit h2 (hoofdstukken) en h3 (paragrafen) */
const slug=s=>s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/<[^>]+>/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const toc=[];let h2=null;
html=html.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/g,(m,l,attr,txt)=>{
  let id=(attr.match(/id="([^"]+)"/)||[])[1];if(!id){id=slug(txt);attr+=` id="${id}"`}
  const t=txt.replace(/<span class="komt"[^>]*>.*?<\/span>/g,'').replace(/<[^>]+>/g,'').trim();
  if(l==='2'){h2={id,t,sub:[],bijl:/bijlage/.test(attr)};if(h2.bijl){h2.letter='ABCDEFGH'[toc.filter(c=>c.bijl).length];attr+=` data-letter="${h2.letter}"`}toc.push(h2)}else if(h2)h2.sub.push({id,t});
  return `<h${l}${attr}>${txt}</h${l}>`});
const tocHtml='<ol class="toc">'+toc.map(c=>`<li${c.bijl?` class="bijl"`:''}><a href="#${c.id}"${c.bijl?` data-letter="${c.letter}"`:''}>${esc(c.t)}</a>`+(c.sub.length?'<ol>'+c.sub.map(s=>`<li><a href="#${s.id}">${esc(s.t)}</a></li>`).join('')+'</ol>':'')+'</li>').join('')+'</ol>';

const shell=fs.readFileSync(path.join(__dirname,'pagina.html'),'utf8');
const datum=new Date().toLocaleDateString('nl-NL',{day:'numeric',month:'long',year:'numeric'});
const v=f=>fs.statSync(path.join(OUT,f)).mtimeMs/1000|0;
const out=shell.replace('{{INHOUD}}',()=>html).replace(/\{\{TOC\}\}/g,()=>tocHtml).replace('{{DATUM}}',datum)
  .replace('{{VCSS}}',v('handleiding.css')).replace('{{VJS}}',v('handleiding.js'));
fs.writeFileSync(path.join(OUT,'index.html'),drukTweeling(out));

/* "Komt eraan"-lijst in de README */
const RM=path.join(ROOT,'README.md');let rm=fs.readFileSync(RM,'utf8');
const blok='<!-- komt:begin -->\n'+KOMT.map(t=>'- '+t).join('\n')+'\n<!-- komt:end -->';
if(rm.includes('<!-- komt:begin -->'))rm=rm.replace(/<!-- komt:begin -->[\s\S]*?<!-- komt:end -->/,blok);
fs.writeFileSync(RM,rm);
console.log(`handleiding: ${toc.length} hoofdstukken, ${KOMT.length} × komt eraan, ${(out.length/1024).toFixed(0)} kB`);
