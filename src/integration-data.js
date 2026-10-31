/**
 * ATLAS 06 · catálogo transversal + contrato de interoperabilidad.
 *
 * Los 4 GLB provienen de proveedores diferentes. Sus coordenadas no se
 * han registrado con referencias anatómicas comunes: la superposición
 * está BLOQUEADA hasta disponer de transformaciones verificadas.
 */
import {DETAILED_MODEL,classifySourceMuscle} from './muscle-detailed-data.js';
import {ECORCHE_LABELS} from './integration-muscles.js';
import {NERVE_SOURCE,NERVE_REGISTRY} from './nerve-data.js';
import {VASCULAR_SOURCE,VASCULAR_STRUCTURES} from './vascular-data.js';
import {JOINTS_SOURCE,JOINTS_STRUCTURES} from './joints-data.js';

export const INTEGRATION_SYSTEMS=Object.freeze([
 {id:'bone',label:'Óseo',url:'https://cdn.jsdelivr.net/gh/SeemaBansal1/3d-human-body-anatomy@28912432581accd7a1c62129d55f0e9758221d48/web/public/models/skeleton.glb',
  license:'CC BY-SA 4.0 (geometría derivada; revisar licencias de origen)',
  attribution:'https://github.com/SeemaBansal1/3d-human-body-anatomy',
  viewer:'./index.html',bytes:1195788,meshCount:null,kind:'huesos por malla',format:'glb'}, 
 {id:'muscle',label:'Muscular',url:DETAILED_MODEL.url,license:DETAILED_MODEL.license,
  attribution:DETAILED_MODEL.project,viewer:'./musculos.html',bytes:5700000,format:'meshopt',
  meshCount:362,kind:'músculos y tejido conectivo'},
 {id:'nerve',label:'Nervioso',url:NERVE_SOURCE.url,license:NERVE_SOURCE.license,
  attribution:NERVE_SOURCE.attribution,viewer:'./nervios.html',bytes:NERVE_SOURCE.approxBytes,
  meshCount:NERVE_REGISTRY.length,kind:'neuroeje y contexto'},
 {id:'vessel',label:'Vascular',url:VASCULAR_SOURCE.url,license:VASCULAR_SOURCE.license,
  attribution:VASCULAR_SOURCE.attribution,viewer:'./vasos.html',bytes:VASCULAR_SOURCE.size,
  meshCount:VASCULAR_STRUCTURES.length,kind:'arterias y venas'},
 {id:'joint',label:'Articular',url:JOINTS_SOURCE.url,license:JOINTS_SOURCE.license,
  attribution:JOINTS_SOURCE.attribution,viewer:'./articulaciones.html',bytes:JOINTS_SOURCE.bytes,
  meshCount:JOINTS_STRUCTURES.length,kind:'ligamentos, cápsulas y discos'}
].map(Object.freeze));
export const INTEGRATION_SYSTEM_MAP=Object.freeze(Object.fromEntries(INTEGRATION_SYSTEMS.map(x=>[x.id,x])));
export const INTEGRATION_REGIONS=Object.freeze([
 {id:'all',label:'Todo el cuerpo'},
 {id:'head',label:'Cabeza'},
 {id:'neck',label:'Cuello'},
 {id:'spine',label:'Columna y médula'},
 {id:'chest',label:'Tórax'},
 {id:'back',label:'Espalda'},
 {id:'abdomen',label:'Abdomen'},
 {id:'upper',label:'Miembro superior'},
 {id:'pelvis',label:'Pelvis y cadera'},
 {id:'lower',label:'Miembro inferior'}
]);
const fromJointGroup={
 'jaw-and-skull-base':'head','larynx':'neck',
 'vertebral-column':'spine','thorax':'chest',
 'shoulder-girdle':'upper','shoulder':'upper',
 'elbow-and-forearm':'upper','wrist':'upper','hand':'upper',
 'pelvis':'pelvis','hip':'pelvis','knee':'lower',
 'leg-and-ankle':'lower','foot':'lower','bones':'spine'
};
export function normalizedRegion(system,raw){
 if(system==='bone'){
  if(raw==='skull')return 'head';
  if(raw==='spine')return 'spine';
  if(raw==='arm'||raw==='shoulder')return 'upper';
  if(raw==='leg')return 'lower';
  if(['head','neck','chest','pelvis','lower','upper'].includes(raw))return raw;
 }
 if(system==='muscle'){
  if(raw==='head'||raw==='neck'||raw==='chest'||raw==='abdomen'||raw==='back'||raw==='upper'||raw==='pelvis'||raw==='lower')return raw;
 }
 if(system==='nerve'){
  if(['central','spinal','discs','bones'].includes(raw))return 'spine';
  if(raw==='plexus')return 'upper';
  if(raw==='vessels')return 'neck';
 }
 if(system==='vessel'){
  if(raw==='head')return 'neck';
  if(['chest','upper','abdomen','pelvis','lower'].includes(raw))return raw;
 }
 if(system==='joint')return fromJointGroup[raw]||null;
 return null;
}
const asEntry=(system,id,name,originalName,region,kind,sourceId=null,layer=null)=>Object.freeze({
 system,id,name,originalName,region,kind,layer,sourceId:sourceId||id,
 lookup:(name+' '+originalName+' '+id).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
});
const muscleEntries=ECORCHE_LABELS.map((x,i)=>{
 const info=classifySourceMuscle(x.name,x);
 return asEntry('muscle','ecorche-'+i,info?.displayName||x.name,
  x.name,normalizedRegion('muscle',info?.region),info?.kind||'muscle',x.name,info?.layer||null);
});
const nerveEntries=NERVE_REGISTRY.map(x=>asEntry('nerve',x.id,x.name,x.sourceName,
 normalizedRegion('nerve',x.group),x.group,x.id));
const vesselEntries=VASCULAR_STRUCTURES.map(x=>asEntry('vessel',x.id,x.name,x.originalName,
 normalizedRegion('vessel',x.region),x.kind,x.id));
const jointEntries=JOINTS_STRUCTURES.map(x=>asEntry('joint',x.id,x.name,x.originalName,
 normalizedRegion('joint',x.group),x.kind,x.id));
export const INTEGRATION_ENTRIES=Object.freeze([
 ...muscleEntries,...nerveEntries,...vesselEntries,...jointEntries
]);
export function findStructures({query='',region='all',systems=INTEGRATION_SYSTEMS.map(s=>s.id)}={}){
 const norm=String(query).trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const accepted=new Set(systems);
 return INTEGRATION_ENTRIES.filter(x=>accepted.has(x.system)&&
  (region==='all'||x.region===region)&&(!norm||x.lookup.includes(norm)));
}
/**
 * Alineación explícita y segura: ninguna transformación entre sistemas
 * está auditada. No se permite habilitar una supuesta superposición 3D.
 */
export const MODEL_ALIGNMENT=Object.freeze({
 status:'unverified',
 calibratedPairs:Object.freeze([]),
 anatomicalLandmarksVerified:0,
 overlayAllowed:false,
 explanation:'Los modelos se normalizan por separado solo para encuadrar la cámara. No se superponen: faltan registros anatómicos, escala y orientación validados.'
});
export function overlayIsAllowed(a,b,alignment=MODEL_ALIGNMENT){
 return Boolean(a&&b&&a!==b&&alignment?.overlayAllowed===true&&
  alignment.anatomicalLandmarksVerified>=3&&
  alignment.calibratedPairs?.some(x=>(x[0]===a&&x[1]===b)||(x[0]===b&&x[1]===a)));
}
