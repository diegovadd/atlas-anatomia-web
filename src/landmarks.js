import {skullBoneId} from './anatomy-data.js';

/**
 * Suggestions for manually located osteological landmarks.
 * Names are NOT geometric coordinates, and are NOT a reviewed citation from
 * Moore/Rouvière. The reviewer must click the actual visible structure.
 */
export const SKULL_LANDMARK_SUGGESTIONS=Object.freeze({
 'frontal bone':['Glabela','Arco superciliar','Borde supraorbitario','Escotadura supraorbitaria','Espina nasal del frontal'],
 'parietal bone':['Eminencia parietal','Línea temporal superior','Línea temporal inferior','Borde sagital'],
 'temporal bone':['Apófisis mastoides','Apófisis estiloides','Meato acústico externo','Fosa mandibular','Apófisis cigomática'],
 'occipital bone':['Protuberancia occipital externa','Línea nucal superior','Foramen magno','Cóndilo occipital'],
 'sphenoid bone':['Ala mayor','Ala menor','Apófisis pterigoides','Silla turca','Conducto óptico'],
 'ethmoid bone':['Crista galli','Lámina cribosa','Lámina perpendicular','Laberinto etmoidal'],
 'maxilla':['Apófisis alveolar','Foramen infraorbitario','Apófisis palatina','Espina nasal anterior'],
 'mandible':['Foramen mentoniano','Ángulo mandibular','Apófisis coronoides','Cóndilo mandibular','Foramen mandibular'],
 'zygomatic bone':['Apófisis frontal','Apófisis temporal','Cara orbitaria','Foramen cigomaticofacial'],
 'nasal bone':['Borde superior','Borde inferior','Cara anterior'],
 'lacrimal bone':['Surco lagrimal','Cresta lagrimal posterior'],
 'palatine bone':['Lámina horizontal','Lámina perpendicular','Apófisis piramidal','Apófisis orbitaria','Apófisis esfenoidal'],
 'vomer':['Ala del vómer','Borde superior','Borde inferior'],
 'inferior nasal concha bone':['Apófisis lagrimal','Apófisis maxilar','Apófisis etmoidal','Borde libre']
});

export function landmarkSuggestions(boneName=''){
 return SKULL_LANDMARK_SUGGESTIONS[skullBoneId(boneName)]||[];
}
export function validLandmarkLabel(input){
 const label=typeof input==='string'?input.trim().replace(/\s+/g,' '):'';
 return label.length>=3&&label.length<=72?label:null;
}
export function normalizeLandmark(item){
 if(!item||typeof item!=='object')return null;
 const id=typeof item.id==='string'&&item.id.length<=90?item.id:null;
 const name=typeof item.boneName==='string'&&item.boneName.length<=200?item.boneName:null;
 const label=validLandmarkLabel(item.label);
 const meshId=item.meshId;
 const point=item.point;
 if(!id||!name||!label||!Number.isSafeInteger(meshId)||meshId<0||meshId>100000)return null;
 if(!Array.isArray(point)||point.length!==3||!point.every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=100000))return null;
 const note=typeof item.note==='string'?item.note.trim().replace(/\s+/g,' ').slice(0,350):'';
 return {id,boneName:name,meshId,label,point:[...point],...(note?{note}:{})};
}
export function normalizeLandmarkCollection(items){
 if(!Array.isArray(items))return [];
 const ids=new Set();const valid=[];
 for(const item of items.slice(0,200)){
  const annotation=normalizeLandmark(item);
  if(!annotation||ids.has(annotation.id))continue;
  ids.add(annotation.id);valid.push(annotation);
  if(valid.length>=40)break;
 }
 return valid;
}
export function landmarkStorageKey(modelKey){
 const value=String(modelKey||'default').slice(0,220);
 return 'atlas:osteological-markers:v1:'+value;
}
export function landmarksForBone(items,bone){
 return (Array.isArray(items)?items:[]).filter(item=>item.meshId===bone?.id&&item.boneName===bone?.name);
}
