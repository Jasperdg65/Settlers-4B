/* Controleert de taalbestanden in public/lang tegen de brontaal (nl): ontbrekende en overbodige sleutels, en {plaatshouders}
   die niet overeenkomen.   node tools/talen.js */
const fs=require('fs'),path=require('path'),vm=require('vm');
const DIR=path.join(__dirname,'../public/lang'),ctx={TALEN:{}};vm.createContext(ctx);
for(const f of fs.readdirSync(DIR).filter(f=>f.endsWith('.js')))vm.runInContext(fs.readFileSync(path.join(DIR,f),'utf8'),ctx,{filename:f});
const nl=ctx.TALEN.nl,ph=s=>(s.match(/\{\w+\}/g)||[]).sort().join(',');let fout=0;
for(const [c,L] of Object.entries(ctx.TALEN)){if(c==='nl')continue;
  const mis=Object.keys(nl).filter(k=>!(k in L)),over=Object.keys(L).filter(k=>!(k in nl)),plek=Object.keys(L).filter(k=>k in nl&&ph(L[k])!==ph(nl[k]));
  console.log(`${c}: ${Object.keys(L).length}/${Object.keys(nl).length} sleutels`+(mis.length?`, ontbreekt: ${mis.join(' ')}`:'')+(over.length?`, overbodig: ${over.join(' ')}`:'')+(plek.length?`, plaatshouders anders: ${plek.join(' ')}`:''));
  fout+=mis.length+plek.length}
console.log(`nl: ${Object.keys(nl).length} sleutels (brontaal)`);process.exit(fout?1:0);
