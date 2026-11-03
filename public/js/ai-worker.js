"use strict";
/* Web Worker voor de computerburen (mijlpaal 9a): krijgt {id, s} (samenvatting van één buur, neighbours.js) en stuurt {id, p, r} terug */
importScripts('ai.js');
onmessage=ev=>{const {id,s}=ev.data;postMessage({id,p:s.p,r:aiThink(s)})};
