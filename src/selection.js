import {skullBoneId,boneSide} from './anatomy-data.js';

/**
 * A maximum of two selectable mesh entries. Plain click replaces the group;
 * Ctrl/Shift click appends/removes. A third selection replaces the oldest.
 */
/**
 * A dedicated UI toggle supports touch devices and browsers where Ctrl/Shift
 * is intercepted by camera controls. Modifier keys remain a shortcut.
 */
export function wantsExtendedSelection(event={},multiMode=false){
 return Boolean(multiMode||event.ctrlKey||event.shiftKey||event.metaKey);
}

export function updateDualSelection(previous=[], entry,extend=false){
 if(!entry)return [];
 if(!extend)return [entry];
 const exists=previous.some(item=>item.id===entry.id);
 if(exists)return previous.filter(item=>item.id!==entry.id);
 return [...previous.slice(-1),entry];
}

/**
 * Find only the actual opposite-sided mesh already present in the 3D model.
 * No symmetry or geometry is synthesized when the pair is absent.
 */
export function findContralateralBone(entries=[],entry){
 const id=skullBoneId(entry?.name||'');
 const side=boneSide(entry?.name||'');
 if(!id||!side)return null;
 const opposite=side==='left'?'right':'left';
 return entries.find(candidate=>candidate.id!==entry.id &&
  skullBoneId(candidate.name)===id && boneSide(candidate.name)===opposite) || null;
}

export function selectBilateralPair(entries=[],entry){
 const opposite=findContralateralBone(entries,entry);
 return opposite?[entry,opposite]:entry?[entry]:[];
}
