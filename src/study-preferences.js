// Opciones locales de estudio. Nunca se guardan datos anatómicos en este ajuste.
export const STUDY_PREFERENCES_KEY='atlas:study-ui';

export function normalizeStudyPreferences(value){
 return {autoFocusOnIsolate:value&&typeof value==='object'&&typeof value.autoFocusOnIsolate==='boolean'?value.autoFocusOnIsolate:true};
}

export function readStudyPreferences(storage){
 try{return normalizeStudyPreferences(JSON.parse(storage?.getItem(STUDY_PREFERENCES_KEY)||'null'))}
 catch{return normalizeStudyPreferences(null)}
}

export function saveStudyPreferences(storage,preferences){
 try{
  storage?.setItem(STUDY_PREFERENCES_KEY,JSON.stringify(normalizeStudyPreferences(preferences)));
  return true;
 }catch{return false}
}
