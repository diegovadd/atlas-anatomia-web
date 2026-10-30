/**
 * Integración optativa de mallas abiertas de Écorché (CC BY-SA 4.0).
 * Los nombres y capas proceden de metadatos explícitos de cada malla.
 * No inferimos estructuras a partir de su forma ni declaramos validez clínica.
 */
import {identifyMuscle,MUSCLE_REGIONS} from './muscle-data.js';

export const DETAILED_MODEL=Object.freeze({
  url:'https://cdn.jsdelivr.net/gh/Charleeh/ecorche@320805e06aee51e2e6f6b22533eb2a59d43f2d4d/model/ecorche.meshopt.glb',
  source:'Écorché · Charleeh (BodyParts3D y Z-Anatomy)',
  license:'CC BY-SA 4.0',
  project:'https://github.com/Charleeh/ecorche',
  licenseUrl:'https://github.com/Charleeh/ecorche/blob/main/LICENSE.md',
  format:'glb-meshopt',
  estimatedMB:5.7
});
export const MUSCLE_LAYERS=Object.freeze([
 {id:'all',label:'Todas las capas musculares'},
 {id:'superficial',label:'Superficiales'},
 {id:'deep',label:'Profundas'}
]);
const REGION_RULES=[
 ['head',/tempor|masseter|orbicular|zygomatic|buccinat|occipit|frontal|pterygoid|procerus|mentalis|risori|nasalis|auricular|corrugator|depressor.*(lab|anguli)|levator.*lab/],
 ['neck',/sternocleidomastoid|scalene|digastric|omohyoid|sternohyoid|stylohyoid|longus (colli|capitis)|splenius|semispinalis capitis|infrahyoid|suprahyoid/],
 ['chest',/pectoralis|serratus anterior|intercostal|subclavius|transversus thoracis|diaphragm/],
 ['abdomen',/abdominis|oblique|transversus abdominis|pyramidalis/],
 ['back',/trapezius|latissimus|rhomboid|erector spinae|multifidus|rotator(es|es)|spinalis|longissimus|iliocostalis|serratus posterior|quadratus lumborum/],
 ['upper',/deltoid|biceps brachii|triceps brachii|brachialis|brachioradialis|supra(spinatus)|infraspinatus|subscapularis|teres (major|minor)|coracobrachialis|pronator|supinator|carpi|digitorum|pollicis|interossei|lumbrical/],
 ['pelvis',/gluteus|iliacus|psoas|piriformis|obturator|gemellus|quadratus femoris/],
 ['lower',/femoris|vastus|sartorius|semitendinosus|semimembranosus|gastrocnemius|soleus|tibialis|fibularis|peroneus|adductor|gracilis|popliteus|plantaris|hallucis|quadriceps|hamstring/]
];
export function humanizeSourceMuscleName(raw=''){
 return String(raw).replace(/^(left|right)\s+/i,'').replace(/\s*\(\d+\)$/,'').replace(/[_.]/g,' ').replace(/\s+/g,' ').trim();
}
export function sourceSide(raw='',metadataSide){
 const side=String(metadataSide||'').toLowerCase();
 if(side==='left'||side==='right'||side==='midline')return side;
 if(/^left\s+/i.test(raw)||/\.(?:L|left)$/i.test(raw))return 'left';
 if(/^right\s+/i.test(raw)||/\.(?:R|right)$/i.test(raw))return 'right';
 return null;
}
export function sourceLayer(metadata={}){
 const value=String(metadata.layer||'').toLowerCase();
 if(value==='deep muscles')return 'deep';
 if(value==='superficial muscles')return 'superficial';
 if(value==='skeleton')return 'skeleton';
 return null;
}
export function classifySourceMuscle(raw='',metadata={}){
 const layer=sourceLayer(metadata);
 if(layer==='skeleton')return null;
 const sourceName=String(metadata.name||raw||'').trim();
 const fromCatalog=identifyMuscle(sourceName);
 // En archivos normales exigimos coincidencia explícita; un GLB Écorché
 // incluye además la capa que demuestra que la malla es muscular.
 if(!fromCatalog&&!layer)return null;
 const side=sourceSide(sourceName,metadata.side);
 const enName=humanizeSourceMuscleName(sourceName);
 const region=fromCatalog?.region||
  REGION_RULES.find(([id,pattern])=>pattern.test(enName.toLowerCase()))?.[0]||'other';
 const sideLabel=side==='left'?' izquierdo':side==='right'?' derecho':'';
 const name=fromCatalog?fromCatalog.name:
  (enName.charAt(0).toUpperCase()+enName.slice(1));
 const translated=Boolean(fromCatalog);
 return {
  key:fromCatalog?.key||enName.toLowerCase(),
  name,
  displayName:name+sideLabel,
  originalName:sourceName,
  side,
  region,
  layer:layer||'superficial',
  translated,
  source:metadata.source||null,
  fma:metadata.fma||null
 };
}
export function layerMatches(entry,layerMode){
 return layerMode==='all'||entry.layer===layerMode;
}
export function regionFor(info){
 return MUSCLE_REGIONS.find(x=>x.id===info.region)?.label||
  (info.region==='other'?'Región sin clasificar':'Sin región');
}
export function detailAudit(meshes=[]){
 const layers={superficial:0,deep:0,unknown:0};
 const regions=new Set(),types=new Set();
 for(const mesh of meshes){
  const info=classifySourceMuscle(mesh.name,mesh.userData||{});
  if(!info)continue;
  layers[info.layer]??=0;
  layers[info.layer]++;
  types.add(info.key);
  regions.add(info.region);
 }
 return {layers,types:types.size,regions:regions.size,total:Object.values(layers).reduce((a,b)=>a+b,0)};
}
