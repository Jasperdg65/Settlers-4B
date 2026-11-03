"use strict";
/* ---------- Geschilderde sprites uit assets/manifest.json ----------
   Gebouwen (DEFAULT_IMGS): w, ax, ay en soms flag, hub, sail.
   Natuur (NATURE_IMGS): h, ax, ay. Grondtexturen (TEX_IMGS). Effecten (EFFECT_IMGS, bv. rook): spriteblad met cols × rows beelden. Draaiende delen (SPIN_IMGS, de molenwieken): JSON met per maat een spriteblad. Goederen (GOOD_IMGS, goods.js): één exemplaar per goed. Interface (UI_IMGS, de adviseur): <file>_1x/_2x.webp. 3D-poppetjes (UNIT3D_IMGS), duels (DUEL3D_IMGS) en dieren (ANIMAL3D_IMGS), zie units3d.js. Elke regel wijst met file naar een
   webp. Lukt laden niet, dan blijven de getekende sprites staan. */
let GOOD_IMGS={},DEFAULT_IMGS={},NATURE_IMGS={},TEX_IMGS={},EFFECT_IMGS={},UI_IMGS={},SMOKE_SHEET=null;
async function loadManifest(){
  try{const r=await fetch('assets/manifest.json',{cache:'no-cache'});if(!r.ok)throw new Error('HTTP '+r.status);
    const m=await r.json();DEFAULT_IMGS=m.buildings||{};NATURE_IMGS=m.nature||{};TEX_IMGS=m.textures||{};UNIT3D_IMGS=m.units||{};DUEL3D_IMGS=m.duels||{};ANIMAL3D_IMGS=m.animals||{};EFFECT_IMGS=m.effects||{};UI_IMGS=m.ui||{};GOOD_IMGS=m.goods||{};SPIN_IMGS=m.spinners||{}}
  catch(e){console.warn('manifest laden mislukt, getekende sprites blijven',e)}}
/* rookwolkjes: lukt het niet, dan blijven de getekende cirkels */
/* draaiende molenwieken (manifest.spinners, tools/render_wieken.py): per maat een spriteblad met de draaistanden */
let SPIN_IMGS={},SAILS=null;
async function loadSails(){const d=SPIN_IMGS.molenwieken;if(!d)return;
  try{const r=await fetch('assets/'+d.json+'?v='+d.v);if(!r.ok)throw new Error(d.json+': HTTP '+r.status);const j=await r.json();
    j.sizes=await Promise.all(j.sizes.map(async s=>({...s,c:await createImageBitmap(await assetBlob({file:s.file,v:d.v}))})));SAILS=j}
  catch(e){console.warn('molenwieken niet geladen, getekende wieken blijven',e)}}
async function loadEffects(){loadSails();loadGoods();const d=EFFECT_IMGS.rook;if(!d)return;
  try{SMOKE_SHEET={...d,c:await createImageBitmap(await assetBlob(d))}}catch(e){console.warn('rook niet geladen, getekende wolkjes blijven',e)}}
async function assetBlob(d){const r=await fetch('assets/'+d.file+(d.v?'?v='+d.v:''));
  if(!r.ok)throw new Error(d.file+': HTTP '+r.status);return r.blob()}
