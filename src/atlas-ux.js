/**
 * Presentación académica y navegación del visor. Sin crear datos anatómicos.
 * La clasificación por grupo es SOLO la que existe en el inventario de mallas.
 */
import {visibleInRegion} from './exploration-rules.js';

export const REVIEW_STATUS=Object.freeze({
 pendiente_cotejo:'Pendiente de cotejo',
 en_revision:'En revisión',
 revisado_con_libros:'Revisada con bibliografía'
});
export const GROUP_LABELS=Object.freeze({
 bone:'Huesos',muscle:'Músculos',superficial:'Músculos superficiales',
 deep:'Músculos profundos',connective:'Fascias y tendones',
 ligament:'Ligamentos',capsule:'Cápsulas articulares',
 fibrocartilage:'Discos y meniscos',membrane:'Membranas',
 artery:'Arterias',vein:'Venas',bones:'Huesos de referencia',
 discs:'Discos',vessels:'Vasos',central:'Sistema nervioso central',
 spinal:'Nervios espinales',plexus:'Plexos',
 'neurocranium':'Neurocráneo','viscerocranium':'Viscerocráneo',
 'No clasificado':'Sin clasificación confirmada'
});
const bookIds=new Set(['moore9','rouviere11']);
const sanitizeLabel=value=>typeof value==='string'&&value.trim()?value.trim():null;
export function groupId(entry){
 return sanitizeLabel(entry?.subregion)||sanitizeLabel(entry?.layer)||
  sanitizeLabel(entry?.kind)||null;
}
export function groupLabel(value){
 const raw=sanitizeLabel(value);
 return raw?GROUP_LABELS[raw]||raw:'Sin subgrupo registrado';
}
export function groupsForRegion(entries,region,system){
 if(!Array.isArray(entries))return [];
 const groups=new Map();
 for(const item of entries){
  if(!visibleInRegion(item,region,system))continue;
  const id=groupId(item);
  if(!id)continue;
  groups.set(id,(groups.get(id)||0)+1);
 }
 return [...groups].map(([id,count])=>({id,label:groupLabel(id),count}))
  .sort((a,b)=>a.label.localeCompare(b.label,'es'));
}
export function breadcrumbLabels({systemLabel,regionLabel,group}={}){
 return [sanitizeLabel(systemLabel)||'Sistema',
  sanitizeLabel(regionLabel)||'Todo el cuerpo',
  group&&group!=='all'?groupLabel(group):'Todos los subgrupos'];
}
const verifiedEvidence=entry=>{
 if(!entry||!sanitizeLabel(entry.reviewedBy))return false;
 const refs=Array.isArray(entry.sourceRefs)?entry.sourceRefs:[];
 const confirmed=new Set(refs.filter(x=>x?.verified===true&&bookIds.has(x.bookId)&&
  (sanitizeLabel(x.chapter)||sanitizeLabel(x.page)||sanitizeLabel(x.volume)))
  .map(x=>x.bookId));
 return confirmed.size===2;
};
export function reviewStatus(entry){
 if(entry?.reviewStatus==='en_revision')return 'en_revision';
 if(entry?.reviewStatus==='revisado_con_libros'&&verifiedEvidence(entry))
  return 'revisado_con_libros';
 return 'pendiente_cotejo';
}
export function anatomyCard(entry,{systemLabel='Sistema anatómico',regionLabel='No clasificada'}={}){
 if(!entry||typeof entry!=='object')return null;
 const status=reviewStatus(entry),verified=status==='revisado_con_libros';
 const location=[regionLabel,groupLabel(groupId(entry))].filter(Boolean).join(' · ');
 // Solo mostrar relaciones/funciones cuando se adjunta revisión real completa.
 const text=verified&&entry.anatomy&&typeof entry.anatomy==='object'?entry.anatomy:{};
 return Object.freeze({
  name:sanitizeLabel(entry.name)||'Sin etiqueta',
  originalName:sanitizeLabel(entry.originalName)||'No disponible',
  system:systemLabel,region:regionLabel,group:groupLabel(groupId(entry)),
  id:sanitizeLabel(entry.id)||'No disponible',
  sourceId:sanitizeLabel(entry.sourceId)||'No disponible',
  location,
  reviewStatus:status,reviewLabel:REVIEW_STATUS[status],
  description:verified&&sanitizeLabel(text.description)||'Descripción pendiente de cotejo con Moore y Rouvière.',
  relationships:verified&&sanitizeLabel(text.relationships)||'Relaciones anatómicas todavía sin verificar.',
  functionText:verified&&sanitizeLabel(text.function)||'Función o acción pendiente de revisión, cuando corresponda.',
  references:verified?'Referencia revisada registrada en el inventario editorial.':
   'Bibliografía prevista: Moore (9.ª ed.) y Rouvière/Delmas (11.ª ed.). Esta ficha aún no está cotejada.'
 });
}
export const TOUR_STEPS=Object.freeze([
 Object.freeze({
  title:'Explora por sistemas',
  body:'Cambia entre huesos, músculos, nervios, vasos, articulaciones y órganos desde SISTEMA ACTIVO. El atlas muestra un solo modelo por vez.',
  target:'active-system'
 }),
 Object.freeze({
  title:'Filtra por región y tejido',
  body:'En CAPAS Y TEJIDOS puedes elegir cabeza, cuello y otras regiones del sistema, o filtrar por sus capas. No necesitas abrir otra barra flotante.',
  target:'active-layer'
 }),
 Object.freeze({
  title:'Busca y estudia estructuras',
  body:'Pulsa Buscar para encontrar una pieza por nombre en todos los sistemas (también con / o Ctrl+K). Elige un resultado, gíralo y abre Ver ficha para estudiar sus detalles.',
  target:'bubble-list'
 }),
 Object.freeze({
  title:'Herramientas y observaciones',
  body:'Abre Estudio para guardar estructuras y repasarlas en 3D. En Más encontrarás las herramientas avanzadas y la ayuda. Usa Opiniones si detectas un nombre dudoso.',
  target:'bubble-more'
 })
]);
export const TOUR_STORAGE_KEY='atlas-tour-seen-v1';
