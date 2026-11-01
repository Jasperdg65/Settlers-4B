/* Laadt de spelscripts (volgorde uit public/index.html) in een Node-vm met nep-DOM, in de gevraagde taal (via ?lang=, zoals
   in de browser), zodat de handleiding de echte CFG, GOODS, BTYPES, namen en het manifest gebruikt. Geen netwerk, geen tekenen. */
const vm=require('vm'),fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'../..'),PUB=path.join(ROOT,'public');
function laadSpel(taal='nl'){
  const html=fs.readFileSync(path.join(PUB,'index.html'),'utf8');
  const files=[...html.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]);
  const nep=new Proxy(function(){},{get:(t,k)=>k==='canvas'?{width:1,height:1}:k in t?t[k]:nep,apply:()=>nep,set:(t,k,v)=>(t[k]=v,true)});
  const els={};
  const mk=id=>{const e={id,value:'',style:{},dataset:{},children:[],classList:{add(){},remove(){},toggle(){}},addEventListener(){},
    appendChild(c){e.children.push(c)},getContext:()=>nep,getBoundingClientRect:()=>({left:0,top:0,width:800,height:600}),setPointerCapture(){},
    set innerHTML(v){e.children=[]},get innerHTML(){return ''},width:1,height:1,checked:false,textContent:''};return e};
  for(const m of html.matchAll(/id="([^"]+)"/g))els[m[1]]=mk(m[1]);
  const ctx={console:{log(){},warn(){},error(){}},Math,Float32Array,Float64Array,Int32Array,Uint8Array,Uint16Array,Int16Array,Uint32Array,
    Uint8ClampedArray,Map,Set,Promise,JSON,Object,Array,String,Number,Error,URLSearchParams,performance,setTimeout,clearTimeout,location:{search:'?lang='+taal},
    devicePixelRatio:1,matchMedia:()=>({matches:false}),navigator:{},innerWidth:800,innerHeight:600,
    document:{getElementById:id=>els[id]||(els[id]=mk(id)),createElement:()=>mk('x'),body:mk('body'),querySelectorAll:()=>[]},
    addEventListener(){},requestAnimationFrame(){},ResizeObserver:class{observe(){}},fetch:()=>new Promise(()=>{}),
    createImageBitmap:()=>new Promise(()=>{}),indexedDB:{open:()=>({})},DOMMatrix:class{},Image:class{}};
  ctx.window=ctx;vm.createContext(ctx);
  for(const f of files)vm.runInContext(fs.readFileSync(path.join(PUB,f),'utf8'),ctx,{filename:f});
  /* const-declaraties zijn geen eigenschappen van de context: haal ze er expliciet uit */
  const get=n=>vm.runInContext(n,ctx);
  return {ctx,get,CFG:get('CFG'),GOODS:get('GOODS'),GI:get('GI'),BTYPES:get('BTYPES'),PCOL:get('PCOL'),
    manifest:JSON.parse(fs.readFileSync(path.join(PUB,'assets/manifest.json'),'utf8'))};
}
module.exports={laadSpel,ROOT,PUB};
