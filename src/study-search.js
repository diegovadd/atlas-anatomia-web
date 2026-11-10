/**
 * Atlas LAB 12 — búsqueda global por identificación de proveedor.
 * No agrega relaciones ni estructuras; los resultados proceden únicamente
 * de inventarios existentes o de mallas óseas realmente cargadas.
 */
export const SEARCH_MIN_LENGTH=2;
export const SEARCH_MAX_RESULTS=24;
export const SEARCH_MAX_CHARS=90;
export function normalizeSearch(value){
 return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLocaleLowerCase('es').trim().replace(/\s+/g,' ');
}
function sortWeight(entry,q){
 const name=normalizeSearch(entry.name);
 const original=normalizeSearch(entry.originalName);
 const id=normalizeSearch(entry.id);
 const source=normalizeSearch(entry.sourceId);
 const combined=[name,original,id,source].join(' ');
 if(name===q)return 0;
 if(original===q)return 1;
 if(name.startsWith(q))return 2;
 if(original.startsWith(q))return 3;
 if(name.split(/\s+/).some(word=>word.startsWith(q)))return 4;
 if(name.includes(q))return 5;
 if(original.includes(q))return 6;
 if(source.includes(q)||id.includes(q))return 7;
 const tokens=q.split(' ').filter(Boolean);
 if(tokens.every(token=>combined.includes(token)))return 8;
 return Infinity;
}
export function findStudyStructures(entries,query,{limit=SEARCH_MAX_RESULTS}={}){
 if(!Array.isArray(entries)||!Number.isInteger(limit)||limit<1)return [];
 const q=normalizeSearch(query).slice(0,SEARCH_MAX_CHARS);
 if(q.length<SEARCH_MIN_LENGTH)return [];
 const seen=new Set(),results=[];
 for(const entry of entries){
  if(!entry||typeof entry.name!=='string'||typeof entry.system!=='string'||
   typeof entry.id!=='string'||typeof entry.sourceId!=='string')continue;
  const weight=sortWeight(entry,q);
  if(!Number.isFinite(weight))continue;
  const key=entry.system+'|'+entry.id+'|'+entry.sourceId;
  if(seen.has(key))continue;
  seen.add(key);
  results.push({entry,weight});
 }
 return results.sort((a,b)=>a.weight-b.weight||
  a.entry.name.localeCompare(b.entry.name,'es')||
  a.entry.system.localeCompare(b.entry.system,'es')||
  a.entry.id.localeCompare(b.entry.id,'es')).slice(0,Math.min(limit,SEARCH_MAX_RESULTS))
  .map(x=>x.entry);
}
export function exactModelEntry(entry,model){
 if(!entry||!model)return null;
 const candidate=model.byId?.get(entry.id);
 if(!candidate||candidate.system!==entry.system||
  candidate.sourceId!==entry.sourceId||
  candidate.originalName!==entry.originalName||
  !model.meshesById?.get(entry.id)?.length)return null;
 return candidate;
}
