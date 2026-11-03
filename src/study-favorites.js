/**
 * Atlas LAB 07 — favoritos locales para identificación y autoevaluación.
 * Las tarjetas se limitan a la etiqueta de una malla: no son fichas
 * anatómicas verificadas. No almacenan datos clínicos ni coordenadas.
 */
export const FAVORITES_SCHEMA='atlas-favorites-v1';
export const FAVORITES_STORAGE_KEY='atlas-study-favorites-v1';
export const FAVORITES_MAX=80;
const ids=new Set(['bone','muscle','nerve','vessel','joint','viscera']);
const textOk=(s,max)=>typeof s==='string'&&s.length>0&&s.length<=max;
export function favoriteKey(item){
 return item.system+'|'+item.id+'|'+item.sourceId;
}
export function favoriteFromEntry(entry,sourceUrl){
 const item={
  system:entry?.system,id:entry?.id,sourceId:entry?.sourceId,
  sourceUrl,name:entry?.name,originalName:entry?.originalName,
  region:entry?.region||null
 };
 if(!validFavorite(item))throw new TypeError('Estructura no identificada para favoritos');
 return Object.freeze(item);
}
export function validFavorite(f,sourceMap=null){
 if(!f||typeof f!=='object'||Array.isArray(f)||!ids.has(f.system)||
  !textOk(f.id,220)||!textOk(f.sourceId,220)||
  !textOk(f.sourceUrl,700)||!/^https:\/\//.test(f.sourceUrl)||
  !textOk(f.name,220)||!textOk(f.originalName,220)||
  !(f.region===null||f.region===undefined||textOk(f.region,40)))return false;
 if(sourceMap&&(!sourceMap.has(f.system)||sourceMap.get(f.system)?.url!==f.sourceUrl))return false;
 return true;
}
export function parseFavorites(raw,sourceMap){
 if(!raw)return [];
 try{
  const data=typeof raw==='string'?JSON.parse(raw):raw;
  if(data?.schema!==FAVORITES_SCHEMA||!Array.isArray(data?.favorites)||
   data.favorites.length>FAVORITES_MAX)return [];
  const unique=new Set();
  return data.favorites.filter(f=>{
   if(!validFavorite(f,sourceMap))return false;
   const key=favoriteKey(f);
   if(unique.has(key))return false;
   unique.add(key);return true;
  }).map(f=>Object.freeze({
   system:f.system,id:f.id,sourceId:f.sourceId,sourceUrl:f.sourceUrl,
   name:f.name,originalName:f.originalName,region:f.region||null
  }));
 }catch{return []}
}
export function serializeFavorites(favorites){
 if(!Array.isArray(favorites)||favorites.length>FAVORITES_MAX||
  !favorites.every(f=>validFavorite(f))||
  new Set(favorites.map(favoriteKey)).size!==favorites.length)throw new TypeError('Favoritos inválidos');
 return JSON.stringify({schema:FAVORITES_SCHEMA,favorites});
}
export function toggleFavorite(favorites,favorite){
 if(!validFavorite(favorite))throw new TypeError('Favorito inválido');
 const key=favoriteKey(favorite);
 if(favorites.some(f=>favoriteKey(f)===key))
  return favorites.filter(f=>favoriteKey(f)!==key);
 if(favorites.length>=FAVORITES_MAX)return favorites;
 return [...favorites,favorite];
}
/** Rechazar coincidencias dudosas; no reasignar favoritos tras cambios de mallas. */
export function resolveFavorite(favorite,model){
 const item=model?.byId?.get(favorite?.id);
 const meshes=model?.meshesById?.get(favorite?.id);
 if(!Array.isArray(meshes)||meshes.length===0||
  !item||item.system!==favorite.system||
  item.sourceId!==favorite.sourceId||
  item.originalName!==favorite.originalName)return null;
 return item;
}
export function wrapReviewIndex(index,length){
 if(!Number.isInteger(length)||length<1)return 0;
 return ((index%length)+length)%length;
}
