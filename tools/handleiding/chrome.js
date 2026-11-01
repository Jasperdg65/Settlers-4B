/* Headless Chrome via het DevTools-protocol, zonder npm-pakketten (Node 22: fetch en WebSocket zijn ingebouwd).
   De browser staat buiten de webroot op het grote volume (KOLONIE_BROWSER of de standaardmap). */
const {spawn}=require('child_process'),fs=require('fs'),path=require('path');
const DIR=process.env.KOLONIE_BROWSER||'/mnt/HC_Volume_105876660/kolonie/browser';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function startChrome({port=9390,w=1400,h=900,scale=1}={}){
  const prof=path.join(DIR,'profiel-handleiding-'+port);fs.rmSync(prof,{recursive:true,force:true});
  const ch=spawn(path.join(DIR,'chrome-headless-shell-linux64/chrome-headless-shell'),
    ['--remote-debugging-port='+port,'--no-sandbox','--hide-scrollbars','--window-size='+w+','+h,'--user-data-dir='+prof,'about:blank'],
    {env:{...process.env,LD_LIBRARY_PATH:path.join(DIR,'lib/usr/lib/x86_64-linux-gnu')},stdio:'ignore'});
  let ws;for(let k=0;k<60&&!ws;k++){try{const l=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();ws=l.find(t=>t.type==='page')?.webSocketDebuggerUrl}catch(e){}if(!ws)await sleep(200)}
  if(!ws)throw new Error('Chrome start niet');
  const so=new WebSocket(ws);await new Promise(r=>so.onopen=r);let id=0;const wait=new Map(),fouten=[];
  so.onmessage=m=>{const d=JSON.parse(m.data);if(d.id&&wait.has(d.id)){wait.get(d.id)(d);wait.delete(d.id)}
    if(d.method==='Runtime.exceptionThrown')fouten.push(d.params.exceptionDetails.exception?.description||d.params.exceptionDetails.text)};
  const cmd=(method,params={})=>new Promise(r=>{const i=++id;wait.set(i,r);so.send(JSON.stringify({id:i,method,params}))});
  const ev=async(e,await_=false)=>{const r=await cmd('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:await_});
    if(r.result?.exceptionDetails)throw new Error('In de pagina: '+(r.result.exceptionDetails.exception?.description||r.result.exceptionDetails.text));return r.result?.result?.value};
  await cmd('Runtime.enable');await cmd('Page.enable');
  await cmd('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:scale,mobile:false});
  const close=()=>{so.close();ch.kill();setTimeout(()=>fs.rmSync(prof,{recursive:true,force:true}),300)};
  return {cmd,ev,close,fouten,sleep};
}
module.exports={startChrome,sleep};
