/** Registro preliminar de puntos sobre mallas, independiente de Three.js.
 * NO calcula coincidencia geométrica ni habilita superposición.
 * Las posiciones son coordenadas del root GLTF de cada fuente, en sus propias unidades.
 */
export const LANDMARKS_SCHEMA='atlas-landmarks-local-v1';
const validNumber=n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e8;
const validText=(s,max)=>typeof s==='string'&&s.trim().length>0&&s.length<=max;
export function landmarkKey(label){
 return String(label||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,' ');
}
export function validLandmark(record,systems){
 if(!record||typeof record!=='object'||Array.isArray(record))return false;
 if(!validText(record.id,90)||!validText(record.label,90)||!validText(record.system,32)||
  !validText(record.sourceUrl,700)||!validText(record.meshId,220))return false;
 if(!(systems instanceof Map)||!systems.has(record.system))return false;
 // Impedir que un JSON antiguo se atribuya a una revisión diferente.
 if(record.sourceUrl!==systems.get(record.system).url)return false;
 if(record.note!==undefined&&(typeof record.note!=='string'||record.note.length>240))return false;
 if(!Array.isArray(record.localPoint)||record.localPoint.length!==3||
  !record.localPoint.every(validNumber))return false;
 return record.coordinateFrame==='gltf-scene-local';
}
export function makeLandmark({id,label,system,sourceUrl,meshId,note='',localPoint},systems){
 const record={id:String(id),label:String(label).trim(),system:String(system),sourceUrl:String(sourceUrl),
  meshId:String(meshId),note:String(note).trim(),localPoint:[...localPoint],
  coordinateFrame:'gltf-scene-local'};
 if(!validLandmark(record,systems))throw new TypeError('Punto anatómico no válido');
 return Object.freeze(record);
}
export function landmarksByLabel(records=[]){
 const map=new Map();
 for(const r of records){
  const key=landmarkKey(r.label);
  if(!map.has(key))map.set(key,[]);
  map.get(key).push(r);
 }
 return [...map].map(([key,points])=>({
  key,label:points[0].label,points,
  distinctSystems:[...new Set(points.map(p=>p.system))],
  candidatePair: new Set(points.map(p=>p.system)).size>=2
 }));
}
export function exportLandmarks(records,systems){
 if(!Array.isArray(records)||!records.every(r=>validLandmark(r,systems)))throw new Error('Colección de puntos no válida');
 return JSON.stringify({
  schema:LANDMARKS_SCHEMA,alignmentVerified:false,coordinateFrame:'gltf-scene-local',
  annotation:'Las coordenadas se refieren a cada fuente; ninguna transformación entre modelos ha sido verificada.',
  landmarks:records
 },null,2);
}
export function importLandmarks(json,systems,{maxRecords=300}={}){
 const data=typeof json==='string'?JSON.parse(json):json;
 if(!data||data.schema!==LANDMARKS_SCHEMA||data.alignmentVerified!==false||
  data.coordinateFrame!=='gltf-scene-local'||!Array.isArray(data.landmarks)||
  data.landmarks.length>maxRecords)throw new Error('Formato, límite o alineación no válidos');
 if(!data.landmarks.every(r=>validLandmark(r,systems)))throw new Error('Puntos incompatibles o coordenadas inválidas');
 if(new Set(data.landmarks.map(r=>r.id)).size!==data.landmarks.length)throw new Error('Identificadores duplicados');
 return data.landmarks.map(r=>Object.freeze({
  id:r.id,label:r.label,system:r.system,sourceUrl:r.sourceUrl,meshId:r.meshId,note:r.note||'',
  localPoint:[...r.localPoint],coordinateFrame:r.coordinateFrame
 }));
}
