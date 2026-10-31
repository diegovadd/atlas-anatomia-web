import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {boneInfo,classifyRegion} from './anatomy-data.js';
import {sourceLayer} from './muscle-detailed-data.js';
import {JOINTS_GROUPS,JOINTS_KINDS} from './joints-data.js';
import {VASCULAR_REGIONS} from './vascular-data.js';
import {NERVE_GROUPS} from './nerve-data.js';
import {VISCERA_REGISTRY,identifyVisceraMesh} from './viscera-data.js';
import {QUICK_REGIONS,JOINT_VIEWS,NERVE_CONTEXT,visibleByLayer,visibleInRegion,updateSelection,isContextBone} from './exploration-rules.js';
import {
 INTEGRATION_SYSTEMS,INTEGRATION_SYSTEM_MAP,INTEGRATION_REGIONS,
 INTEGRATION_ENTRIES,findStructures,MODEL_ALIGNMENT,normalizedRegion
} from './integration-data.js';
import {
 makeLandmark,landmarksByLabel,exportLandmarks,importLandmarks
} from './integration-landmarks.js';

/** Un solo WebGLRenderer y una sola escena. Nunca hay dos sistemas
 * visibles simultáneamente hasta completar el registro anatómico.
 */
const $=id=>document.getElementById(id);
const canvas=$('atlas-one-canvas'),viewport=$('atlas-viewport');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.4));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.0;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(43,1,.001,500);
scene.add(new THREE.HemisphereLight(0xe5eceb,0x243543,1.5));
const keyLight=new THREE.DirectionalLight(0xffffff,1.9);keyLight.position.set(5,7,5);scene.add(keyLight);
const rimLight=new THREE.DirectionalLight(0xc7d5e4,.85);rimLight.position.set(-5,2,-6);scene.add(rimLight);
const controls=new OrbitControls(camera,canvas);
controls.enableDamping=true;controls.dampingFactor=.07;controls.enablePan=true;
controls.minDistance=.04;controls.maxDistance=200;
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
const sources=new Map(INTEGRATION_SYSTEMS.map(s=>[s.id,s]));
const indexed=new Map(INTEGRATION_SYSTEMS.map(s=>[s.id,INTEGRATION_ENTRIES.filter(e=>e.system===s.id)]));
const sourceIndex=new Map([...indexed].map(([id,entries])=>[id,new Map(entries.map(e=>[e.sourceId,e]))]));
const state={
 system:'bone',token:0,models:new Map(),recent:[],selected:null,selectedIds:new Set(),
 anchorId:null,subregion:'all',group:'all',layer:'all',
 nerveBones:true,nerveDiscs:true,jointBoneOpacity:.4,
 hidden:new Set(),isolated:false,markMode:false,annotations:[],pointerDown:null,
 currentTarget:new THREE.Vector3(),radius:3,limit:60
};
const MAX_CACHED_MODELS=2;
const norm=x=>String(x||'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const localKind=(sys,e)=>sys==='muscle'?(e.layer||e.kind):e.kind;
const sourceLabel=(sys)=>INTEGRATION_SYSTEM_MAP[sys]?.label||sys;

function resize(){
 const w=viewport.clientWidth,h=viewport.clientHeight;
 if(w<2||h<2)return;
 camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);
}
new ResizeObserver(resize).observe(viewport);
resize();
function animate(){
 requestAnimationFrame(animate);
 if(!document.hidden){controls.update();renderer.render(scene,camera)}
}
animate();

function showStatus(message){$('atlas-progress').textContent=message}
function hideLoading(){
 $('atlas-loading').hidden=true;$('atlas-retry').hidden=true;
}
function setLoading(message){
 $('atlas-loading').hidden=false;
 $('atlas-loading-title').textContent=message;
 $('atlas-loading-text').textContent='La carga utiliza la fuente y licencia declaradas.';
 $('atlas-retry').hidden=true;
}
function setView(mode='front',target=state.currentTarget,radius=state.radius){
 const direction=mode==='back'?new THREE.Vector3(0,0,-1):
  mode==='left'?new THREE.Vector3(1,0,0):new THREE.Vector3(0,0,1);
 const scale=Math.max(.16,radius);
 controls.target.copy(target);
 camera.position.copy(target).addScaledVector(direction,Math.max(.4,scale*1.78));
 camera.near=Math.max(.0001,scale/2200);camera.far=Math.max(300,scale*50);
 camera.up.set(0,1,0);camera.updateProjectionMatrix();
 camera.lookAt(target);controls.update();
}
setView();
function boundsOf(meshes){
 const box=new THREE.Box3();
 for(const mesh of meshes)if(mesh.visible!==false)box.expandByObject(mesh);
 return box;
}
function focusEntry(entry){
 const model=state.models.get(state.system);
 if(!model||!entry)return;
 const ids=state.selectedIds.size>1?[...state.selectedIds]:[entry.id];
 const meshes=ids.flatMap(id=>model.meshesById.get(id)||[]);
 const box=boundsOf(meshes);
 if(box.isEmpty())return;
 const size=box.getSize(new THREE.Vector3());
 const target=box.getCenter(new THREE.Vector3());
 const direction=camera.position.clone().sub(controls.target).normalize();
 const distance=Math.max(.16,Math.max(size.x,size.y,size.z)*2.0);
 controls.target.copy(target);
 camera.position.copy(target).addScaledVector(direction,distance);
 camera.near=Math.max(.0001,distance/2000);camera.far=Math.max(300,distance*30);
 camera.updateProjectionMatrix();camera.lookAt(target);controls.update();
}
function showSource(){
 const conf=INTEGRATION_SYSTEM_MAP[state.system];
 $('atlas-source-name').textContent=conf.kind;
 $('atlas-source-link').href=conf.attribution;
 $('atlas-license').textContent=conf.license;
 $('active-model-caption').textContent=conf.label+' · una sola fuente';
}
function activeModel(){return state.models.get(state.system)||null}
function activeEntries(){
 const model=activeModel();
 return model?.entries||indexed.get(state.system)||[];
}
function layerOptions(){
 const sel=$('active-layer');sel.replaceChildren();
 const system=state.system;
 const options=system==='muscle'?[
  ['all','Todos los tejidos'],['superficial','Músculos superficiales'],
  ['deep','Músculos profundos'],['connective','Tendones y fascias disponibles']
 ]:system==='bone'?[['all','Todos los huesos']]:
 system==='vessel'?[['all','Arterias y venas'],['artery','Arterias'],['vein','Venas']]:
 system==='nerve'?NERVE_CONTEXT.map(x=>[x.id,x.label]):
 system==='joint'?JOINT_VIEWS.map(x=>[x.id,x.label]):
 [['all','Todos los órganos'],...new Set(activeEntries().map(x=>x.kind))].map(x=>Array.isArray(x)?x:[x,x]);
 for(const [id,label] of options){
  const opt=document.createElement('option');opt.value=id;opt.textContent=label;
  sel.appendChild(opt);
 }
 sel.value=state.layer;
 $('nerve-context-controls').hidden=system!=='nerve';
 $('joint-context-controls').hidden=system!=='joint';
 $('nerve-show-bones').checked=state.nerveBones;
 $('nerve-show-discs').checked=state.nerveDiscs;
 $('joint-bone-opacity').value=String(state.jointBoneOpacity);
}
function regionAllows(entry){
 return visibleInRegion(entry,state.group,state.system);
}
function matchesFilters(entry){
 if(!regionAllows(entry))return false;
 if(state.subregion!=='all'&&entry.subregion!==state.subregion&&
   (entry.kind!==state.subregion)&&(entry.layer!==state.subregion))return false;
 return visibleByLayer(entry,{
  system:state.system,layer:state.layer,nerveBones:state.nerveBones,
  nerveDiscs:state.nerveDiscs,jointBoneOpacity:state.jointBoneOpacity
 });
}
function layerVisible(e){
 return !state.hidden.has(e.id)&&matchesFilters(e)&&
  (!state.isolated||state.selectedIds.has(e.id));
}
function renderSubregions(){
 const select=$('structure-subregion');select.replaceChildren();
 const root=document.createElement('option');root.value='all';root.textContent='Todos los subgrupos';select.appendChild(root);
 const visible=activeEntries().filter(e=>regionAllows(e));
 const kinds=new Map();
 for(const e of visible){
  const key=e.subregion||e.kind||e.layer;
  if(key)kinds.set(key,(kinds.get(key)||0)+1);
 }
 for(const [kind,count] of [...kinds].sort((a,b)=>String(a[0]).localeCompare(String(b[0]),'es'))){
  const opt=document.createElement('option');opt.value=kind;opt.textContent=kind+' ('+count+')';select.appendChild(opt);
 }
 if(!kinds.has(state.subregion))state.subregion='all';
 select.value=state.subregion;
}
function pickRegion(region){
 state.group=region;state.subregion='all';state.limit=60;
 clearSelection();
 renderRegions();renderSubregions();refreshMeshVisibility();renderCatalogue();renderRegionButtons();
 const model=activeModel();
 if(model&&region!=='all'){
  const meshes=[];
  for(const entry of model.entries){
   if(!regionAllows(entry)||isContextBone(entry,state.system))continue;
   meshes.push(...(model.meshesById.get(entry.id)||[]));
  }
  const box=boundsOf(meshes);
  if(!box.isEmpty()){
   const size=box.getSize(new THREE.Vector3());
   const target=box.getCenter(new THREE.Vector3());
   setView('front',target,Math.max(size.x,size.y,size.z)*1.2);
  }
 }
}
function renderRegionButtons(){
 for(const id of ['region-shortcuts','region-tiles']){
  const host=$(id);host.replaceChildren();
  for(const region of QUICK_REGIONS){
   const button=document.createElement('button');
   button.type='button';
   button.className='region-chip'+(region.id===state.group?' active':'');
   button.setAttribute('aria-pressed',String(region.id===state.group));
   button.textContent=region.label;
   button.addEventListener('click',()=>pickRegion(region.id));
   host.appendChild(button);
  }
 }
}
function refreshMeshVisibility(){
 const model=activeModel();
 if(model){
  for(const [id,meshes] of model.meshesById){
   const entry=model.byId.get(id);
   const show=entry&&layerVisible(entry);
   for(const mesh of meshes){
    mesh.visible=Boolean(show);
    const chosen=state.selectedIds.has(id);
    const mat=mesh.material;
    if(chosen){
     mat.color.set('#fff0cb');mat.emissive.set('#6f4928');mat.emissiveIntensity=.28;
     if(mat.vertexColors){mat.vertexColors=false;mat.needsUpdate=true}
    }else{
     mat.color.copy(mesh.userData.atlasColor);
     mat.emissive.set('#000000');mat.emissiveIntensity=0;
     if(mat.vertexColors!==mesh.userData.atlasVertexColors){
      mat.vertexColors=mesh.userData.atlasVertexColors;mat.needsUpdate=true;
     }
    }
    const faded=state.selectedIds.size>0&&!chosen&&!state.isolated&&show;
    const contextBone=isContextBone(entry,state.system);
    const boneAlpha=state.system==='joint'&&contextBone?state.jointBoneOpacity:
      (state.system==='nerve'&&contextBone ? .40 : 1);
    const opacity=faded?.25:(!chosen?boneAlpha:1);
    const transparent=opacity<1;
    if(mat.opacity!==opacity||mat.transparent!==transparent){
     mat.opacity=opacity;mat.transparent=transparent;mat.depthWrite=!transparent;mat.needsUpdate=true;
    }
   }
  }
 }
 $('atlas-selection').hidden=!state.selectedIds.size;
 $('selection-count').textContent=state.selectedIds.size>1?state.selectedIds.size+' estructuras seleccionadas':'';
 for(const id of ['bubble-isolate','selection-focus','selection-hide','selection-isolate'])$(id).disabled=!state.selectedIds.size;
 $('selection-isolate').textContent=state.isolated?'Mostrar entorno':'Aislar';
 if(state.selected){
  $('atlas-selection-name').textContent=state.selectedIds.size>1?state.selectedIds.size+' estructuras':state.selected.name;
  $('atlas-selection-system').textContent=sourceLabel(state.system).toUpperCase();
 }
}
function selectEntry(entry,focus=false,event=null){
 if(!entry||entry.system!==state.system)return;
 state.hidden.delete(entry.id);
 if(!matchesFilters(entry)){
  state.group='all';state.layer='all';state.subregion='all';
  layerOptions();renderRegions();renderSubregions();renderRegionButtons();
 }
 const multi=$('multi-select-toggle').checked||event?.ctrlKey||event?.metaKey;
 const range=Boolean(event?.shiftKey);
 const order=activeEntries().filter(matchesFilters).map(x=>x.id);
 state.selectedIds=updateSelection(state.selectedIds,entry.id,{
  add:multi,range,anchor:state.anchorId,order
 });
 state.anchorId=range?state.anchorId:entry.id;
 state.selected=state.selectedIds.size?(state.selectedIds.has(entry.id)?entry:
  activeModel()?.byId.get([...state.selectedIds].at(-1))||null):null;
 state.isolated=false;
 refreshMeshVisibility();renderInfo();renderCatalogue();
 if(focus&&state.selected&&activeModel())focusEntry(state.selected);
 if(state.selectedIds.size)openDrawer('drawer-info',true);
 else closeDrawers();
}
function clearSelection(){
 state.selected=null;state.selectedIds.clear();state.anchorId=null;state.isolated=false;
 refreshMeshVisibility();renderInfo();renderCatalogue();
}
function isolate(){
 if(!state.selectedIds.size)return;
 state.isolated=!state.isolated;refreshMeshVisibility();
}
function hideSelected(){
 if(!state.selectedIds.size)return;
 for(const id of state.selectedIds)state.hidden.add(id);
 const count=state.selectedIds.size;
 clearSelection();
 showStatus('Retiradas '+count+' estructuras. Recupera las piezas desde el catálogo o restablece la vista.');
}
function restore(){
 state.group='all';state.layer='all';state.subregion='all';state.hidden.clear();
 state.isolated=false;state.selected=null;state.selectedIds.clear();state.anchorId=null;
 $('structure-query').value='';state.limit=60;
 layerOptions();renderRegions();renderSubregions();renderRegionButtons();
 refreshMeshVisibility();renderCatalogue();renderInfo();
 if(activeModel())setView('front',state.currentTarget,state.radius);
 showStatus('Vista y capas restauradas para '+sourceLabel(state.system)+'.');
}
function makeBoneName(obj){
 const ud=Object.keys(obj.userData||{}).length?obj.userData:(obj.parent?.userData||{});
 return String(ud.zname||ud.name||obj.name||obj.parent?.name||'Hueso sin etiqueta').trim();
}
function makeBoneEntries(root){
 const arr=[],map=new Map(),byId=new Map(),meshesById=new Map();
 let id=0;
 root.traverse(obj=>{
  if(!obj.isMesh)return;
  const raw=makeBoneName(obj);
  const info=boneInfo(raw);
  const key='bone-'+id++;
  const rawRegion=classifyRegion(raw,obj.parent?.name||'');
  const entry={
   system:'bone',id:key,sourceId:raw,name:info.name||raw,originalName:raw,
   kind:'bone',region:rawRegion==='spine'&&/cervical/i.test(raw)?'neck':
    normalizedRegion('bone',rawRegion)||null,
   subregion:info.category||null
  };
  const frozen=Object.freeze(entry);
  arr.push(frozen);byId.set(key,frozen);meshesById.set(key,[obj]);map.set(obj,frozen);
 });
 return {entries:arr,byId,meshesById,meshMap:map};
}
function makeVisceraEntries(root){
 const registry=sourceIndex.get('viscera')||new Map();
 const byId=new Map(),meshesById=new Map(),meshMap=new Map();
 let unnamed=0;
 root.traverse(obj=>{
  if(!obj.isMesh)return;
  const candidates=[obj.userData?.zname,obj.userData?.name,obj.name,
   obj.parent?.userData?.zname,obj.parent?.name];
  const identified=candidates.map(identifyVisceraMesh).find(Boolean);
  const entry=identified?registry.get(identified.id):null;
  const raw=String(candidates.find(x=>typeof x==='string'&&x.trim())||'Malla sin etiqueta');
  const item=entry||Object.freeze({
   system:'viscera',id:'organ-source-'+unnamed++,sourceId:raw,
   name:raw,originalName:raw,kind:'No clasificado',
   region:null,subregion:'Sin clasificación confirmada'
  });
  if(!byId.has(item.id)){byId.set(item.id,item);meshesById.set(item.id,[])}
  meshesById.get(item.id).push(obj);meshMap.set(obj,item);
 });
 const entries=[...byId.values()];
 if(!entries.length)throw Error('El archivo de órganos no contiene mallas.');
 return {entries,byId,meshesById,meshMap};
}
function makeStandardEntries(system,root){
 if(system==='viscera')return makeVisceraEntries(root);
 const entries=indexed.get(system)||[];
 const bySource=sourceIndex.get(system)||new Map();
 const candidates=new Map(entries.map(e=>[e.id,[]]));
 const meshMap=new Map();
 const byMuscle=system==='muscle'?new Map(entries.map(e=>[norm(e.sourceId),e])):null;
 root.traverse(obj=>{
  if(!obj.isMesh)return;
  const user=obj.userData||{};
  const label=system==='muscle'?(user.name||user.zname||obj.name||obj.parent?.name):
   (user.structureId||obj.name);
  if(system==='muscle'&&sourceLayer(user)==='skeleton'){obj.visible=false;return}
  const entry=system==='muscle'?byMuscle.get(norm(label)):bySource.get(label);
  if(!entry){obj.visible=false;return}
  candidates.get(entry.id).push(obj);meshMap.set(obj,entry);
 });
 const byId=new Map(entries.map(e=>[e.id,e]));
 const meshesById=new Map([...candidates].filter(([,m])=>m.length));
 // Advertir cuando el GLB no tenga las piezas que declara el inventario.
 const minRequired=system==='muscle'?20:Math.ceil(entries.length*.8);
 if(meshesById.size<minRequired)throw Error('Se reconocieron '+meshesById.size+' de '+entries.length+' grupos, menos de lo esperado.');
 return {entries,byId,meshesById,meshMap};
}
function materialFor(system,entry,mesh){
 const current=Array.isArray(mesh.material)?mesh.material[0]:mesh.material;
 const kinds={bone:'#c9c3b7',muscle:'#a96d68',nerve:'#d6b680',
  vessel:entry.kind==='vein'?'#6592bb':'#c26562',
  joint:entry.kind==='bone'?'#b8b4aa':entry.kind==='fibrocartilage'?'#91a8bc':'#c2b27f',
  viscera:'#bd867e'};
 const mat=new THREE.MeshStandardMaterial({color:kinds[system],roughness:.86,metalness:0,side:THREE.DoubleSide});
 if(system==='muscle'&&(current?.vertexColors||mesh.geometry?.getAttribute('color'))){
  mat.color.set('#ffffff');mat.vertexColors=true;
 }
 mesh.material=mat;
 mesh.userData.atlasColor=mat.color.clone();
 mesh.userData.atlasVertexColors=mat.vertexColors;
 mesh.frustumCulled=false;
}
function disposeRoot(root){
 if(!root)return;
 const geometries=new Set(),materials=new Set();
 root.traverse(obj=>{
  if(obj.isMesh){
   if(obj.geometry)geometries.add(obj.geometry);
   for(const mat of Array.isArray(obj.material)?obj.material:[obj.material])if(mat)materials.add(mat);
  }
 });
 for(const g of geometries)g.dispose();
 for(const m of materials)m.dispose();
}
function disposeModel(system){
 const model=state.models.get(system);
 if(!model)return;
 scene.remove(model.root);
 disposeRoot(model.root);
 state.models.delete(system);
 state.recent=state.recent.filter(x=>x!==system);
}
function touchCache(system){
 state.recent=state.recent.filter(x=>x!==system).concat(system);
 while(state.recent.length>MAX_CACHED_MODELS){
  const old=state.recent[0];
  if(old===state.system){state.recent.push(state.recent.shift());continue}
  disposeModel(old);
 }
}
function recreateMarkers(model){
 for(const marker of model.markers){model.root.remove(marker);marker.geometry.dispose();marker.material.dispose()}
 model.markers=[];
 const size=Math.max(model.radius*.008,.0025);
 for(const record of state.annotations.filter(r=>r.system===model.system)){
  const mesh=new THREE.Mesh(
   new THREE.SphereGeometry(size,10,8),
   new THREE.MeshBasicMaterial({color:0xffd987,depthTest:false,depthWrite:false})
  );
  mesh.position.fromArray(record.localPoint);
  mesh.renderOrder=30;
  mesh.userData.landmarkId=record.id;
  model.root.add(mesh);model.markers.push(mesh);
 }
}
function cacheModel(system,root){
 const found=system==='bone'?makeBoneEntries(root):makeStandardEntries(system,root);
 if(!found.meshesById.size)throw Error('Sin estructuras anatómicas identificadas.');
 const bbox=new THREE.Box3();
 for(const meshList of found.meshesById.values())for(const mesh of meshList)bbox.expandByObject(mesh);
 if(bbox.isEmpty())throw Error('Geometría vacía.');
 for(const [id,meshes] of found.meshesById){
  const entry=found.byId.get(id);
  for(const m of meshes)materialFor(system,entry,m);
 }
 const sz=bbox.getSize(new THREE.Vector3());
 const model={system,root,entries:found.entries,byId:found.byId,meshMap:found.meshMap,
  meshesById:found.meshesById,markers:[],center:bbox.getCenter(new THREE.Vector3()),
  radius:Math.max(sz.x,sz.y,sz.z)};
 root.visible=false;
 scene.add(root);
 state.models.set(system,model);
 recreateMarkers(model);
 touchCache(system);
 return model;
}
function activateCached(system){
 if(!state.models.has(system))return false;
 for(const [name,data] of state.models)data.root.visible=name===system;
 const model=state.models.get(system);
 state.currentTarget.copy(model.center);state.radius=model.radius;
 state.hidden.clear();state.selected=null;state.selectedIds.clear();state.anchorId=null;
 state.isolated=false;state.group='all';state.subregion='all';state.layer='all';
 layerOptions();renderRegions();renderSubregions();renderRegionButtons();
 refreshMeshVisibility();renderCatalogue();renderInfo();renderLandmarks();
 setView('front');
 touchCache(system);
 showSource();
 $('atlas-intro').hidden=true;
 showStatus(model.meshesById.size+' mallas seleccionables · '+sourceLabel(system)+'. Modo de un solo sistema.');
 hideLoading();return true;
}
async function loadSystem(system){
 if(!INTEGRATION_SYSTEM_MAP[system])return;
 state.system=system;state.markMode=false;canvas.classList.remove('is-marking');
 $('active-system').value=system;showSource();
 const token=++state.token;
 for(const [name,data] of state.models)data.root.visible=name===system;
 if(activateCached(system))return;
 state.selected=null;state.selectedIds.clear();state.anchorId=null;
 state.hidden.clear();state.isolated=false;state.group='all';state.subregion='all';state.layer='all';
 layerOptions();renderRegions();renderSubregions();renderRegionButtons();renderCatalogue();renderInfo();
 setLoading('Preparando sistema '+sourceLabel(system));
 const conf=INTEGRATION_SYSTEM_MAP[system];
 $('atlas-loading-text').textContent='Fuente externa · aprox. '+(conf.bytes/1e6).toFixed(1)+' MB. Se muestra solo un sistema.';
 showStatus('Cargando '+sourceLabel(system)+'…');
 const draco=new DRACOLoader();
 draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
 try{
  const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).setDRACOLoader(draco);
  const gltf=await loader.loadAsync(conf.url,event=>{
   if(state.token===token&&event.total>0)
    $('atlas-loading-text').textContent='Descargando '+sourceLabel(system)+': '+Math.round(event.loaded/event.total*100)+' %';
  });
  if(state.token!==token){disposeRoot(gltf.scene);return}
  cacheModel(system,gltf.scene);
  activateCached(system);
 }catch(err){
  if(state.token!==token)return;
  console.error('Atlas · visor unificado:',err);
  const label='No fue posible cargar '+sourceLabel(system)+'. Comprueba la conexión.';
  $('atlas-loading-title').textContent=label;
  $('atlas-loading-text').textContent='El modelo permanece disponible en su visor especializado. Puedes cambiar de sistema.';
  $('atlas-retry').hidden=false;
  $('atlas-retry').onclick=()=>loadSystem(system);
  showStatus(label);
 }finally{draco.dispose()}
}
function renderRegions(){
 const select=$('structure-region');select.replaceChildren();
 for(const r of INTEGRATION_REGIONS){
  const opt=document.createElement('option');opt.value=r.id;opt.textContent=r.label;
  select.appendChild(opt);
 }
 select.value=state.group;
}
function renderCatalogue(){
 const host=$('structure-list');host.replaceChildren();
 const query=norm($('structure-query').value);
 const entries=activeEntries().filter(e=>matchesFilters(e)&&
  (!query||norm(e.name+' '+e.originalName+' '+e.id).includes(query)));
 $('structure-count').textContent=entries.length+' resultados';
 if(!entries.length){
  const p=document.createElement('p');p.textContent='Sin resultados con estos filtros.';p.className='drawer-footnote';host.appendChild(p);
 }
 for(const entry of entries.slice(0,state.limit)){
  const button=document.createElement('button');button.type='button';
  button.className='structure-entry'+(state.selectedIds.has(entry.id)?' active':'');
  button.setAttribute('aria-pressed',String(state.selectedIds.has(entry.id)));
  if(state.hidden.has(entry.id))button.classList.add('hidden');
  const title=document.createElement('strong');title.textContent=entry.name+(state.hidden.has(entry.id)?' · retirado':'');
  const original=document.createElement('small');original.textContent=entry.originalName;
  button.append(title,original);
  button.addEventListener('click',event=>selectEntry(entry,true,event));
  host.appendChild(button);
 }
 $('load-more-structures').hidden=entries.length<=state.limit;
}
function renderInfo(){
 const entry=state.selected;
 $('empty-info').hidden=!!entry;
 $('structure-info').hidden=!entry;
 const selectedHost=$('info-selected-list');selectedHost.replaceChildren();
 selectedHost.hidden=state.selectedIds.size<2;
 if(!entry)return;
 $('info-name').textContent=state.selectedIds.size>1?
  state.selectedIds.size+' estructuras seleccionadas':entry.name;
 $('info-system').textContent=sourceLabel(entry.system);
 $('info-original').textContent=entry.originalName;
 $('info-kind').textContent=entry.kind||'No especificado';
 $('info-region').textContent=INTEGRATION_REGIONS.find(r=>r.id===entry.region)?.label||'No clasificada';
 $('info-source-warning').textContent=state.system==='joint'?
  'Las superficies óseas, meniscos y discos se muestran para inspección visual. Esta versión no calcula colisiones ni certifica contacto óseo, articular o congruencia de las superficies.':
  state.system==='viscera'?
  'Los nombres de órganos provienen de un inventario editorial externo. Las estructuras realmente segmentadas dependen del GLB. Datos académicos pendientes de cotejo.':
  'Identificación provisional de origen. Relaciones, inserciones e inervación requieren revisión con fuentes académicas.';
 if(state.selectedIds.size>1){
  const model=activeModel();
  for(const id of state.selectedIds){
   const item=model?.byId.get(id);if(!item)continue;
   const label=document.createElement('span');label.textContent=item.name;
   selectedHost.appendChild(label);
  }
 }
}
function renderSystemMenu(){
 const host=$('system-list');host.replaceChildren();
 for(const s of INTEGRATION_SYSTEMS){
  const btn=document.createElement('button');btn.type='button';
  btn.className='system-option'+(s.id===state.system?' active':'');
  btn.setAttribute('aria-pressed',String(s.id===state.system));
  const name=document.createElement('strong');name.textContent=s.label;
  const caption=document.createElement('small');
  caption.textContent=(state.models.has(s.id)?'En memoria · ':'Carga bajo demanda · ')+s.kind;
  btn.append(name,caption);btn.addEventListener('click',()=>{closeDrawers();loadSystem(s.id);renderSystemMenu()});
  host.appendChild(btn);
 }
}
function closeDrawers(){
 for(const id of ['drawer-systems','drawer-catalogue','drawer-info','drawer-landmarks'])$(id).hidden=true;
 $('atlas-backdrop').hidden=true;
}
function openDrawer(id,passive=false){
 // En escritorio, conservar la lista abierta al seleccionar elementos en bloque.
 // Así Ctrl/Cmd y Mayús siguen funcionando sin tener que reabrir el catálogo.
 if(passive&&id==='drawer-info'&&!$('drawer-catalogue').hidden&&window.innerWidth>850){
  $('drawer-info').hidden=false;
  $('drawer-info').classList.add('auto-info');
  $('atlas-backdrop').hidden=true;
  return;
 }
 closeDrawers();$(id).hidden=false;
 // Ficha automática sin cortina: también permite seguir seleccionando en el canvas.
 $('atlas-backdrop').hidden=passive||id==='drawer-info';
 $('drawer-info').classList.toggle('auto-info',id==='drawer-info');
 if(id==='drawer-systems')renderSystemMenu();
 if(id==='drawer-catalogue')$('structure-query').focus();
}
function placeLandmark(hit,entry){
 if(state.annotations.length>=300){showStatus('Límite de 300 puntos por sesión. Exporta o borra algunos.');return}
 const label=$('landmark-label').value.trim();
 if(!label||label.length>90){openDrawer('drawer-landmarks');$('landmark-feedback').textContent='Escribe un nombre de punto válido (máximo 90 caracteres).';return}
 const model=activeModel();if(!model)return;
 const point=model.root.worldToLocal(hit.point.clone());
 const id=state.system+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,8);
 const record=makeLandmark({
  id,label,system:state.system,sourceUrl:INTEGRATION_SYSTEM_MAP[state.system].url,
  meshId:entry.id,note:$('landmark-note').value,localPoint:point.toArray().map(x=>Number(x.toFixed(6)))
 },sources);
 state.annotations.push(record);
 state.markMode=false;canvas.classList.remove('is-marking');
 recreateMarkers(model);renderLandmarks();openDrawer('drawer-landmarks');
 $('landmark-feedback').textContent='Registrado: '+label+' · '+sourceLabel(state.system)+'. Coordenada local, sin calibrar.';
 showStatus('Punto anatómico guardado en esta sesión: '+label);
}
function renderLandmarks(){
 const groups=landmarksByLabel(state.annotations);
 $('landmark-count').textContent=state.annotations.length+' puntos · '+groups.filter(x=>x.candidatePair).length+' coincidencias de nombre';
 $('export-landmarks').disabled=!state.annotations.length;
 $('clear-landmarks').disabled=!state.annotations.length;
 const host=$('landmark-list');host.replaceChildren();
 for(const group of groups){
  const wrapper=document.createElement('section');wrapper.className='landmark-group';
  const head=document.createElement('strong');
  head.textContent=group.label+(group.candidatePair?' · nombre compartido':'');
  wrapper.appendChild(head);
  for(const mark of group.points){
   const row=document.createElement('div');row.className='landmark-row';
   const summary=document.createElement('span');summary.textContent=sourceLabel(mark.system)+' · '+mark.localPoint.map(n=>n.toFixed(3)).join(', ');
   const go=document.createElement('button');go.type='button';go.textContent='Ver';
   go.addEventListener('click',async()=>{
    closeDrawers();
    if(state.system!==mark.system||!activeModel())await loadSystem(mark.system);
    const model=activeModel();if(!model)return;
    const entry=model.byId.get(mark.meshId);
    if(entry)selectEntry(entry);
    const target=model.root.localToWorld(new THREE.Vector3(...mark.localPoint));
    setView('front',target,Math.max(model.radius*.14,.1));
   });
   const del=document.createElement('button');del.type='button';del.textContent='×';del.title='Eliminar punto';
   del.setAttribute('aria-label','Eliminar punto '+mark.label);
   del.addEventListener('click',()=>{
    state.annotations=state.annotations.filter(x=>x.id!==mark.id);
    for(const model of state.models.values())recreateMarkers(model);
    renderLandmarks();
   });
   row.append(summary,go,del);wrapper.appendChild(row);
  }
  host.appendChild(wrapper);
 }
 if(!groups.length){
  const p=document.createElement('p');p.textContent='Aún no hay puntos. Introduce una etiqueta y selecciona una superficie del modelo 3D.';p.className='drawer-footnote';host.appendChild(p);
 }
}
// Interacciones del visor único
canvas.addEventListener('pointerdown',event=>{state.pointerDown={x:event.clientX,y:event.clientY}});
canvas.addEventListener('pointerup',event=>{
 const down=state.pointerDown;state.pointerDown=null;
 if(!down||Math.hypot(event.clientX-down.x,event.clientY-down.y)>5)return;
 const model=activeModel();if(!model)return;
 const rect=canvas.getBoundingClientRect();
 pointer.set(2*(event.clientX-rect.left)/rect.width-1,1-2*(event.clientY-rect.top)/rect.height);
 raycaster.setFromCamera(pointer,camera);
 const hits=raycaster.intersectObjects([...model.meshMap.keys()].filter(m=>m.visible),false);
 const first=hits.find(h=>model.meshMap.has(h.object));
 if(!first)return;
 const entry=model.meshMap.get(first.object);
 if(state.markMode)placeLandmark(first,entry);
 else selectEntry(entry,false,event);
});
for(const item of INTEGRATION_SYSTEMS){
 const option=document.createElement('option');option.value=item.id;option.textContent=item.label;
 $('active-system').appendChild(option);
}
$('active-system').addEventListener('change',e=>loadSystem(e.target.value));
$('active-layer').addEventListener('change',e=>{
 state.layer=e.target.value;clearSelection();renderCatalogue();
});
$('structure-region').addEventListener('change',e=>pickRegion(e.target.value));
$('structure-subregion').addEventListener('change',e=>{
 state.subregion=e.target.value;clearSelection();renderCatalogue();
});
$('nerve-show-bones').addEventListener('change',e=>{
 state.nerveBones=e.target.checked;clearSelection();renderCatalogue();
});
$('nerve-show-discs').addEventListener('change',e=>{
 state.nerveDiscs=e.target.checked;clearSelection();renderCatalogue();
});
$('joint-bone-opacity').addEventListener('input',e=>{
 state.jointBoneOpacity=Number(e.target.value);refreshMeshVisibility();
});
$('structure-query').addEventListener('input',()=>{state.limit=60;renderCatalogue()});
$('load-more-structures').addEventListener('click',()=>{state.limit+=60;renderCatalogue()});
$('bubble-systems').addEventListener('click',()=>openDrawer('drawer-systems'));
$('intro-open-systems').addEventListener('click',()=>openDrawer('drawer-systems'));
$('bubble-list').addEventListener('click',()=>openDrawer('drawer-catalogue'));
$('bubble-info').addEventListener('click',()=>openDrawer('drawer-info'));
$('selection-info').addEventListener('click',()=>openDrawer('drawer-info'));
$('bubble-mark').addEventListener('click',()=>openDrawer('drawer-landmarks'));
$('bubble-isolate').addEventListener('click',isolate);
$('selection-isolate').addEventListener('click',isolate);
$('selection-hide').addEventListener('click',hideSelected);
$('selection-focus').addEventListener('click',()=>focusEntry(state.selected));
$('info-focus').addEventListener('click',()=>focusEntry(state.selected));
$('bubble-reset').addEventListener('click',restore);
$('restore-visible').addEventListener('click',restore);
for(const button of document.querySelectorAll('[data-view]'))
 button.addEventListener('click',()=>{if(activeModel())setView(button.dataset.view,state.currentTarget,state.radius)});
for(const button of document.querySelectorAll('[data-close-drawer]'))
 button.addEventListener('click',closeDrawers);
$('atlas-backdrop').addEventListener('click',closeDrawers);
$('why-alignment').addEventListener('click',()=>$('alignment-dialog').showModal());
$('start-landmark').addEventListener('click',()=>{
 if(!activeModel()){showStatus('Carga un sistema antes de marcar puntos.');return}
 if(!$('landmark-label').value.trim()){
  $('landmark-feedback').textContent='Primero escribe el nombre del punto anatómico.';return;
 }
 state.markMode=true;closeDrawers();canvas.classList.add('is-marking');
 showStatus('Modo puntos: haz clic sobre el accidente anatómico en el modelo. Pulsa Escape para cancelar.');
});
$('export-landmarks').addEventListener('click',()=>{
 const json=exportLandmarks(state.annotations,sources);
 const blob=new Blob([json],{type:'application/json;charset=utf-8'});
 const url=URL.createObjectURL(blob);
 const link=document.createElement('a');link.href=url;link.download='atlas-puntos-anatomicos.json';
 document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
});
$('import-landmarks').addEventListener('change',async e=>{
 const file=e.target.files?.[0];e.target.value='';
 if(!file)return;
 if(file.size>300000){$('landmark-feedback').textContent='Archivo demasiado grande (máximo 300 KB).';return}
 try{
  const records=importLandmarks(await file.text(),sources);
  state.annotations=records;
  for(const model of state.models.values())recreateMarkers(model);
  renderLandmarks();$('landmark-feedback').textContent='Se importaron '+records.length+' puntos locales compatibles. No representan alineación validada.';
 }catch(error){
  $('landmark-feedback').textContent='No se importó: '+error.message;
 }
});
$('clear-landmarks').addEventListener('click',()=>{
 if(!window.confirm('¿Vaciar los puntos de esta sesión? Exporta primero si deseas conservarlos.'))return;
 state.annotations=[];for(const model of state.models.values())recreateMarkers(model);
 renderLandmarks();$('landmark-feedback').textContent='Puntos de la sesión vaciados.';
});
window.addEventListener('keydown',e=>{
 if(e.key!=='Escape')return;
 if(state.markMode){
  state.markMode=false;canvas.classList.remove('is-marking');
  showStatus('Captura cancelada.');return;
 }
 closeDrawers();
});
renderRegions();layerOptions();renderSubregions();renderRegionButtons();renderCatalogue();renderLandmarks();renderInfo();
loadSystem('bone');
