/**
 * LAB 14 — auditoría técnica de inventarios y geometrías 3D cargadas.
 * Detecta discrepancias inspeccionables, NO demuestra exactitud anatómica.
 * Solo utiliza campos del inventario en memoria y su procedencia pública.
 */
import {reviewStatus} from './atlas-ux.js';
export const AUDIT_SCHEMA='atlas-model-audit-v1';
export const AUDIT_CATEGORIES=Object.freeze({
 missing:'Inventario sin malla',
 unclassified:'Clasificación pendiente',
 duplicate:'Etiqueta posiblemente repetida',
 identifier:'Identificador provisional'
});
const clean=(v,max=220)=>typeof v==='string'?v.trim().slice(0,max):'';
export function normalizeAuditName(value){
 return clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLocaleLowerCase('es').replace(/\s+/g,' ');
}
export function auditLoadedModel(model,{system,source}={}){
 if(!model||!Array.isArray(model.entries)||
  !(model.byId instanceof Map)||!(model.meshesById instanceof Map)||
  !source||typeof system!=='string'||!clean(source.url,700).startsWith('https://'))
  throw new TypeError('No hay un modelo cargado y fuente identificable para auditar');
 const entries=model.entries.filter(e=>e?.system===system);
 const issues=[],rows=[],names=new Map();
 const counts={
  inventory:entries.length,withMesh:0,missing:0,
  unclassified:0,duplicateGroups:0,unstableIds:0,
  pendingReview:0,meshObjects:0
 };
 const issue=(type,e,detail)=>{
  issues.push(Object.freeze({
   type,entryId:e?.id||null,name:clean(e?.name)||'(sin nombre)',
   detail
  }));
 };
 for(const entry of entries){
  const key=clean(entry.id),name=clean(entry.name);
  const sourceId=clean(entry.sourceId);
  const ms=model.meshesById.get(entry.id);
  const present=model.byId.get(entry.id)===entry&&Array.isArray(ms)&&ms.length>0;
  const provisional=/^(bone-\d+|organ-source-\d+)$/.test(key);
  const unclassified=!clean(entry.region)||!clean(entry.kind)||
   entry.kind==='No clasificado'||entry.subregion==='Sin clasificación confirmada'||
   /^(malla sin etiqueta|hueso sin etiqueta|unnamed mesh)$/i.test(name);
  const status=reviewStatus(entry);
  if(present){counts.withMesh++;counts.meshObjects+=ms.length}
  else{counts.missing++;issue('missing',entry,'El inventario incluye la entrada, pero no hay una malla asociada y coincidente.')}
  if(unclassified){counts.unclassified++;issue('unclassified',entry,'Región, tipo o nombre insuficientemente clasificado.')}
  if(provisional){counts.unstableIds++;issue('identifier',entry,'ID generado desde el orden de mallas, no es estable entre revisiones.')}
  if(status!=='revisado_con_libros')counts.pendingReview++;
  const normalized=normalizeAuditName(name);
  if(normalized&&present){
   if(!names.has(normalized))names.set(normalized,[]);
   names.get(normalized).push(entry);
  }
  rows.push(Object.freeze({
   system,id:key,name,originalName:clean(entry.originalName),
   sourceId,region:clean(entry.region,80),kind:clean(entry.kind,80),
   meshCount:present?ms.length:0,status,provisional
  }));
 }
 for(const group of names.values()){
  if(group.length<2)continue;
  counts.duplicateGroups++;
  issue('duplicate',group[0],
   group.length+' entradas con el mismo nombre visible. Pueden ser pares anatómicos o mallas distintas; cotejar lateralidad.');
 }
 const report=Object.freeze({
  schema:AUDIT_SCHEMA,
  system,systemLabel:clean(source.label,100)||system,
  sourceUrl:clean(source.url,700),sourceLicense:clean(source.license,260),
  note:'Diagnóstico técnico: no verifica exactitud anatómica, lateralidad ni bibliografía.',
  counts:Object.freeze(counts),
  issues:Object.freeze(issues),
  rows:Object.freeze(rows)
 });
 return report;
}
export function exportAuditReport(report){
 if(report?.schema!==AUDIT_SCHEMA||!Array.isArray(report.rows)||
  !Array.isArray(report.issues))throw new TypeError('Informe de auditoría inválido');
 // Exportación estática sin identificadores de usuario, historial de estudio ni notas.
 return JSON.stringify(report,null,2);
}
