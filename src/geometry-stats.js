import {skullBoneId,skullInventory} from './anatomy-data.js';

/** Tally indexed and nonindexed triangle meshes; excludes geometry draw groups and lines. */
export function meshTriangleCount(geometry){
 if(!geometry)return 0;
 const count=geometry.index?.count ?? geometry.attributes?.position?.count ?? 0;
 return Number.isFinite(count)&&count>0?Math.floor(count/3):0;
}

/**
 * Measures nominal skull coverage from independently named meshes, not anatomy
 * or physical resolution. Unknown meshes are kept visible for audit.
 */
export function summarizeSkullGeometry(meshes=[]){
 const recognized=[];
 let triangles=0,unknown=0,meshCount=0;
 const ids=new Set();
 for(const mesh of meshes){
  if(mesh?.isMesh===false)continue;
  meshCount++;
  const name=String(mesh?.name||'');
  const id=skullBoneId(name);
  if(!id){unknown++;continue}
  ids.add(id);
  recognized.push(name);
  triangles+=meshTriangleCount(mesh.geometry);
 }
 return {
  meshes:meshCount,
  skullMeshes:recognized.length,
  boneTypes:ids.size,
  triangles,
  unknownMeshes:unknown,
  coverage:skullInventory(recognized)
 };
}
export function canUseDetailedSkull(summary){
 return summary?.boneTypes>=2&&summary?.skullMeshes>=2&&summary?.triangles>0;
}
