/* Maakt per taal kolonie-handleiding.pdf naast de handleidingpagina (print-CSS, headless Chrome).
     node tools/handleiding/pdf.js [taal ...]        (KOLONIE_URL = adres van het spel, standaard de live site) */
const fs=require('fs'),path=require('path');
const {startChrome,sleep}=require('./chrome.js');
const {PUB}=require('./spel.js');
const BASIS=(process.env.KOLONIE_URL||'https://doc.dgol.eu/settlers4b/')+'handleiding/';
const TALEN=process.argv.slice(2).length?process.argv.slice(2):require('fs').readdirSync(__dirname).filter(d=>fs.existsSync(path.join(__dirname,d,'bron.html')));
(async()=>{for(const taal of TALEN){
  const B=await startChrome({port:9392});const {cmd,ev}=B,sub=taal==='nl'?'':taal+'/';
  try{
    await cmd('Page.navigate',{url:BASIS+sub+'?pdf='+Date.now()});await sleep(1500);
    /* alle plaatjes nu laden (ze staan op lazy) en wachten op lettertypes */
    await ev(`(async()=>{document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager');await document.fonts.ready;
      await Promise.all([...document.images].map(i=>i.complete?0:new Promise(r=>{i.onload=i.onerror=r})));return 1})()`,true);
    await sleep(500);
    const voet=`<div style="width:100%;font:8pt 'Source Sans 3',sans-serif;color:#8a7558;padding:0 17mm;display:flex;justify-content:space-between">
      <span>${await ev('document.body.dataset.voet')}</span><span><span class="pageNumber"></span></span></div>`;
    const r=await cmd('Page.printToPDF',{printBackground:true,preferCSSPageSize:true,displayHeaderFooter:true,headerTemplate:'<span></span>',footerTemplate:voet});
    const uit=path.join(PUB,'handleiding',sub,'kolonie-handleiding.pdf');fs.writeFileSync(uit,Buffer.from(r.result.data,'base64'));
    console.log('pdf '+taal+':',(fs.statSync(uit).size/1024/1024).toFixed(1),'MB');
    if(B.fouten.length)console.log('JS-fouten:',B.fouten);
  }finally{B.close();await sleep(400)}
}})().catch(e=>{console.error(e);process.exit(1)});
