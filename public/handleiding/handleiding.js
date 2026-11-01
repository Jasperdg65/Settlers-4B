"use strict";
/* Handleiding: zoeken (per paragraaf, zonder accenten en hoofdletters), markeren in de tekst en de inhoudsopgave volgen. */
(()=>{
const $=s=>document.querySelector(s),plat=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* tekst van een knoop met spaties tussen alle stukjes (anders plakken tabelcellen aan elkaar) */
const tekst=n=>{if(n.nodeType===3)return n.data;if(n.nodeType!==1)return '';const w=document.createTreeWalker(n,NodeFilter.SHOW_TEXT);let t='';for(let x;(x=w.nextNode());)t+=' '+x.data;return t};
/* koptekst zonder het label 'Komt eraan' */
const kaal=h=>{const c=h.cloneNode(true);c.querySelectorAll('.komt').forEach(x=>x.remove());return c.textContent.trim()};
/* op een smal scherm begint de inhoudsopgave dicht */
if(matchMedia('(max-width:900px)').matches)document.querySelector('.inhoud details')?.removeAttribute('open');
/* index: elke h2/h3 met de tekst tot de volgende kop */
const koppen=[...document.querySelectorAll('main .hoofdstuk h2, main .hoofdstuk h3')];
const index=koppen.map((h,i)=>{
  let t='',n=h.nextSibling;const stop=koppen[i+1];
  while(n&&n!==stop&&!(n.nodeType===1&&n.contains(stop))){t+=' '+tekst(n);n=n.nextSibling}
  const hs=h.closest('.hoofdstuk').querySelector('h2');
  return {id:h.id,titel:kaal(h),hoofdstuk:hs===h?'':kaal(hs),
    tekst:t.replace(/\s+/g,' ').trim(),plat:plat(h.textContent+' '+t)}});

const veld=$('#zoek'),lijst=$('#treffers');let keus=0,treffers=[];
function zoek(){
  const q=plat(veld.value.trim()),w=q.split(/\s+/).filter(x=>x.length>1);
  if(!w.length){lijst.hidden=true;markeer([]);return}
  treffers=index.map(s=>{let sc=0;for(const x of w){const k=s.plat.split(x).length-1;if(!k)return null;sc+=k+(plat(s.titel).includes(x)?20:0)}return [sc,s]})
    .filter(Boolean).sort((a,b)=>b[0]-a[0]).slice(0,12).map(v=>v[1]);
  keus=0;lijst.hidden=false;
  lijst.innerHTML=treffers.length?treffers.map((s,i)=>`<li><a href="#${s.id}" class="${i?'':'actief'}"><b>${esc(s.titel)}</b>`+
    `<small>${s.hoofdstuk?esc(s.hoofdstuk)+' · ':''}${fragment(s.tekst,w)}</small></a></li>`).join(''):`<li class="niets">${esc(document.body.dataset.niets||'')}</li>`;
  markeer(w);
}
/* stukje tekst rond de eerste treffer, met de zoekwoorden gemarkeerd */
function fragment(t,w){
  const p=plat(t),i=Math.max(0,p.indexOf(w[0])-50),s=t.slice(i,i+150);let h=esc(s);
  for(const x of w){const re=new RegExp(x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').split('').map(c=>`[${c}${c.toUpperCase()}${({a:'áàä',e:'éèëê',i:'ïí',o:'óöô',u:'üú'})[c]||''}]`).join(''),'g');h=h.replace(re,m=>`<mark>${m}</mark>`)}
  return (i?'… ':'')+h+(i+150<t.length?' …':'');
}
/* zoekwoorden in de lopende tekst markeren (waar de browser de Highlight API kent) */
function markeer(w){
  if(!window.CSS||!CSS.highlights)return;CSS.highlights.delete('zoek');if(!w.length)return;
  const rs=[],walk=document.createTreeWalker($('#tekst'),NodeFilter.SHOW_TEXT);
  for(let n;(n=walk.nextNode());){const p=plat(n.data);for(const x of w){let i=p.indexOf(x);while(i>=0&&rs.length<400){const r=new Range();r.setStart(n,i);r.setEnd(n,i+x.length);rs.push(r);i=p.indexOf(x,i+x.length)}}}
  CSS.highlights.set('zoek',new Highlight(...rs));
}
function kies(i){const a=lijst.querySelectorAll('a');if(!a.length)return;keus=(i+a.length)%a.length;a.forEach((x,k)=>x.classList.toggle('actief',k===keus));a[keus].scrollIntoView({block:'nearest'})}
function ga(id){lijst.hidden=true;const el=document.getElementById(id);if(!el)return;history.replaceState(null,'','#'+id);el.scrollIntoView({behavior:'smooth',block:'start'});el.classList.remove('flits');void el.offsetWidth;el.classList.add('flits')}
veld.addEventListener('input',zoek);
veld.addEventListener('focus',()=>{if(veld.value.trim())zoek()});
veld.addEventListener('keydown',e=>{
  if(e.key==='ArrowDown'){e.preventDefault();kies(keus+1)}else if(e.key==='ArrowUp'){e.preventDefault();kies(keus-1)}
  else if(e.key==='Enter'&&treffers[keus]){e.preventDefault();ga(treffers[keus].id)}
  else if(e.key==='Escape'){veld.value='';zoek();veld.blur()}});
lijst.addEventListener('click',e=>{const a=e.target.closest('a');if(a){e.preventDefault();ga(a.getAttribute('href').slice(1))}});
document.addEventListener('click',e=>{if(!e.target.closest('.zoek'))lijst.hidden=true});
document.addEventListener('keydown',e=>{if(e.key==='/'&&document.activeElement!==veld){e.preventDefault();veld.focus();veld.select()}});

/* inhoudsopgave: het stuk dat in beeld is oplichten */
const links=new Map([...document.querySelectorAll('.inhoud .toc a')].map(a=>[a.getAttribute('href').slice(1),a]));
let hier=null;
const kijk=new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting){const a=links.get(e.target.id);if(a&&a!==hier){hier?.classList.remove('hier');hier=a;a.classList.add('hier')}}},{rootMargin:'-70px 0px -70% 0px'});
koppen.forEach(h=>kijk.observe(h));
})();
