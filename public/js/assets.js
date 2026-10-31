"use strict";
/* ---------- Geschilderde sprites uit assets/manifest.json ----------
   Gebouwen (DEFAULT_IMGS): w, ax, ay en soms flag, hub, sail.
   Natuur (NATURE_IMGS): h, ax, ay. Grondtexturen (TEX_IMGS). 3D-poppetjes (UNIT3D_IMGS) en duels (DUEL3D_IMGS), zie units3d.js. Elke regel wijst met file naar een
   webp. Lukt laden niet, dan blijven de getekende sprites staan. */
let DEFAULT_IMGS={},NATURE_IMGS={},TEX_IMGS={};
async function loadManifest(){
  try{const r=await fetch('assets/manifest.json',{cache:'no-cache'});if(!r.ok)throw new Error('HTTP '+r.status);
    const m=await r.json();DEFAULT_IMGS=m.buildings||{};NATURE_IMGS=m.nature||{};TEX_IMGS=m.textures||{};UNIT3D_IMGS=m.units||{};DUEL3D_IMGS=m.duels||{}}
  catch(e){console.warn('manifest laden mislukt, getekende sprites blijven',e)}}
async function assetBlob(d){const r=await fetch('assets/'+d.file+(d.v?'?v='+d.v:''));
  if(!r.ok)throw new Error(d.file+': HTTP '+r.status);return r.blob()}
