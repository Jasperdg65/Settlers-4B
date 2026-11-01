"use strict";
/* ---------- Talen ----------
   Alle tekst die een speler ziet, komt uit public/lang/<taal>.js via t('sleutel', {waarden}); {naam} in een tekst wordt ingevuld.
   Nederlands is de brontaal: ontbreekt een sleutel in een andere taal, dan valt t() terug op het Nederlands (en anders op de sleutel).
   Taalkeuze: ?lang=xx in de URL, anders de vorige keuze, anders de browsertaal, anders nl. Wisselen = pagina herladen
   (dus vóór het spelen, want er is nog geen savegame). Getallen: getal(n) met de notatie van de taal. */
const TALEN={};
const TAAL_CODES=['nl','en','fr','de','es'],LOCALE={nl:'nl-NL',en:'en-GB',fr:'fr-FR',de:'de-DE',es:'es-ES'};
const TAAL=(()=>{
  const ok=c=>TAAL_CODES.includes(c)?c:null;let q=null,s=null;
  try{q=new URLSearchParams(location.search).get('lang')}catch(e){}
  try{s=localStorage.getItem('kolonie.taal')}catch(e){}
  const n=typeof navigator!=='undefined'&&navigator.language?navigator.language.slice(0,2):null;
  const c=ok(q)||ok(s)||ok(n)||'nl';if(ok(q))try{localStorage.setItem('kolonie.taal',c)}catch(e){}
  return c;
})();
function t(k,v){
  let s=(TALEN[TAAL]&&TALEN[TAAL][k])??(TALEN.nl&&TALEN.nl[k])??k;
  if(v)s=s.replace(/\{(\w+)\}/g,(m,x)=>x in v?v[x]:m);
  return s;
}
const LOC=()=>LOCALE[TALEN[TAAL]?TAAL:'nl'],getal=n=>Number(n).toLocaleString(LOC());
