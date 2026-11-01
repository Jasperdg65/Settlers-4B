/* Maakt de handleiding per taal: tools/handleiding/<taal>/bron.html + <taal>/teksten.js → public/handleiding/index.html (nl)
   of public/handleiding/<taal>/index.html. Opnieuw draaien na elke wijziging in config, manifest of tekst:
     node tools/handleiding/maak.js [taal ...]        (zonder taal: alle talen met een bron.html)
   In bron.html:
     {{uitdrukking}}           waarde uit het spel, bv. {{CFG.build.cost.zagerij[0]}} of {{sec(CFG.prod.zagerij.ticks)}}
     <!--gen:soort args-->     tabel of schema: kosten, keten, startvoorraad, beroepen, dorp, gebouwen, goederen
     <!--shot:naam|tekst-->    schermafbeelding img/<taal>/naam.jpg (gemaakt door schermen.js) met bijschrift
     [[komt:wat]]              label "Komt eraan"; de Nederlandse 'wat' komen in de README tussen <!-- komt:begin --> en <!-- komt:end -->
   Namen (gebouwen, goederen, beroepen) komen uit public/lang/<taal>.js, dus spel en handleiding gebruiken dezelfde woorden. */
const fs=require('fs'),path=require('path');
const {laadSpel,ROOT,PUB}=require('./spel.js');
const OUT0=path.join(PUB,'handleiding'),IMG=path.join(OUT0,'img');
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const TALEN=fs.readdirSync(__dirname).filter(d=>fs.existsSync(path.join(__dirname,d,'bron.html'))).sort((a,b)=>a==='nl'?-1:b==='nl'?1:a<b?-1:1);

/* gebouwplaatje in print: kleine jpg op wit (taalneutraal, gedeeld) */
const DRUK=path.join(IMG,'druk');
function drukJpg(t,map='buildings'){const src=path.join(PUB,'assets',map,t+'.webp'),dst=path.join(DRUK,(map==='buildings'?'':map+'-')+t+'.jpg');
  if(!fs.existsSync(dst)||fs.statSync(dst).mtimeMs<fs.statSync(src).mtimeMs){fs.mkdirSync(DRUK,{recursive:true});
    require('child_process').execFileSync('php',['-r',`$i=imagecreatefromwebp($argv[1]);$w=360;$h=(int)round(imagesy($i)*$w/imagesx($i));$o=imagecreatetruecolor($w,$h);
      imagefill($o,0,0,imagecolorallocate($o,255,255,255));imagecopyresampled($o,$i,0,0,0,0,$w,$h,imagesx($i),imagesy($i));imagejpeg($o,$argv[2],84);`,src,dst])}
  return `img/druk/${path.basename(dst)}`}
/* elk <img> van een gebouw krijgt een tweeling voor print (de css toont er steeds één) */
const drukTweeling=h=>h.replace(/<img\b[^>]*\bsrc="\.\.\/assets\/buildings\/(\w+)\.webp"[^>]*>/g,(m,t)=>{
  const cls=c=>/class="/.test(m)?m.replace(/class="/,`class="${c} `):m.replace('<img',`<img class="${c}"`);
  let d=cls('druk').replace(/src="[^"]*"/,`src="${drukJpg(t)}"`);if(!/loading=/.test(d))d=d.replace('<img','<img loading="lazy"');
  return cls('scherm')+d});
const goedImg=k=>fs.existsSync(path.join(IMG,'goed',k+'.png'))?`img/goed/${k}.png`:null;

function maakTaal(taal){
  const SP=laadSpel(taal),{CFG,GOODS,GI,BTYPES,manifest}=SP;
  const getal=n=>Number(n).toLocaleString(SP.get('LOC()'));
  const naam=t=>BTYPES[t].name.replace(/ \(.*\)/,'');
  const goed=k=>GOODS[GI[k]].n;
  let TX;const lijst=(a,w='en')=>a.length<2?a.join(''):a.slice(0,-1).join(', ')+` ${TX[w]} `+a[a.length-1];
  const VILLAGE=SP.get('VILLAGE');
  TX=require(path.join(__dirname,taal,'teksten.js'))({CFG,naam,goed,lijst,getal});
  const KOMT=[];
  const helpers={CFG,GOODS,GI,BTYPES,naam,goed,lijst,getal,VILLAGE,sec:TX.sec,kosten:TX.kosten,meer:TX.meer};
  const reken=e=>Function(...Object.keys(helpers),'return ('+e+')')(...Object.values(helpers));
  const bldImg=t=>manifest.buildings[t]?`../assets/buildings/${t}.webp`:null;
  const bldPic=t=>{const s=bldImg(t);return s?`<img src="${s}" alt="${esc(naam(t))}" loading="lazy">`:''};
  const ikoon=k=>{const s=goedImg(k);return s?`<img class="gi" src="${s}" alt="${esc(goed(k))}" loading="lazy">`:''};
  const jobVan=t=>CFG.jobs.find(j=>(j.bld||[]).includes(t));
  const recipes=t=>{const pc=CFG.prod[t];if(!pc)return [];if(pc.recipes)return Object.entries(pc.recipes).map(([k,i])=>({in:i,out:{[k]:1}}));
    if(pc.mine)return [{in:{[CFG.mineFood[t]]:1},out:pc.out}];if(pc.in)return [{in:pc.in,out:pc.out}];return []};
  const werker=t=>{const j=jobVan(t);if(!j)return t==='woonhuis'?TX.bewoners:'–';return j.n+(j.tool?` <span class="tool">${ikoon(j.tool)}${goed(j.tool).toLowerCase()}</span>`:'')};
  const bldCel=t=>`<span class="bcel">${bldPic(t)}<b>${esc(naam(t))}</b></span>`;
  const K=TX.kop;

  /* ---------- generatoren ---------- */
  const GEN={
    kosten(args){
      return `<table class="tabel"><thead><tr><th>${K.gebouw}</th><th class="n">${K.planken}</th><th class="n">${K.stenen}</th><th>${K.wie}</th><th>${K.wat}</th></tr></thead><tbody>`+
        args.map(t=>{const c=CFG.build.cost[t]||['–','–'];return `<tr><td>${bldCel(t)}</td><td class="n">${c[0]}</td><td class="n">${c[1]}</td><td>${werker(t)}</td><td>${TX.functie(t)}</td></tr>`}).join('')+'</tbody></table>';
    },
    startvoorraad(){
      const f=CFG.startFactor;
      return `<table class="tabel smal"><thead><tr><th>${K.goed}</th><th class="n">${K.weinig}</th><th class="n">${K.normaal}</th><th class="n">${K.veel}</th></tr></thead><tbody>`+
        Object.entries(CFG.startStock).map(([k,n])=>`<tr><td>${ikoon(k)}${goed(k)}</td><td class="n">${Math.round(n*f.weinig)}</td><td class="n">${Math.round(n*f.normaal)}</td><td class="n">${Math.round(n*f.veel)}</td></tr>`).join('')+'</tbody></table>';
    },
    beroepen(){
      return `<table class="tabel"><thead><tr><th>${K.beroep}</th><th>${K.gereedschap}</th><th>${K.werktIn}</th></tr></thead><tbody>`+
        CFG.jobs.slice(1).map(j=>`<tr><td><b>${j.n}</b></td><td>${j.tool?ikoon(j.tool)+goed(j.tool):`<span class="zacht">${TX.geen}</span>`}</td><td>${j.bld?lijst(j.bld.map(naam)):(j.k==='graver'?TX.graverIn:TX.bouwerIn)}</td></tr>`).join('')+'</tbody></table>';
    },
    dorp(){
      const n={};for(const t of VILLAGE)n[t]=(n[t]||0)+1;for(const t of ['kolenmijn','ijzermijn','goudmijn'])n[t]=1;
      return '<ul class="dorp">'+['burcht',...Object.keys(n)].map(t=>`<li>${bldPic(t)}<span>${n[t]>1?n[t]+' × ':''}${esc(naam(t))}</span></li>`).join('')+'</ul>';
    },
    gebouwen(){
      const all=Object.keys(BTYPES).filter(t=>!BTYPES[t].off);
      return `<div class="kaarten">`+all.map(t=>{const c=CFG.build.cost[t];
        return `<article class="gkaart">${bldPic(t)}<h4>${esc(BTYPES[t].name)}</h4>
          <p class="kost">${c?`${ikoon('plank')}${c[0]} &nbsp; ${ikoon('steen')}${c[1]}`:TX.nietBouwbaar}</p>
          <p class="wie">${werker(t)}</p><p>${TX.functie(t)}</p></article>`}).join('')+'</div>';
    },
    goederen(){
      const maak={},nodig={};const add=(m,k,v)=>{(m[k]=m[k]||new Set()).add(v)};
      for(const t in CFG.prod){const pc=CFG.prod[t];if(typeof pc!=='object')continue;
        for(const k of [pc.out,pc.out2].filter(x=>typeof x==='string'))add(maak,k,naam(t));
        for(const r of recipes(t)){for(const k in r.out)add(maak,k,naam(t));if(!pc.mine)for(const k in r.in)add(nodig,k,naam(t))}}
      for(const k of CFG.pop.food)add(nodig,k,naam('woonhuis'));
      for(const t in CFG.mineFood)if(BTYPES[t])for(const k of CFG.prod.mineMeals)add(nodig,k,naam(t)+(CFG.mineFood[t]===k?` (${TX.lievelingskost})`:''));
      add(nodig,'plank',TX.bouwen);add(nodig,'steen',TX.bouwen);
      for(const j of CFG.jobs)if(j.tool)add(nodig,j.tool,TX.gereedschapVan(j.n));
      for(const k of Object.keys(CFG.prod.wapensmid.recipes))add(nodig,k,TX.krachtpatsers);
      let gr='',h='';
      GOODS.forEach(g=>{if(g.gr!==gr){if(gr)h+='</tbody></table>';gr=g.gr;h+=`<h4>${esc(g.grn)}</h4><table class="tabel"><thead><tr><th>${K.goed}</th><th>${K.gemaakt}</th><th>${K.nodig}</th></tr></thead><tbody>`}
        h+=`<tr><td>${ikoon(g.k)}<b>${esc(g.n)}</b></td><td>${maak[g.k]?lijst([...maak[g.k]]):`<span class="zacht">${TX.startvoorraad}</span>`}</td><td>${nodig[g.k]?lijst([...nodig[g.k]]):'<span class="zacht">–</span>'}</td></tr>`});
      return h+'</tbody></table>';
    },
    lievelingskost(){
      return `<table class="tabel smal"><thead><tr><th>${K.mijn}</th><th>${K.liefst}</th><th>${K.ookGoed}</th></tr></thead><tbody>`+
        Object.keys(CFG.mineFood).filter(t=>BTYPES[t]).map(t=>`<tr><td>${bldCel(t)}</td><td>${ikoon(CFG.mineFood[t])}<b>${goed(CFG.mineFood[t])}</b> <span class="zacht">(${TX.rondes(CFG.prod.mineFav)})</span></td><td>`+
          CFG.prod.mineMeals.filter(k=>k!==CFG.mineFood[t]).map(k=>ikoon(k)+goed(k)).join(', ')+` <span class="zacht">(${TX.rondes(1)})</span></td></tr>`).join('')+'</tbody></table>';
    },
    dieren(){
      return `<table class="tabel smal"><thead><tr><th>${K.dier}</th><th>${K.waar}</th><th class="n">${K.hoogstens}</th></tr></thead><tbody>`+
        CFG.animals.map(a=>`<tr><td><b>${esc(SP.get(`t('dier.${a.k}')`))}</b></td><td>${a.water?TX.opWater:TX.opLand}</td><td class="n">${getal(a.max)}</td></tr>`).join('')+'</tbody></table>';
    },
    /* productieketen als SVG: knooppunten zijn de gebouwplaatjes, pijlen dragen het goed */
    keten(args){
      const N=new Map(),E=[],KT=TX.keten;
      const node=(id,o)=>{if(!N.has(id))N.set(id,{id,...o});return id};
      const NAT={tree:['bos',KT.bos,'../assets/nature/eik0.webp',KT.boom],stone:['steenblok',KT.steenblokken,'../assets/nature/rots1.webp',KT.steenblok],
        pick:['struik',KT.struik,'../assets/nature/bes.webp',KT.vruchten],farm:['akker',KT.akker,null,KT.oogst]};
      for(const t of args)node(t,{label:naam(t),img:bldImg(t)});
      for(const t of args){const pc=CFG.prod[t]||{};
        if(pc.gather==='plant'){node('bos',{label:KT.bos,img:NAT.tree[2],nat:1});E.push([t,'bos',KT.plant,null,1])}
        else if(pc.gather==='farm'){const g=pc.out;node('akker'+pc.crop,{label:KT.akker,img:goedImg(g),nat:1,klein:1});E.push(['akker'+pc.crop,t,KT.oogst,null])}
        else if(NAT[pc.gather]){const [id,l,img,lab]=NAT[pc.gather];node(id,{label:l,img,nat:1});E.push([id,t,lab,null])}
        if(pc.mine){node('erts'+pc.mine,{label:KT.ertsader,img:'../assets/nature/rots0.webp',nat:1});E.push(['erts'+pc.mine,t,KT.erts,null])}
        const outs=[pc.out,pc.out2].filter(x=>typeof x==='string');for(const r of recipes(t))outs.push(...Object.keys(r.out));
        for(const g of new Set(outs)){const users=args.filter(u=>recipes(u).some(r=>g in r.in));
          if(users.length)for(const u of users)E.push([t,u,goed(g),g]);
          else{node('voorraad',{label:KT.voorraad,img:bldImg('burcht'),store:1});E.push([t,'voorraad',goed(g),g])}}}
      /* meerdere goederen over dezelfde pijl: één label, de groepsnaam als ze uit één groep komen (zes stuks gereedschap) */
      {const per=new Map();for(const e of E){const k=e[0]+'>'+e[1];if(!per.has(k))per.set(k,[]);per.get(k).push(e)}
        E.length=0;for(const l of per.values()){if(l.length===1||!l[0][3]){E.push(...l);continue}
          const gs=l.map(e=>GOODS[GI[e[3]]]),een=gs.every(g=>g.gr===gs[0].gr);
          E.push([l[0][0],l[0][1],een?gs[0].grn:gs.map(g=>g.n).join(', '),l[0][3]])}}
      /* lagen: langste pad vanaf de bronnen, de voorraad altijd rechts; planten (bosbouwer → bos) telt niet mee:
         de planter staat in dezelfde kolom, boven het bos */
      const L=new Map([...N.keys()].map(k=>[k,0]));
      for(let it=0;it<N.size;it++)for(const [a,b,,,pl] of E)if(!pl&&L.get(b)<L.get(a)+1)L.set(b,L.get(a)+1);
      for(const [a,b,,,pl] of E)if(pl)L.set(a,L.get(b));
      if(N.has('voorraad'))L.set('voorraad',Math.max(...E.filter(e=>e[1]==='voorraad').map(e=>L.get(e[0])))+1);
      const cols=[];for(const [k,l] of L)(cols[l]=cols[l]||[]).push(k);
      const CW=270,RH=150,W0=160,H0=118,rows=Math.max(...cols.map(c=>c?c.length:0));
      const pos=new Map();cols.forEach((c,l)=>{if(!c)return;
        if(l>0)c.sort((a,b)=>{const avg=k=>{const p=E.filter(e=>e[1]===k&&pos.has(e[0])).map(e=>pos.get(e[0])[1]);return p.length?p.reduce((s,v)=>s+v,0)/p.length:0};return avg(a)-avg(b)});
        const off=(rows-c.length)*RH/2;c.forEach((k,i)=>pos.set(k,[l*CW+CW/2,off+i*RH+RH/2]))});
      const W=cols.length*CW,H=rows*RH;let s='';
      for(const [a,b,lab,g] of E){const [x1,y1]=pos.get(a),[x2,y2]=pos.get(b);let lx,ly;
        if(x1===x2){const sy=y1<y2?y1+H0/2:y1-H0/2,ey=y1<y2?y2-H0/2:y2+H0/2;   // zelfde kolom: recht omhoog of omlaag
          s+=`<path class="pijl" d="M${x1},${sy} L${x2},${ey}" marker-end="url(#kop)"/>`;lx=x1;ly=(sy+ey)/2}
        else{const sx=x1+W0/2-4,ex=x2-W0/2+4,gp=CW-W0+8;
          if(x2-x1<=CW){const mx=(sx+ex)/2;s+=`<path class="pijl" d="M${sx},${y1} C${mx},${y1} ${mx},${y2} ${ex},${y2}" marker-end="url(#kop)"/>`;lx=mx;ly=(y1+y2)/2}
          else{/* slaat kolommen over: route op een hoogte waar in de tussenliggende kolommen geen gebouw staat */
            const tussen=[...pos.values()].filter(([x])=>x>x1&&x<x2),vrij=y=>tussen.every(([,ny])=>Math.abs(ny-y)>H0/2+14);
            const yr=[y1,y2,...tussen.map(([,ny])=>ny+H0/2+18),...tussen.map(([,ny])=>ny-H0/2-18)].find(vrij)??y1;
            const p=sx+gp/2,q=ex-gp/2;
            s+=`<path class="pijl" d="M${sx},${y1} C${p},${y1} ${p},${yr} ${sx+gp},${yr} L${ex-gp},${yr} C${q},${yr} ${q},${y2} ${ex},${y2}" marker-end="url(#kop)"/>`;
            lx=p;ly=(y1+yr)/2}}
        const gi=g&&goedImg(g),tw=lab.length*7.6+(gi?26:12);
        s+=`<g class="etiket"><rect x="${lx-tw/2}" y="${ly-12}" width="${tw}" height="24" rx="12"/>${gi?`<image href="${gi}" x="${lx-tw/2+4}" y="${ly-9}" width="18" height="18"/>`:''}<text x="${lx-tw/2+(gi?24:6)}" y="${ly+5}">${esc(lab)}</text></g>`}
      for(const [k,n] of N){const [x,y]=pos.get(k);
        s+=`<g class="knoop${n.nat?' natuur':''}${n.store?' opslag':''}"><title>${esc(n.label)}</title><rect x="${x-W0/2}" y="${y-H0/2}" width="${W0}" height="${H0}" rx="12"/>`+
          (n.img?(n.klein?`<image href="${n.img}" x="${x-30}" y="${y-H0/2+18}" width="60" height="48" preserveAspectRatio="xMidYMid meet"/>`
            :`<image href="${n.img}" x="${x-W0/2+10}" y="${y-H0/2+6}" width="${W0-20}" height="${H0-36}" preserveAspectRatio="xMidYMax meet"/>`):'')+
          `<text x="${x}" y="${y+H0/2-11}" text-anchor="middle">${esc(n.label)}</text></g>`}
      const svg=(inh,cls)=>`<svg class="${cls}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(KT.aria(args.map(naam).join(', ')))}">`+
        `<defs><marker id="kop" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="kop"/></marker></defs>${inh}</svg>`;
      /* printversie met kleine jpg's op wit in plaats van de transparante webp's */
      const druk=s.replace(/href="\.\.\/assets\/(buildings|nature)\/(\w+)\.webp"/g,(m,map,k)=>`href="${drukJpg(k,map)}"`);
      return `<figure class="keten">${svg(s,'scherm')}${svg(druk,'druk')}</figure>`;
    },
  };

  /* ---------- bron verwerken ---------- */
  const SHOT=path.join(IMG,taal);
  let html=fs.readFileSync(path.join(__dirname,taal,'bron.html'),'utf8');
  html=html.replace(/<!--gen:(\w+)\s*([^>]*?)-->/g,(m,k,a)=>{if(!GEN[k])throw new Error('onbekende generator '+k);return GEN[k](a.trim()?a.trim().split(/\s+/):[])});
  html=html.replace(/<!--shot:([\w-]+)\|([^>]*?)-->/g,(m,k,t)=>{const f=path.join(SHOT,k+'.jpg'),src=`img/${taal}/${k}.jpg`;
    return fs.existsSync(f)?`<figure class="shot"><a href="${src}" target="_blank" title="${esc(TX.pagina.groot)}"><img src="${src}?v=${fs.statSync(f).mtimeMs/1000|0}" alt="${esc(t)}" loading="lazy"></a><figcaption>${t}</figcaption></figure>`
      :`<figure class="shot leeg"><div>${esc(TX.schotVolgt(k))}</div><figcaption>${t}</figcaption></figure>`});
  html=html.replace(/\{\{([^}]+)\}\}/g,(m,e)=>esc(reken(e)));
  html=html.replace(/\[\[komt:([^\]]+)\]\]/g,(m,t)=>{if(!KOMT.includes(t))KOMT.push(t);return `<span class="komt" title="${esc(t)}">${esc(TX.komt)}</span>`});

  /* inhoudsopgave uit h2 (hoofdstukken, of bijlagen met class="bijlage") en h3 (paragrafen); het kopje boven een hoofdstuk staat in data-kop */
  const slug=s=>s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/<[^>]+>/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const toc=[];let h2=null,nh=0,nb=0;
  html=html.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/g,(m,l,attr,txt)=>{
    let id=(attr.match(/id="([^"]+)"/)||[])[1];if(!id){id=slug(txt);attr+=` id="${id}"`}
    const t=txt.replace(/<span class="komt"[^>]*>.*?<\/span>/g,'').replace(/<[^>]+>/g,'').trim();
    if(l==='2'){const bijl=/bijlage/.test(attr),kop=bijl?TX.bijlage('ABCDEFGH'[nb++]):TX.hoofdstuk(++nh);attr+=` data-kop="${esc(kop)}"`;
      h2={id,t,sub:[],bijl,kop};toc.push(h2)}else if(h2)h2.sub.push({id,t});
    return `<h${l}${attr}>${txt}</h${l}>`});
  const tocHtml='<ol class="toc">'+toc.map(c=>`<li${c.bijl?` class="bijl"`:''}><a href="#${c.id}"${c.bijl?` data-kop="${esc(c.kop)}"`:''}>${esc(c.t)}</a>`+
    (c.sub.length?'<ol>'+c.sub.map(s=>`<li><a href="#${s.id}">${esc(s.t)}</a></li>`).join('')+'</ol>':'')+'</li>').join('')+'</ol>';

  /* paginaschil: {{T.sleutel}} uit TX.pagina; taalkeuze alleen als er meer dan één taal is */
  const P=TX.pagina,datum=new Date().toLocaleDateString(TX.locale,{day:'numeric',month:'long',year:'numeric'});
  const naar=c=>(taal==='nl'?'':'../')+(c==='nl'?'':c+'/');
  const talen=TALEN.length>1?`<nav class="talen" aria-label="${esc(P.taal)}">`+TALEN.map(c=>c===taal?`<b>${c.toUpperCase()}</b>`:`<a href="${naar(c)}" hreflang="${c}">${c.toUpperCase()}</a>`).join('')+'</nav>':'';
  const v=f=>fs.statSync(path.join(OUT0,f)).mtimeMs/1000|0;
  let out=fs.readFileSync(path.join(__dirname,'pagina.html'),'utf8')
    .replace(/\{\{T\.(\w+)\}\}/g,(m,k)=>esc(typeof P[k]==='function'?P[k](datum):P[k]))
    .replace('{{LANG}}',taal).replace('{{INHOUD}}',()=>html).replace(/\{\{TOC\}\}/g,()=>tocHtml)
    .replace('{{VCSS}}',v('handleiding.css')).replace('{{VJS}}',v('handleiding.js'));
  out=drukTweeling(out);
  /* andere talen staan een map dieper: relatieve verwijzingen één niveau omhoog; de taalkeuze komt er pas daarna in */
  const DIR=taal==='nl'?OUT0:path.join(OUT0,taal);
  if(taal!=='nl')out=out.replace(/(\s(?:src|href|srcset)=")(?!#|https?:|data:|\/|kolonie-handleiding\.pdf)/g,(m,a)=>a+'../');
  out=out.replace('{{TALEN}}',()=>talen);
  fs.mkdirSync(DIR,{recursive:true});fs.writeFileSync(path.join(DIR,'index.html'),out);

  /* "Komt eraan"-lijst in de README (uit de Nederlandse bron) */
  if(taal==='nl'){const RM=path.join(ROOT,'README.md');let rm=fs.readFileSync(RM,'utf8');
    const blok='<!-- komt:begin -->\n'+KOMT.map(t=>'- '+t).join('\n')+'\n<!-- komt:end -->';
    if(rm.includes('<!-- komt:begin -->'))fs.writeFileSync(RM,rm.replace(/<!-- komt:begin -->[\s\S]*?<!-- komt:end -->/,blok))}
  console.log(`handleiding ${taal}: ${toc.length} hoofdstukken, ${KOMT.length} × komt eraan, ${(out.length/1024).toFixed(0)} kB`);
}
const kies=process.argv.slice(2);
for(const taal of (kies.length?kies:TALEN))maakTaal(taal);
module.exports={TALEN};
