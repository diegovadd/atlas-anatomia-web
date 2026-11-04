/**
 * LAB 07 — autoevaluación de identificación visual.
 * Resultados declarados por el estudiante, NO una calificación anatómica.
 * Las claves incluyen identificador y revisión del GLB; no se intercambian
 * resultados entre distintas fuentes o geometrías.
 */
import {favoriteKey,validFavorite,FAVORITES_MAX} from './study-favorites.js';
export const STUDY_PROGRESS_SCHEMA='atlas-study-progress-v1';
export const STUDY_PROGRESS_KEY='atlas-study-progress-v1';
export const MAX_ATTEMPTS=1000000;
const assessments=new Set(['remembered','practice']);
const integer=n=>Number.isSafeInteger(n)&&n>=0&&n<=MAX_ATTEMPTS;
const findFavorite=(key,url,favorites)=>favorites.find(f=>favoriteKey(f)===key&&f.sourceUrl===url);
export function validProgress(row,favorites){
 return row&&typeof row==='object'&&!Array.isArray(row)&&
  typeof row.key==='string'&&row.key.length>0&&row.key.length<=700&&
  typeof row.sourceUrl==='string'&&row.sourceUrl.length<=700&&
  integer(row.remembered)&&integer(row.practice)&&
  row.remembered+row.practice<=MAX_ATTEMPTS&&
  typeof row.needsPractice==='boolean'&&
  Boolean(findFavorite(row.key,row.sourceUrl,favorites));
}
export function parseProgress(raw,favorites){
 if(!raw)return [];
 try{
  const data=typeof raw==='string'?JSON.parse(raw):raw;
  if(data?.schema!==STUDY_PROGRESS_SCHEMA||!Array.isArray(data.records)||
   data.records.length>FAVORITES_MAX||!Array.isArray(favorites))return [];
  const known=new Set();
  return data.records.filter(row=>{
   if(!validProgress(row,favorites)||known.has(row.key))return false;
   known.add(row.key);return true;
  }).map(row=>Object.freeze({
   key:row.key,sourceUrl:row.sourceUrl,
   remembered:row.remembered,practice:row.practice,
   needsPractice:row.needsPractice
  }));
 }catch{return []}
}
export function serializeProgress(records,favorites){
 if(!Array.isArray(records)||records.length>FAVORITES_MAX||
  !records.every(row=>validProgress(row,favorites))||
  new Set(records.map(row=>row.key)).size!==records.length)throw new TypeError('Progreso incompatible');
 return JSON.stringify({schema:STUDY_PROGRESS_SCHEMA,records});
}
export function progressFor(favorite,records=[]){
 const key=favoriteKey(favorite);
 return records.find(r=>r.key===key&&r.sourceUrl===favorite.sourceUrl)||null;
}
export function recordResult(records,favorite,assessment){
 if(!validFavorite(favorite)||!assessments.has(assessment)||
  !Array.isArray(records))throw new TypeError('Evaluación no válida');
 const prev=progressFor(favorite,records);
 const remembered=(prev?.remembered||0)+(assessment==='remembered'?1:0);
 const practice=(prev?.practice||0)+(assessment==='practice'?1:0);
 if(remembered+practice>MAX_ATTEMPTS)throw new RangeError('Límite de intentos alcanzado');
 const next=Object.freeze({
  key:favoriteKey(favorite),sourceUrl:favorite.sourceUrl,
  remembered,practice,needsPractice:assessment==='practice'
 });
 return [...records.filter(r=>r.key!==next.key),next];
}
export function practiceFavorites(favorites,records){
 return favorites.filter(f=>progressFor(f,records)?.needsPractice===true);
}
export function pruneProgress(records,favorites){
 return records.filter(r=>validProgress(r,favorites));
}
export function progressSummary(favorites,records){
 const current=pruneProgress(records,favorites);
 return Object.freeze({
  reviewed:current.filter(r=>r.remembered+r.practice>0).length,
  remembered:current.reduce((sum,r)=>sum+r.remembered,0),
  practice:current.reduce((sum,r)=>sum+r.practice,0),
  toPractice:practiceFavorites(favorites,current).length
 });
}
