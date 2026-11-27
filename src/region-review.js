/**
 * LAB 13 — sesión efímera por región del modelo cargado.
 * No crea estructuras ni certifica sus nombres. El repaso regional NO
 * agrega favoritos ni escribe calificaciones al almacenamiento local.
 */
import {favoriteFromEntry,favoriteKey} from './study-favorites.js';
import {isContextBone} from './exploration-rules.js';
export const REGION_REVIEW_LIMIT=12;
export function regionReviewQueue(model,{system,sourceUrl,accept=()=>true,limit=REGION_REVIEW_LIMIT}={}){
 if(!model||!Array.isArray(model.entries)||typeof system!=='string'||
  typeof sourceUrl!=='string'||typeof accept!=='function'||
  !Number.isInteger(limit)||limit<1)return [];
 const found=[],seen=new Set();
 for(const entry of model.entries){
  if(entry?.system!==system||isContextBone(entry,system)||!accept(entry))continue;
  const meshes=model.meshesById?.get(entry.id);
  if(!Array.isArray(meshes)||!meshes.length||model.byId?.get(entry.id)!==entry)continue;
  try{
   const favorite=favoriteFromEntry(entry,sourceUrl);
   const key=favoriteKey(favorite);
   if(seen.has(key))continue;
   seen.add(key);found.push(favorite);
  }catch{
   // Un registro sin identidad estable no debe entrar en la autoevaluación.
  }
 }
 return found.sort((a,b)=>a.name.localeCompare(b.name,'es')||
  a.id.localeCompare(b.id,'es')).slice(0,Math.min(limit,REGION_REVIEW_LIMIT));
}
export function reviewSessionSummary(review){
 const answered=Number.isSafeInteger(review?.answered)?review.answered:0;
 const remembered=Number.isSafeInteger(review?.remembered)?review.remembered:0;
 const practice=Number.isSafeInteger(review?.practice)?review.practice:0;
 if(answered<0||practice<0||remembered<0||answered!==remembered+practice)
  return Object.freeze({answered:0,remembered:0,practice:0});
 return Object.freeze({answered,remembered,practice});
}
