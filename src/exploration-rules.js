/** Reglas puras del visor unificado. Las capas óseas de contexto NO se
 * confunden con articulaciones verificadas ni con el cráneo individual.
 */
export const QUICK_REGIONS=Object.freeze([
 {id:'all',label:'Todo'},
 {id:'head',label:'Cabeza'},
 {id:'neck',label:'Cuello'},
 {id:'chest',label:'Tórax'},
 {id:'back',label:'Espalda'},
 {id:'abdomen',label:'Abdomen'},
 {id:'upper',label:'Miembros superiores'},
 {id:'pelvis',label:'Pelvis'},
 {id:'lower',label:'Miembros inferiores'}
]);
export const JOINT_VIEWS=Object.freeze([
 {id:'all',label:'Conjunto articular completo'},
 {id:'ligaments',label:'Ligamentos'},
 {id:'bone-contact',label:'Huesos + meniscos/discos (inspección visual)'},
 {id:'discs',label:'Discos y meniscos'},
 {id:'capsules',label:'Cápsulas articulares'},
 {id:'bones',label:'Huesos de referencia'},
 {id:'membranes',label:'Membranas'}
]);
export const NERVE_CONTEXT=Object.freeze([
 {id:'all',label:'Nervios + columna vertebral'},
 {id:'neural',label:'Solo tejido nervioso'},
 {id:'vertebrae',label:'Solo columna vertebral'},
 {id:'no-bones',label:'Nervios + discos, sin huesos'},
 {id:'no-discs',label:'Nervios + huesos, sin discos'}
]);
export function visibleByLayer(entry,{system,layer='all',nerveBones=true,nerveDiscs=true,jointBoneOpacity=.33}={}){
 if(!entry)return false;
 const kind=entry.kind||'';
 if(system==='nerve'){
  if(kind==='bones'&&!nerveBones)return false;
  if(kind==='discs'&&!nerveDiscs)return false;
  if(layer==='all')return true;
  if(layer==='neural')return !['bones','discs','vessels'].includes(kind);
  if(layer==='vertebrae')return kind==='bones';
  if(layer==='no-bones')return kind!=='bones';
  if(layer==='no-discs')return kind!=='discs';
  return layer===kind;
 }
 if(system==='joint'){
  if(layer==='all')return true;
  if(layer==='ligaments')return kind==='ligament';
  if(layer==='bone-contact')return kind==='bone'||kind==='fibrocartilage';
  if(layer==='discs')return kind==='fibrocartilage';
  if(layer==='capsules')return kind==='capsule';
  if(layer==='bones')return kind==='bone';
  if(layer==='membranes')return kind==='membrane';
  return layer===kind;
 }
 if(layer==='all')return true;
 if(system==='muscle'){
  if(layer==='connective')return kind==='connective';
  return kind!=='connective'&&entry.layer===layer;
 }
 return layer===kind;
}
export function visibleInRegion(entry,region='all',system='bone'){
 if(!entry)return false;
 if(region==='all')return true;
 // La fuente articular agrupa huesos de varias regiones en 6 conjuntos.
 // Se preservan como contexto al explorar rodilla, cadera, mandíbula, etc.
 if(system==='joint'&&entry.kind==='bone')return true;
 // La columna se filtra por tramo: cervical, torácico, lumbar o sacro.
 // Evitar mostrar todas las vértebras al seleccionar solo cuello o tórax.
 return entry.region===region||
  (region==='back'&&entry.region==='spine')||
  (region==='head'&&entry.region==='skull')||
  (region==='chest'&&entry.region==='thorax');
}
/** Regiones que realmente contienen estructuras del sistema activo.
 * Los huesos de contexto articular no habilitan regiones ficticias.
 * Si todavía no se cargó un catálogo (óseo), ofrecemos el menú completo.
 */
export function regionsForSystem(entries,system){
 if(!Array.isArray(entries)||!entries.length)return QUICK_REGIONS;
 const relevant=entries.filter(entry=>!isContextBone(entry,system));
 return QUICK_REGIONS.filter(region=>region.id==='all'||
  relevant.some(entry=>visibleInRegion(entry,region.id,system)));
}
export function updateSelection(previous,id,{add=false,range=false,anchor=null,order=[]}={}){
 const next=new Set(previous);
 if(range&&anchor&&order.includes(anchor)&&order.includes(id)){
  const a=order.indexOf(anchor),b=order.indexOf(id);
  for(const item of order.slice(Math.min(a,b),Math.max(a,b)+1))next.add(item);
 }else if(add){
  if(next.has(id))next.delete(id);else next.add(id);
 }else{
  next.clear();next.add(id);
 }
 return next;
}
export function isContextBone(entry,system){
 return Boolean(entry&&(system==='joint'&&entry.kind==='bone'||system==='nerve'&&entry.kind==='bones'));
}
