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
 system:'bone',token:0,models:new Map(),recent:[],selected:null,group:'all',layer:'all',
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
 const meshes=model.meshesById.get(entry.id)||[];
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
  ['all','Todas las estructuras'],['superficial','Músculos superficiales'],
  ['deep','Músculos profundos'],['connective','Tejidos conectivos']
 ]:system==='bone'?[['all','Todos los huesos']]:
 system==='vessel'?[['all','Arterias y venas'],['artery','Arterias'],['vein','Venas']]:
 system==='nerve'?[['all','Todos los grupos'],...NERVE_GROUPS.filter(x=>x.id!=='all').map(x=>[x.id,x.label])]:
 [['all','Todos los tejidos'],...JOINTS_KINDS.filter(x=>x.id!=='all').map(x=>[x.id,x.name])];
 for(const [id,label] of options){
  const opt=document.createElement('option');opt.value=id;opt.textContent=label;sel.appendChild(opt);
 }
 sel.value=state.layer;
}
function matchesFilters(entry){
 if(state.group!=='all'&&entry.region!==state.group)return false;
 if(state.layer==='all')return true;
 if(state.system==='muscle'){
  if(state.layer==='connective')return entry.kind==='connective';
  return entry.kind!=='connective'&&entry.layer===state.layer;
 }
 return entry.kind===state.layer;
}
function layerVisible(e){return !state.hidden.has(e.id)&&matchesFilters(e)&&(!state.isolated||state.selected?.id===e.id)}
function refreshMeshVisibility(){
 const model=activeModel();
 if(model){
  for(const [id,meshes] of model.meshesById){
   const entry=model.byId.get(id);
   const show=entry&&layerVisible(entry);
   for(const mesh of meshes){
    mesh.visible=Boolean(show);
    const chosen=state.selected?.id===id;
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
    const faded=state.selected&&!chosen&&!state.isolated&&show;
    const opacity=faded?.27:1;
    if(mat.opacity!==opacity||mat.transparent!==Boolean(faded)){
     mat.opacity=opacity;mat.transparent=Boolean(faded);mat.depthWrite=!faded;mat.needsUpdate=true;
    }
   }
  }
 }
 $('atlas-selection').hidden=!state.selected;
 for(const id of ['bubble-isolate','selection-focus','selection-hide','selection-isolate'])$(id).disabled=!state.selected;
 $('selection-isolate').textContent=state.isolated?'Mostrar entorno':'Aislar';
 if(state.selected){
  $('atlas-selection-name').textContent=state.selected.name;
  $('atlas-selection-system').textContent=sourceLabel(state.system).toUpperCase();
 }
}
function selectEntry(entry,focus=false){
 if(!entry||entry.system!==state.system)return;
 state.hidden.delete(entry.id);
 // Un acceso directo de catálogo no debe ocultar el músculo por el filtro.
 if(!matchesFilters(entry)){
  state.group='all';state.layer='all';$('structure-region').value='all';$('active-layer').value='all';
 }
 state.selected=entry;state.isolated=false;
 refreshMeshVisibility();renderInfo();renderCatalogue();
 if(focus&&activeModel())focusEntry(entry);
}
function clearSelection(){
 state.selected=null;state.isolated=false;
 refreshMeshVisibility();renderInfo();renderCatalogue();
}
function isolate(){
 if(!state.selected)return;
 state.isolated=!state.isolated;refreshMeshVisibility();
}
function hideSelected(){
 if(!state.selected)return;
 state.hidden.add(state.selected.id);
 const name=state.selected.name;
 clearSelection();showStatus('Ocultado temporalmente: '+name+'. Recupéralo desde el catálogo o restablece la vista.');
}
function restore(){
 state.group='all';state.layer='all';state.hidden.clear();state.isolated=false;state.selected=null;
 $('structure-query').value='';state.limit=60;
 layerOptions();renderRegions();refreshMeshVisibility();renderCatalogue();renderInfo();
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
   kind:'bone',region:normalizedRegion('bone',rawRegion)||null
  };
  const frozen=Object.freeze(entry);
  arr.push(frozen);byId.set(key,frozen);meshesById.set(key,[obj]);map.set(obj,frozen);
 });
 return {entries:arr,byId,meshesById,meshMap:map};
}
function makeStandardEntries(system,root){
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
 const kinds={bone:'#c9c3b7',muscle:'#a96d68',nerve:'#d6b680',vessel:entry.kind==='vein'?'#6592bb':'#c26562',joint:entry.kind==='bone'?'#b8b4aa':'#c2b27f'};
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
 state.hidden.clear();state.selected=null;state.isolated=false;state.group='all';state.layer='all';
 layerOptions();renderRegions();
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
 state.selected=null;state.hidden.clear();state.isolated=false;state.group='all';state.layer='all';
 layerOptions();renderRegions();renderCatalogue();renderInfo();
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
  button.className='structure-entry'+(state.selected?.id===entry.id?' active':'');
  button.setAttribute('aria-pressed',String(state.selected?.id===entry.id));
  if(state.hidden.has(entry.id))button.classList.add('hidden');
  const title=document.createElement('strong');title.textContent=entry.name+(state.hidden.has(entry.id)?' · retirado':'');
  const original=document.createElement('small');original.textContent=entry.originalName;
  button.append(title,original);
  button.addEventListener('click',()=>selectEntry(entry,true));
  host.appendChild(button);
 }
 $('load-more-structures').hidden=entries.length<=state.limit;
}
function renderInfo(){
 const entry=state.selected;
 $('empty-info').hidden=!!entry;$('structure-info').hidden=!entry;
 if(!entry)return;
 $('info-name').textContent=entry.name;
 $('info-system').textContent=sourceLabel(entry.system);
 $('info-original').textContent=entry.originalName;
 $('info-kind').textContent=entry.kind||'No especificado';
 $('info-region').textContent=INTEGRATION_REGIONS.find(r=>r.id===entry.region)?.label||'No clasificada';
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
function openDrawer(id){
 closeDrawers();$(id).hidden=false;$('atlas-backdrop').hidden=false;
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
 else selectEntry(entry);
});
for(const item of INTEGRATION_SYSTEMS){
 const option=document.createElement('option');option.value=item.id;option.textContent=item.label;
 $('active-system').appendChild(option);
}
$('active-system').addEventListener('change',e=>loadSystem(e.target.value));
$('active-layer').addEventListener('change',e=>{
 state.layer=e.target.value;clearSelection();renderCatalogue();
});
$('structure-region').addEventListener('change',e=>{state.group=e.target.value;clearSelection();renderCatalogue()});
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
renderRegions();layerOptions();renderCatalogue();renderLandmarks();renderInfo();
loadSystem('bone');
