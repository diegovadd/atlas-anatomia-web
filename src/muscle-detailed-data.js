/**
 * Integración optativa de mallas abiertas de Écorché (CC BY-SA 4.0).
 * Los nombres y capas proceden de metadatos explícitos de cada malla.
 * No inferimos estructuras a partir de su forma ni declaramos validez clínica.
 */
import {identifyMuscle,MUSCLE_REGIONS} from './muscle-data.js';
import {translateSourceStructure,stripSourceLaterality} from './muscle-glossary-es.js';

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
export function nameSide(raw=''){
 const left=/(^|\s)left(\s|$)/i.test(raw)||/\.(?:L|left)$/i.test(raw);
 const right=/(^|\s)right(\s|$)/i.test(raw)||/\.(?:R|right)$/i.test(raw);
 if(left&&right)return null;
 return left?'left':right?'right':null;
}
export function sourceSide(raw='',metadataSide){
 const stated=String(metadataSide||'').toLowerCase();
 // Ante discrepancias entre metadata y nombre explícito, conservar el
 // lado indicado por el nombre y avisar por separado; no ocultar el error.
 return nameSide(raw)||(['left','right','midline'].includes(stated)?stated:null);
}
export function sideConflict(raw='',metadataSide){
 const named=nameSide(raw),tag=String(metadataSide||'').toLowerCase();
 return Boolean(named&&['left','right','midline'].includes(tag)&&named!==tag);
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
 if(!sourceName)return null;
 const fromCatalog=identifyMuscle(sourceName);
 // No afirmar que una malla desconocida es músculo si la fuente no
 // identifica la capa. El glosario tampoco crea geometría.
 if(!fromCatalog&&!layer)return null;
 const localized=translateSourceStructure(sourceName);
 const side=sourceSide(sourceName,metadata.side);
 const enName=humanizeSourceMuscleName(sourceName);
 const spanish=localized.spanish||fromCatalog?.name||null;
 const region=localized.region||fromCatalog?.region||
  REGION_RULES.find(([id,pattern])=>pattern.test(enName.toLowerCase()))?.[0]||'other';
 const feminine=/\b(de la mano|de la muñeca|fascia toracolumbar)$/i.test(spanish||'');
 const sideLabel=side==='left'?(feminine?' izquierda':' izquierdo'):side==='right'?(feminine?' derecha':' derecho'):'';
 const name=spanish||(stripSourceLaterality(sourceName).replace(/^./,c=>c.toUpperCase()));
 const translated=Boolean(spanish);
 const kind=localized.kind||'muscle';
 const discrepant=sideConflict(sourceName,metadata.side);
 const duplicate=sourceName.match(/\((\d+)\)$/)?.[1];
 return {
  key:fromCatalog?.key||stripSourceLaterality(sourceName),
  name,
  displayName:name+sideLabel+(duplicate?' · malla '+duplicate:''),
  originalName:sourceName,
  side,sideConflict:discrepant,
  reportedSide:metadata.side||null,
  region,layer:layer||'superficial',kind,translated,
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
 let muscleCount=0,connectiveCount=0,sideConflicts=0,translatedCount=0;
 for(const mesh of meshes){
  const info=classifySourceMuscle(mesh.name,mesh.userData||{});
  if(!info)continue;
  if(info.kind==='connective')connectiveCount++;else muscleCount++;
  if(info.sideConflict)sideConflicts++;
  if(info.translated)translatedCount++;
  layers[info.layer]??=0;
  layers[info.layer]++;
  types.add(info.key);
  regions.add(info.region);
 }
 return {layers,types:types.size,regions:regions.size,
  total:Object.values(layers).reduce((a,b)=>a+b,0),
  muscleCount,connectiveCount,sideConflicts,translatedCount};
}
