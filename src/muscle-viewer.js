import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {MUSCLE_REGIONS,identifyMuscle,auditMuscleMeshList,muscleDraft} from './muscle-data.js';
import {createMuscleDemo,DEMO_MUSCLES} from './muscle-demo.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {DETAILED_MODEL,classifySourceMuscle,layerMatches,regionFor,sourceLayer,detailAudit} from './muscle-detailed-data.js';
import {muscleVisible,hideMuscle,restoreLastMuscle,restoreMuscle,restoreAllMuscles,visibleMuscleHits} from './muscle-depth.js';

const $=id=>document.getElementById(id);
const state={model:null,guide:null,bones:[],bonesVisible:false,guideVisible:true,demo:false,
 modelKind:'demo',loading:false,layerMode:'all',sideMode:'all',kindMode:'all',entries:[],selected:null,region:'all',
 query:'',isolate:false,loaded:false,ghostMode:false,
 hiddenIds:new Set(),hiddenHistory:[],lastPointer:null,meshToEntry:new Map()};
const renderer=new THREE.WebGLRenderer({canvas:$('muscle-canvas'),antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=.9;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(40,1,.01,120);
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.enablePan=true;controls.minDistance=.08;controls.maxDistance=35;
const root=new THREE.Group();scene.add(root);
scene.add(new THREE.HemisphereLight(0xdfeae5,0x25343f,1.2));
const light=new THREE.DirectionalLight(0xffede1,2);light.position.set(3,5,4);scene.add(light);
const backLight=new THREE.DirectionalLight(0xa9bfc8,.7);backLight.position.set(-3,2,-4);scene.add(backLight);
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
const initialView=new THREE.Vector3(0,0,4);
camera.position.copy(initialView);
function resize(){
 const viewport=$('muscle-viewport'),w=viewport.clientWidth,h=viewport.clientHeight;
 if(w<1||h<1)return;
 camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);
}
new ResizeObserver(resize).observe($('muscle-viewport'));resize();
function animate(){requestAnimationFrame(animate);controls.update();renderer.render(scene,camera)}
animate();

function meshName(obj){
 const ud=Object.keys(obj.userData||{}).length?obj.userData:obj.parent?.userData||{};
 const names=[ud.name,ud.zname,obj.name,obj.parent?.name].filter(x=>typeof x==='string'&&x.trim());
 return names.find(name=>identifyMuscle(name))||names[0]||'Malla sin identificar';
}
function infoFor(entry){
 const info=muscleDraft(entry);
 $('muscle-name').textContent=info.name;
 $('muscle-region').textContent=regionFor(entry);
 const connective=entry.kind==='connective';
 $('muscle-selected-kind').textContent=connective?'TEJIDO CONECTIVO':'ESTRUCTURA MUSCULAR';
 $('muscle-info-kind').textContent=connective?'Tejido conectivo · no es un músculo':'Músculo';
 $('muscle-nomenclature-note').textContent=entry.translated
  ? 'Denominación española preliminar. Pendiente de cotejo terminológico y de geometría.'
  : 'Se conserva el nombre inglés original: traducción aún no verificada.';
 $('muscle-info-source').textContent=entry.source||'No especificada';
 $('muscle-info-side').textContent=entry.side==='left'?'Izquierdo':
  entry.side==='right'?'Derecho':entry.side==='midline'?'Línea media':'No especificada';
 $('muscle-side-warning').hidden=!entry.sideConflict;
 $('muscle-side-warning').textContent=entry.sideConflict
  ? 'Advertencia de origen: la malla se llama «'+entry.originalName+'», pero sus metadatos indican el lado '+(entry.reportedSide==='left'?'izquierdo':'derecho')+'. Verificar antes de usar como referencia anatómica.'
  : '';
 $('muscle-oinastatus').textContent=connective
  ? 'Esta pieza es un tendón, fascia o retináculo; no corresponde utilizar una ficha OINA muscular.'
  : 'Origen, inserción, inervación y acción todavía no están verificados bibliográficamente.';
 $('muscle-info-layer').textContent=entry.layer==='deep'?'Músculo profundo':'Músculo superficial';
 $('muscle-info-original').textContent=entry.originalName||entry.raw||'—';
 $('muscle-info-fma').textContent=entry.fma||'No disponible';
 $('muscle-origin').textContent=connective?'No aplica ficha OINA muscular':info.origin;
 $('muscle-insertion').textContent=connective?'Pendiente de ficha específica de tejido conectivo':info.insertion;
 $('muscle-innervation').textContent=connective?'No aplica ficha OINA muscular':info.innervation;
 $('muscle-action').textContent=connective?'No aplica ficha OINA muscular':info.action;
 $('muscle-placeholder').hidden=true;
 $('muscle-ficha').hidden=false;
 $('muscle-current').hidden=false;
 $('muscle-active-name').textContent=info.name;
 $('muscle-bubble-isolate').disabled=false;
}
function clearInfo(){
 $('muscle-placeholder').hidden=false;$('muscle-ficha').hidden=true;
 $('muscle-current').hidden=true;
 $('muscle-bubble-isolate').disabled=true;
}
function selectedFilter(entry){
 const norm=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 return (state.region==='all'||entry.region===state.region) &&
  layerMatches(entry,state.layerMode) &&
  (state.sideMode==='all'||(state.sideMode==='midline'?!entry.side||entry.side==='midline':entry.side===state.sideMode)) &&
  (state.kindMode==='all'||entry.kind===state.kindMode) &&
  (!state.query||norm(entry.displayName+' '+(entry.originalName||'')+' '+(entry.key||'')).includes(norm(state.query)));
}
function refreshVisibility(){
 const selectedId=state.selected?.id??null;
 const ghost=state.ghostMode&&Boolean(state.selected)&&!state.isolate;

 if(state.guide)state.guide.visible=state.guideVisible&&!state.isolate;
 for(const bone of state.bones)bone.visible=state.bonesVisible&&!state.isolate;
 for(const entry of state.entries){
  const m=entry.mesh.material;
  entry.mesh.visible=muscleVisible(entry,{
   region:state.region,layerMode:state.layerMode,sideMode:state.sideMode,kindMode:state.kindMode,isolate:state.isolate,
   selectedId,hiddenIds:state.hiddenIds
  });
  if(entry===state.selected){
   m.color.set('#e7d4a9');m.emissive.set('#6c4834');m.emissiveIntensity=.34;
   if(m.vertexColors){m.vertexColors=false;m.needsUpdate=true}
  }else{
   m.color.copy(entry.originalColor);
   m.emissive.set('#000000');m.emissiveIntensity=0;
   if(m.vertexColors!==entry.originalVertexColors){
    m.vertexColors=entry.originalVertexColors;m.needsUpdate=true;
   }
  }
  const fade=ghost&&entry!==state.selected;
  const transparent=fade||entry.originalTransparent;
  const opacity=fade?Math.min(entry.originalOpacity,.16):entry.originalOpacity;
  const depthWrite=fade?false:entry.originalDepthWrite;
  if(m.transparent!==transparent||m.opacity!==opacity||m.depthWrite!==depthWrite){
   m.transparent=transparent;m.opacity=opacity;m.depthWrite=depthWrite;m.needsUpdate=true;
  }
 }
 const hidden=state.hiddenIds.size;
 for(const id of ['muscle-bubble-peel','muscle-hide-selected'])$(id).disabled=!state.selected;
 for(const id of ['muscle-bubble-undo','muscle-undo-hidden'])$(id).disabled=hidden===0;
 for(const id of ['muscle-restore-hidden'])$(id).disabled=hidden===0;
 $('muscle-restore-all').hidden=hidden===0;
 $('muscle-hidden-counter').textContent=String(hidden);
 $('muscle-depth-status').textContent=hidden
  ? `${hidden} músculo${hidden===1?'':'s'} retirado${hidden===1?'':'s'} temporalmente.`
  : 'Ningún músculo retirado.';
 $('muscle-xray').setAttribute('aria-pressed',String(state.ghostMode));
 $('muscle-xray').textContent=state.ghostMode?'Desactivar transparencia':'Transparencia';
 $('muscle-isolate').disabled=!state.selected;
 $('muscle-bubble-isolate').disabled=!state.selected;
 $('muscle-isolate').textContent=state.isolate?'Mostrar músculos':'Aislar músculo';
 $('muscle-bones-toggle').setAttribute('aria-pressed',String(state.bonesVisible));
 $('muscle-bones-toggle').textContent=state.bonesVisible?'Ocultar esqueleto':'Mostrar esqueleto';
}
function renderList(){
 const container=$('muscle-list');container.replaceChildren();
 const list=state.entries.filter(selectedFilter).sort((a,b)=>a.displayName.localeCompare(b.displayName,'es'));
 $('muscle-list-count').textContent=list.length+' resultados';
 $('muscle-prev').disabled=list.length<1;
 $('muscle-next').disabled=list.length<1;
 if(!list.length){
  const p=document.createElement('p');p.className='muscle-empty';
  p.textContent=state.loaded?'No hay músculos reconocidos con este filtro.':'Importa un GLB segmentado para explorar los músculos.';
  container.appendChild(p);return;
 }
 for(const entry of list){
  const button=document.createElement('button');button.type='button';
  button.className='muscle-option'+(entry===state.selected?' active':'');
  button.setAttribute('aria-pressed',String(entry===state.selected));
  button.textContent=entry.displayName+(state.hiddenIds.has(entry.id)?' · retirado':'');
  if(state.hiddenIds.has(entry.id))button.classList.add('temporarily-hidden');
  if(entry.kind==='connective')button.classList.add('connective-entry');
  if(entry.sideConflict){button.classList.add('source-warning');button.title='Revisar discrepancia de lateralidad en la ficha';}
  if(state.modelKind==='detailed'&&!entry.translated)button.title='Nombre original en inglés; traducción por revisar';
  button.addEventListener('click',()=>{
   if(restoreMuscle(state.hiddenIds,state.hiddenHistory,entry.id))refreshVisibility();
   state.lastPointer=null;
   selectMuscle(entry,true);
  });
  container.appendChild(button);
 }
}
function browseMuscles(direction){
 const list=state.entries.filter(selectedFilter).sort((a,b)=>a.displayName.localeCompare(b.displayName,'es'));
 if(!list.length)return;
 const idx=list.indexOf(state.selected);
 const next=idx<0?(direction<0?list.length-1:0):(idx+direction+list.length)%list.length;
 const target=list[next];
 if(restoreMuscle(state.hiddenIds,state.hiddenHistory,target.id))refreshVisibility();
 state.lastPointer=null;
 selectMuscle(target,true);
 $('muscle-status').textContent=`Explorando ${next+1}/${list.length}: ${target.displayName}`;
}
function focusOnMeshes(meshes){
 const box=new THREE.Box3();
 for(const mesh of meshes)box.expandByObject(mesh);
 if(box.isEmpty())return;
 const center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
 const extent=Math.max(size.x,size.y,size.z,.08);
 controls.target.copy(center);
 camera.position.copy(center).add(new THREE.Vector3(.18,.08,1).normalize().multiplyScalar(extent*(state.demo?1.84:2.25)));
 camera.near=Math.max(extent/2000,.0001);camera.far=Math.max(200,extent*40);camera.updateProjectionMatrix();controls.update();
}
function selectMuscle(entry,focus=false){
 state.selected=entry;state.isolate=false;
 if(focus)state.lastPointer=null;
 refreshVisibility();renderList();infoFor(entry);
 if(focus)focusOnMeshes([entry.mesh]);
}
function hitMusclesAtLastPointer(){
 if(!state.lastPointer)return [];
 raycaster.setFromCamera(state.lastPointer,camera);
 const meshes=state.entries.filter(entry=>entry.mesh.visible).map(entry=>entry.mesh);
 return visibleMuscleHits(raycaster.intersectObjects(meshes,false),state.meshToEntry);
}
function peelSelectedMuscle(){
 if(!state.selected)return;
 const removed=state.selected;
 if(!hideMuscle(state.hiddenIds,state.hiddenHistory,removed.id))return;
 state.selected=null;state.isolate=false;
 refreshVisibility();clearInfo();renderList();
 // Tras retirar una superficie, probamos el mismo rayo y revelamos
 // el siguiente músculo sin girar ni acercar la cámara.
 const behind=hitMusclesAtLastPointer()[0];
 if(behind)selectMuscle(behind,false);
 const total=state.hiddenIds.size;
 $('muscle-status').textContent=`Retirado: ${removed.displayName}. ${behind?'Detrás: '+behind.displayName+'. ':''}${total} músculo${total===1?'':'s'} oculto${total===1?'':'s'} · usa Recuperar para volver atrás.`;
}
function undoPeel(){
 const id=restoreLastMuscle(state.hiddenIds,state.hiddenHistory);
 if(id===null)return;
 refreshVisibility();renderList();
 const entry=state.entries.find(e=>e.id===id);
 $('muscle-status').textContent=`Recuperado: ${entry?.displayName||'músculo'}. ${state.hiddenIds.size} retirados restantes.`;
}
function restoreAllPeels(){
 const total=restoreAllMuscles(state.hiddenIds,state.hiddenHistory);
 if(!total)return;
 refreshVisibility();renderList();
 $('muscle-status').textContent=`Restaurados ${total} músculos. Todas las capas vuelven a estar disponibles.`;
}
function changeRegion(id){
 state.region=id;state.selected=null;state.isolate=false;clearInfo();
 refreshVisibility();renderList();
 const shown=state.entries.filter(e=>muscleVisible(e,{
  region:state.region,layerMode:state.layerMode,sideMode:state.sideMode,kindMode:state.kindMode,hiddenIds:state.hiddenIds
 }));
 if(shown.length)focusOnMeshes(shown.map(e=>e.mesh));
}
function renderRegions(){
 const c=$('muscle-regions');c.replaceChildren();
 for(const group of [...MUSCLE_REGIONS,{id:'other',label:'Otras estructuras musculares'}]){
  const option=document.createElement('option');option.value=group.id;option.textContent=group.label;c.appendChild(option);
 }
 c.value='all';
}
function acceptModel(model,audit,{demo=false,guide=null,kind='import'}={}){
 // Clasificar antes de eliminar el modelo anterior: un GLB defectuoso
 // nunca debe destruir una vista funcional.
 const prepared=[],bones=[];
 model.traverse(obj=>{
  if(!obj.isMesh)return;
  const layer=sourceLayer(obj.userData||{});
  if(layer==='skeleton'){bones.push(obj);return}
  const info=classifySourceMuscle(meshName(obj),obj.userData||{});
  if(info)prepared.push({obj,info});
 });
 if(prepared.length<2)throw new Error('No se identificaron suficientes estructuras musculares en el modelo.');
 if(state.model){
  root.remove(state.model);
  state.model.traverse(obj=>{if(obj.isMesh)obj.material?.dispose?.()});
 }
 if(state.guide)root.remove(state.guide);
 state.guide=guide;state.guideVisible=true;state.demo=demo;
 state.sideMode='all';state.kindMode='all';
 state.hiddenIds.clear();state.hiddenHistory.length=0;
 state.lastPointer=null;state.ghostMode=false;state.meshToEntry.clear();
 state.modelKind=demo?'demo':kind;
 state.bones=[];state.bonesVisible=false;state.layerMode='all';
 state.model=model;root.add(model);
 if(guide)root.add(guide);
 for(const obj of bones){
  const material=obj.material?.clone?.()||new THREE.MeshStandardMaterial({color:'#e0dbd2'});
  material.transparent=true;material.opacity=.24;material.depthWrite=false;
  material.needsUpdate=true;obj.material=material;obj.visible=false;
  state.bones.push(obj);
 }
 const identified=new Set(prepared.map(x=>x.obj));
 model.traverse(obj=>{if(obj.isMesh&&!identified.has(obj)&&!bones.includes(obj))obj.visible=false});
 state.entries=prepared.map(({obj,info},id)=>{
  const material=obj.material?.clone?.()||new THREE.MeshStandardMaterial({
   color:'#a75d58',roughness:.94,metalness:0,side:THREE.DoubleSide
  });
  obj.material=material;
  obj.frustumCulled=false;
  return {...info,mesh:obj,raw:meshName(obj),id,
    originalColor:material.color.clone(),originalVertexColors:Boolean(material.vertexColors),
    originalOpacity:material.opacity,originalTransparent:material.transparent,
    originalDepthWrite:material.depthWrite};
 });
 state.meshToEntry=new Map(state.entries.map(entry=>[entry.mesh,entry]));
 state.loaded=true;state.selected=null;state.isolate=false;state.region='all';state.query='';
 $('muscle-onboarding').hidden=true;
 $('muscle-demo-banner').hidden=false;
 $('muscle-guide-toggle').hidden=!demo;
 $('muscle-load-detailed').hidden=!demo;
 $('muscle-bones-toggle').hidden=!state.bones.length;
 $('muscle-source-credit').hidden=kind!=='detailed';
 $('muscle-guide-toggle').setAttribute('aria-pressed','true');
 $('muscle-guide-toggle').textContent='Ocultar silueta';
 $('muscle-layer').value='all';$('muscle-side').value='all';$('muscle-kind').value='all';
 $('muscle-search').value='';$('muscle-regions').value='all';
 if(kind==='detailed'){
  $('muscle-banner-label').textContent='FUENTE ABIERTA · CC BY-SA 4.0';
  $('muscle-banner-title').textContent='Modelo anatómico segmentado';
  $('muscle-banner-description').textContent=
   'Écorché / BodyParts3D / Z-Anatomy: superficies musculares profundas y superficiales. Su precisión aún debe revisarse específicamente para Atlas.';
 }else if(demo){
  $('muscle-banner-label').textContent='PROTOTIPO · GEOMETRÍA ESQUEMÁTICA';
  $('muscle-banner-title').textContent='Explora músculos seleccionables en 3D';
  $('muscle-banner-description').textContent=
   'El ejemplo usa volúmenes simplificados. Para estudiar formas y trayectos, carga las mallas detalladas de fuente abierta.';
 }else{
  $('muscle-banner-label').textContent='ARCHIVO GLB IMPORTADO';
  $('muscle-banner-title').textContent='Mallas musculares del usuario';
  $('muscle-banner-description').textContent=
   'Modelo externo sin validación anatómica en Atlas. Comprueba origen, orientación y escala.';
 }
 root.position.set(0,0,0);root.updateMatrixWorld(true);
 const box=new THREE.Box3().setFromObject(model),center=box.getCenter(new THREE.Vector3()),min=box.min.clone();
 root.position.set(-center.x,-min.y,-center.z);root.updateMatrixWorld(true);
 refreshVisibility();renderList();clearInfo();
 const actualMuscles=state.entries.filter(e=>e.kind!=='connective').length;
 const connective=state.entries.length-actualMuscles;
 const issues=state.entries.filter(e=>e.sideConflict).length;
 $('muscle-catalogue-stat').textContent=`${actualMuscles} mallas musculares · ${connective} tejidos conectivos · ${issues} alertas de lateralidad`;
 focusOnMeshes(state.entries.map(e=>e.mesh));
 $('muscle-status').textContent=demo
  ? `EJEMPLO ESQUEMÁTICO · ${audit.recognizedTypes} tipos y ${state.entries.length} volúmenes. Carga el detallado para explorar superficies musculares reales.`
  : `${kind==='detailed'?'ÉCORCHÉ · CC BY-SA 4.0':'GLB IMPORTADO'} · ${actualMuscles} músculos, ${connective} piezas conectivas, ${issues} alertas de lateralidad y ${state.bones.length} mallas óseas. Validación anatómica pendiente.`;
}
function showBuiltInDemo(){
 const {muscles,guide}=createMuscleDemo(THREE);
 const samples=[];
 muscles.traverse(obj=>{if(obj.isMesh)samples.push({isMesh:true,name:obj.name,geometry:obj.geometry})});
 const audit=auditMuscleMeshList(samples);
 if(audit.recognizedTypes!==DEMO_MUSCLES.length||!audit.acceptable){
  $('muscle-status').textContent='No fue posible iniciar la demostración 3D.';
  return;
 }
 acceptModel(muscles,audit,{demo:true,guide});
 closeDrawers();
}
function setView(direction){
 if(!state.entries.length)return;
 const center=controls.target.clone();
 const radius=Math.max(.35,camera.position.distanceTo(center));
 const axis=direction==='back'?new THREE.Vector3(0,0,-1):
  direction==='side'?new THREE.Vector3(1,0,0):new THREE.Vector3(0,0,1);
 camera.position.copy(center).add(axis.multiplyScalar(radius));
 camera.up.set(0,1,0);camera.lookAt(center);controls.update();
}

function loadGLB(url){
 return new Promise((resolve,reject)=>{
  const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder),draco=new DRACOLoader();
  draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
  loader.setDRACOLoader(draco);
  loader.load(url,g=>{draco.dispose();resolve(g.scene)},event=>{
  if(state.loading&&event.total>0)
   $('muscle-status').textContent=`Descargando mallas detalladas… ${Math.round(event.loaded/event.total*100)}%`;
 },err=>{draco.dispose();reject(err)});
 });
}
$('muscle-file').addEventListener('change',async(event)=>{
 const file=event.target.files?.[0];if(!file)return;
 const status=$('muscle-status');
 if(!/\.glb$/i.test(file.name)){status.textContent='Elige un archivo GLB válido.';event.target.value='';return}
 if(file.size>150*1024*1024){status.textContent='El archivo supera 150 MB. Optimiza el GLB antes de importarlo.';event.target.value='';return}
 const url=URL.createObjectURL(file);
 status.textContent='Leyendo mallas musculares…';
 try{
  const model=await loadGLB(url);
  const meshes=[];model.traverse(obj=>{if(obj.isMesh)meshes.push({isMesh:true,name:meshName(obj),geometry:obj.geometry})});
  const audit=auditMuscleMeshList(meshes);
  if(!audit.acceptable)throw new Error('Se necesitan al menos dos tipos musculares identificados y geometría triangular.');
  acceptModel(model,audit,{demo:false,kind:'import'});
  closeDrawers();
 }catch(error){status.textContent='No se pudo cargar el modelo: '+(error?.message||'error desconocido');console.error(error)}
 finally{URL.revokeObjectURL(url);event.target.value=''}
});
$('muscle-regions').addEventListener('change',event=>changeRegion(event.target.value));
$('muscle-layer').addEventListener('change',event=>{
 state.layerMode=event.target.value;state.selected=null;state.isolate=false;
 clearInfo();refreshVisibility();renderList();
 const subset=state.entries.filter(e=>muscleVisible(e,{region:state.region,layerMode:state.layerMode,sideMode:state.sideMode,kindMode:state.kindMode,hiddenIds:state.hiddenIds}));
 if(subset.length)focusOnMeshes(subset.map(e=>e.mesh));
});
$('muscle-search').addEventListener('input',event=>{state.query=event.target.value.trim().toLowerCase();renderList()});
function updateCatalogueFilters(){
 state.selected=null;state.isolate=false;state.lastPointer=null;
 clearInfo();refreshVisibility();renderList();
 const visible=state.entries.filter(e=>muscleVisible(e,{
  region:state.region,layerMode:state.layerMode,
  sideMode:state.sideMode,kindMode:state.kindMode,
  hiddenIds:state.hiddenIds
 }));
 if(visible.length)focusOnMeshes(visible.map(e=>e.mesh));
}
$('muscle-side').addEventListener('change',event=>{
 state.sideMode=event.target.value;updateCatalogueFilters();
});
$('muscle-kind').addEventListener('change',event=>{
 state.kindMode=event.target.value;updateCatalogueFilters();
});
$('muscle-prev').addEventListener('click',()=>browseMuscles(-1));
$('muscle-next').addEventListener('click',()=>browseMuscles(1));
$('muscle-isolate').addEventListener('click',()=>{
 if(!state.selected)return;
 state.isolate=!state.isolate;refreshVisibility();
 if(state.isolate)focusOnMeshes([state.selected.mesh]);
});
$('muscle-all').addEventListener('click',()=>{restoreAllPeels();changeRegion('all')});
$('muscle-reset').addEventListener('click',()=>{
 state.selected=null;state.isolate=false;state.query='';state.region='all';state.layerMode='all';state.sideMode='all';state.kindMode='all';
 state.ghostMode=false;state.lastPointer=null;restoreAllMuscles(state.hiddenIds,state.hiddenHistory);
 $('muscle-search').value='';$('muscle-regions').value='all';$('muscle-layer').value='all';$('muscle-side').value='all';$('muscle-kind').value='all';
 refreshVisibility();renderList();clearInfo();
 if(state.entries.length)focusOnMeshes(state.entries.map(e=>e.mesh));
});
let pointerDown=null;
$('muscle-canvas').addEventListener('pointerdown',event=>{pointerDown={x:event.clientX,y:event.clientY}});
$('muscle-canvas').addEventListener('pointerup',event=>{
 const origin=pointerDown;pointerDown=null;
 if(!state.loaded||!origin||Math.hypot(event.clientX-origin.x,event.clientY-origin.y)>5)return;
 const rect=$('muscle-canvas').getBoundingClientRect();
 pointer.set((event.clientX-rect.left)*2/rect.width-1,-(event.clientY-rect.top)*2/rect.height+1);
 raycaster.setFromCamera(pointer,camera);
 state.lastPointer=pointer.clone();
 const entry=hitMusclesAtLastPointer()[0];
 if(entry)selectMuscle(entry);
});
function closeDrawers(){
 $('muscle-sidebar').hidden=true;
 $('muscle-panel').hidden=true;
 $('muscle-dismiss').hidden=true;
}
function openDrawer(id,search=false){
 closeDrawers();
 $(id).hidden=false;
 $('muscle-dismiss').hidden=false;
 if(search)requestAnimationFrame(()=>$('muscle-search').focus());
}
$('muscle-bubble-import').addEventListener('click',()=>$('muscle-file').click());
$('muscle-demo-import').addEventListener('click',()=>$('muscle-file').click());
$('muscle-demo-restore').addEventListener('click',showBuiltInDemo);
$('muscle-hide-selected').addEventListener('click',peelSelectedMuscle);
$('muscle-bubble-peel').addEventListener('click',peelSelectedMuscle);
$('muscle-undo-hidden').addEventListener('click',undoPeel);
$('muscle-bubble-undo').addEventListener('click',undoPeel);
$('muscle-restore-hidden').addEventListener('click',restoreAllPeels);
$('muscle-restore-all').addEventListener('click',restoreAllPeels);
$('muscle-xray').addEventListener('click',()=>{
 state.ghostMode=!state.ghostMode;refreshVisibility();
});
$('muscle-bones-toggle').addEventListener('click',()=>{
 state.bonesVisible=!state.bonesVisible;refreshVisibility();
});
async function loadDetailedModel(){
 if(state.loading)return;
 state.loading=true;
 for(const id of ['muscle-load-detailed','muscle-load-detailed-nav'])$(id).disabled=true;
 $('muscle-status').textContent='Descargando mallas de Écorché (aprox. 5,7 MB)…';
 try{
  const model=await loadGLB(DETAILED_MODEL.url);
  const meshes=[];
  model.traverse(obj=>{if(obj.isMesh)meshes.push({name:meshName(obj),userData:obj.userData})});
  const audit=detailAudit(meshes);
  if(audit.total<20||audit.layers.superficial<5||audit.layers.deep<5){
   throw new Error('El modelo no contiene suficientes músculos identificables con ambas capas.');
  }
  acceptModel(model,audit,{kind:'detailed'});
  closeDrawers();
 }catch(error){
  console.error('No fue posible cargar Écorché:',error);
  $('muscle-status').textContent=
   'No se pudo cargar el modelo detallado. Conservamos el modelo anterior. Comprueba tu conexión o importa un GLB local.';
 }finally{
  state.loading=false;
  for(const id of ['muscle-load-detailed','muscle-load-detailed-nav'])$(id).disabled=false;
 }
}
$('muscle-load-detailed').addEventListener('click',loadDetailedModel);
$('muscle-load-detailed-nav').addEventListener('click',loadDetailedModel);
$('muscle-guide-toggle').addEventListener('click',()=>{
 if(!state.guide)return;
 state.guideVisible=!state.guideVisible;
 state.guide.visible=state.guideVisible;
 $('muscle-guide-toggle').setAttribute('aria-pressed',String(state.guideVisible));
 $('muscle-guide-toggle').textContent=state.guideVisible?'Ocultar silueta':'Mostrar silueta';
});
for(const button of document.querySelectorAll('[data-muscle-view]')){
 button.addEventListener('click',()=>setView(button.dataset.muscleView));
}
$('muscle-import-cta').addEventListener('click',()=>$('muscle-file').click());
$('muscle-bubble-regions').addEventListener('click',()=>openDrawer('muscle-sidebar'));
$('muscle-bubble-search').addEventListener('click',()=>openDrawer('muscle-sidebar',true));
$('muscle-bubble-info').addEventListener('click',()=>openDrawer('muscle-panel'));
$('muscle-open-info').addEventListener('click',()=>openDrawer('muscle-panel'));
$('muscle-bubble-isolate').addEventListener('click',()=>$('muscle-isolate').click());
$('muscle-bubble-reset').addEventListener('click',()=>$('muscle-reset').click());
$('muscle-close-nav').addEventListener('click',closeDrawers);
$('muscle-close-info').addEventListener('click',closeDrawers);
$('muscle-dismiss').addEventListener('click',closeDrawers);
window.addEventListener('keydown',event=>{
 if(event.key!=='Escape')return;
 if(!$('muscle-sidebar').hidden||!$('muscle-panel').hidden){closeDrawers();return}
 if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
 $('muscle-reset').click();
});
renderRegions();clearInfo();renderList();showBuiltInDemo();
