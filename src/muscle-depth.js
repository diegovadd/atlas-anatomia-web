/**
 * Navegación por planos musculares: estado reversible e independiente de Three.js.
 * Nunca modifica geometría ni la clasificación médica; solo visibilidad local.
 */
export function muscleVisible(entry,{
 region='all',layerMode='all',sideMode='all',kindMode='all',
 isolate=false,selectedId=null,hiddenIds=new Set()
}={}){
 return !hiddenIds.has(entry.id)&&
  (region==='all'||entry.region===region)&&
  (layerMode==='all'||entry.layer===layerMode)&&
  (sideMode==='all'||(sideMode==='midline'?!entry.side||entry.side==='midline':entry.side===sideMode))&&
  (kindMode==='all'||(entry.kind||'muscle')===kindMode)&&
  (!isolate||selectedId===null||entry.id===selectedId);
}
export function hideMuscle(hiddenIds,history,id){
 if(id===null||id===undefined||hiddenIds.has(id))return false;
 hiddenIds.add(id);history.push(id);return true;
}
export function restoreLastMuscle(hiddenIds,history){
 while(history.length){
  const id=history.pop();
  if(hiddenIds.delete(id))return id;
 }
 return null;
}
export function restoreMuscle(hiddenIds,history,id){
 if(!hiddenIds.delete(id))return false;
 const i=history.lastIndexOf(id);
 if(i>=0)history.splice(i,1);
 return true;
}
export function restoreAllMuscles(hiddenIds,history){
 const count=hiddenIds.size;
 hiddenIds.clear();history.length=0;
 return count;
}
export function visibleMuscleHits(intersections,meshToEntry){
 const hits=[],seen=new Set();
 for(const hit of intersections){
  const entry=meshToEntry.get(hit.object);
  if(!entry||seen.has(entry.id))continue;
  seen.add(entry.id);hits.push(entry);
 }
 return hits;
}
