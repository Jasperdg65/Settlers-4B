"use strict";
/* ---------- Geschilderde sprites uit assets/manifest.json ----------
   Gebouwen (DEFAULT_IMGS): w, ax, ay en soms flag, hub, sail.
   Natuur (NATURE_IMGS): h, ax, ay. Elke regel wijst met file naar een
   webp. Lukt laden niet, dan blijven de getekende sprites staan. */
let DEFAULT_IMGS={},NATURE_IMGS={};
async function loadManifest(){
  try{const r=await fetch('assets/manifest.json',{cache:'no-cache'});if(!r.ok)throw new Error('HTTP '+r.status);
    const m=await r.json();DEFAULT_IMGS=m.buildings||{};NATURE_IMGS=m.nature||{}}
  catch(e){console.warn('manifest laden mislukt, getekende sprites blijven',e)}}
async function assetBlob(d){const r=await fetch('assets/'+d.file+(d.v?'?v='+d.v:''));
  if(!r.ok)throw new Error(d.file+': HTTP '+r.status);return r.blob()}
