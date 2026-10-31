import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {NERVE_SOURCE,NERVE_REGISTRY,NERVE_BY_ID,NERVE_GROUPS,NERVE_LIMITS,nerveIsNeural,nerveVisible,nerveRelated} from './nerve-data.js';

const $=id=>document.getElementById(id);
const state={
 model:null,loaded:false,loading:false,selected:null,group:'all',
 context:true,isolated:false,hidden:new Set(),entries:NERVE_REGISTRY.map(x=>({...x,meshes:[]})),
 byId:new Map(),meshToEntry:new Map()
};
const canvas=$('neuro-canvas'),viewport=$('neuro-viewport');
const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.45));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1;
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(42,1,.001,300);
camera.position.set(4,1,8);
const controls=new OrbitControls(camera,canvas);
controls.enableDamping=true;controls.dampingFactor=.08;controls.enablePan=true;
controls.minDistance=.15;controls.maxDistance=70;
scene.add(new THREE.HemisphereLight(0xdceef1,0x26343e,1.5));
const keyLight=new THREE.DirectionalLight(0xffffff,2.0);keyLight.position.set(3,6,5);scene.add(keyLight);
const rim=new THREE.DirectionalLight(0x9dbac9,.85);rim.position.set(-4,2,-5);scene.add(rim);
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
let cameraExtent=3,defaultCenter=new THREE.Vector3();
const GROUP_COLORS={
 central:0xd4a879,spinal:0xf0c167,plexus:0xf8da8b,
 bones:0xc4b9a6,discs:0x88aabb,vessels:0xb68e8c
};
function size(){
 const width=viewport.clientWidth,height=viewport.clientHeight;
 if(width<2||height<2)return;
 camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height,false);
}
new ResizeObserver(size).observe(viewport);size();
function animate(){
 requestAnimationFrame(animate);
 if(!document.hidden){controls.update();renderer.render(scene,camera)}
}
animate();

function view(direction='left',target=defaultCenter,extent=cameraExtent){
 const length=Math.max(extent*1.62,2.7);
 const axis=direction==='front'?new THREE.Vector3(0,0,1):
  direction==='back'?new THREE.Vector3(0,0,-1):new THREE.Vector3(1,0,.05);
 controls.target.copy(target);
 camera.position.copy(target).add(axis.normalize().multiplyScalar(length));
 camera.up.set(0,1,0);
 camera.near=Math.max(.001,extent/2000);
 camera.far=Math.max(300,extent*35);
 camera.updateProjectionMatrix();
 camera.lookAt(target);controls.update();
}
function fitMesh(entry){
 if(!entry)return;
 const box=new THREE.Box3();
 for(const mesh of entry.meshes)box.expandByObject(mesh);
 if(box.isEmpty())return;
 const center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
 view('left',center,Math.max(.35,size.x,size.y,size.z)*1.3);
}
function visibleRecord(entry){
 return nerveVisible(entry,{
  group:state.group,context:state.context,hiddenIds:state.hidden,
  isolateId:state.isolated?state.selected?.id??null:null
 });
}
function refreshScene(){
 for(const entry of state.entries){
  const visible=visibleRecord(entry);
  const highlighted=entry===state.selected;
  for(const mesh of entry.meshes){
   mesh.visible=visible;
   const m=mesh.material;
   m.color.set(highlighted?0xffefd1:GROUP_COLORS[entry.group]);
   m.emissive.set(highlighted?0x6d4121:0x000000);
   m.emissiveIntensity=highlighted?.22:0;
   const ghost=!highlighted&&state.context&&state.group==='all'&&!nerveIsNeural(entry);
   const opacity=ghost?.22:1;
   const transparent=opacity<1;
   if(m.transparent!==transparent||m.opacity!==opacity){
    m.transparent=transparent;m.opacity=opacity;m.depthWrite=!transparent;m.needsUpdate=true;
   }
  }
 }
 $('neuro-context-toggle').setAttribute('aria-pressed',String(state.context));
 $('neuro-context-toggle').textContent=state.context?'Ocultar huesos/discos':'Mostrar huesos/discos';
 $('neuro-rail-isolate').disabled=!state.selected;
 $('neuro-selected').hidden=!state.selected;
 if(state.selected)$('neuro-isolate').textContent=state.isolated?'Mostrar contexto':'Aislar';
}
function renderList(){
 const host=$('neuro-list');host.replaceChildren();
 const q=$('neuro-query').value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 const matches=state.entries.filter(entry=>
  (state.group==='all'||entry.group===state.group) &&
  (!q||(entry.name+' '+entry.sourceName+' '+entry.fma+' '+entry.id)
   .normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(q))
 );
 $('neuro-count').textContent=`${matches.length} de ${NERVE_REGISTRY.length} estructuras`;
 if(!matches.length){
  const empty=document.createElement('p');empty.className='neuro-empty';
  empty.textContent='No hay resultados con este filtro.';host.appendChild(empty);return;
 }
 let lastGroup=null;
 for(const entry of matches){
  if(state.group==='all'&&entry.group!==lastGroup){
   const heading=document.createElement('div');heading.className='neuro-group-heading';
   heading.textContent=NERVE_GROUPS.find(g=>g.id===entry.group)?.label||entry.group;
   host.appendChild(heading);lastGroup=entry.group;
  }
  const button=document.createElement('button');button.type='button';button.className='neuro-item';
  if(entry===state.selected)button.classList.add('active');
  if(state.hidden.has(entry.id))button.classList.add('hidden-item');
  button.setAttribute('aria-pressed',String(entry===state.selected));
  button.textContent=entry.name+(state.hidden.has(entry.id)?' · oculto':'');
  button.addEventListener('click',()=>selectEntry(entry,true));
  host.appendChild(button);
 }
}
function showInfo(){
 const entry=state.selected;
 $('neuro-info-empty').hidden=!!entry;
 $('neuro-info-content').hidden=!entry;
 if(!entry)return;
 $('neuro-info-title').textContent=entry.name;
 $('neuro-info-subtitle').textContent='Etiqueta de navegación pendiente de cotejo terminológico';
 $('neuro-info-group').textContent=NERVE_GROUPS.find(g=>g.id===entry.group)?.label||'No clasificado';
 $('neuro-info-source').textContent=entry.sourceName;
 $('neuro-info-fma').textContent=entry.fma;
 $('neuro-info-side').textContent=entry.side==='left'?'Izquierdo (según fuente)':'Sin lateralidad individual / línea media';
 const rel=$('neuro-relations');rel.replaceChildren();
 const ids=nerveRelated(entry);
 if(!ids.length){const text=document.createElement('p');text.textContent='No hay relaciones registradas para esta estructura en el piloto.';rel.appendChild(text)}
 for(const id of ids){
  const target=NERVE_BY_ID[id];
  const btn=document.createElement('button');btn.type='button';btn.textContent=target.name;
  btn.addEventListener('click',()=>selectEntry(state.byId.get(id),true));
  rel.appendChild(btn);
 }
}
function selectEntry(entry,focus=false){
 if(!entry)return;
 if(state.hidden.delete(entry.id))$('neuro-status').textContent='Estructura restaurada: '+entry.name;
 state.selected=entry;state.isolated=false;
 if(!state.context&&!nerveIsNeural(entry))state.context=true;
 if(state.group!=='all'&&state.group!==entry.group){state.group='all';$('neuro-group').value='all'}
 $('neuro-selected-name').textContent=entry.name;
 $('neuro-selected-group').textContent=NERVE_GROUPS.find(x=>x.id===entry.group)?.label||'ESTRUCTURA';
 refreshScene();renderList();showInfo();
 if(focus&&state.loaded)fitMesh(entry);
}
function clearSelection(){
 state.selected=null;state.isolated=false;
 refreshScene();renderList();showInfo();
}
function isolate(){
 if(!state.selected)return;
 state.isolated=!state.isolated;refreshScene();
}
function hideSelected(){
 if(!state.selected)return;
 state.hidden.add(state.selected.id);
 $('neuro-status').textContent='Ocultada temporalmente: '+state.selected.name;
 clearSelection();
}
function restore(){
 state.hidden.clear();state.context=true;state.group='all';state.selected=null;state.isolated=false;
 $('neuro-group').value='all';$('neuro-query').value='';
 refreshScene();renderList();showInfo();
 view('left');
 $('neuro-status').textContent='Todas las estructuras del modelo han sido restauradas.';
}
function closeDrawers(){
 $('neuro-list-drawer').hidden=true;$('neuro-info-drawer').hidden=true;$('neuro-dismiss').hidden=true;
}
function openDrawer(id,search=false){
 closeDrawers();$(id).hidden=false;$('neuro-dismiss').hidden=false;
 if(search)$('neuro-query').focus();
}
function placeModel(model){
 const groups=new Map(NERVE_REGISTRY.map(s=>[s.id,{...s,meshes:[]}]));
 const found=new Set();
 model.traverse(obj=>{
  if(!obj.isMesh)return;
  const id=obj.userData?.structureId||obj.name;
  const entry=groups.get(id);
  if(!entry){obj.visible=false;return}
  const material=Array.isArray(obj.material)?obj.material[0]:obj.material;
  obj.material=new THREE.MeshStandardMaterial({
   color:GROUP_COLORS[entry.group],roughness:.75,metalness:0,
   side:THREE.DoubleSide
  });
  if(material?.map)obj.material.map=material.map;
  obj.frustumCulled=false;
  entry.meshes.push(obj);found.add(id);
 });
 const missing=NERVE_REGISTRY.filter(x=>!found.has(x.id));
 if(missing.length)throw new Error('El GLB carece de '+missing.length+' estructuras esperadas: '+missing.slice(0,3).map(x=>x.id).join(', '));
 const box=new THREE.Box3().setFromObject(model);
 if(box.isEmpty())throw new Error('El GLB contiene geometría vacía');
 if(state.model){scene.remove(state.model)}
 state.model=model;scene.add(model);
 state.entries=[...groups.values()];
 state.byId=new Map(state.entries.map(entry=>[entry.id,entry]));
 state.meshToEntry=new Map(state.entries.flatMap(entry=>entry.meshes.map(mesh=>[mesh,entry])));
 const center=box.getCenter(new THREE.Vector3()),sz=box.getSize(new THREE.Vector3());
 defaultCenter=center;cameraExtent=Math.max(sz.x,sz.y,sz.z);
 state.loaded=true;state.hidden.clear();state.selected=null;state.group='all';state.isolated=false;
 view('left');
 refreshScene();renderList();showInfo();
 $('neuro-loading').hidden=true;
 $('neuro-intro').hidden=true;
 $('neuro-status').textContent=`${found.size} estructuras cargadas · 14 de origen nervioso, referencia ósea y discos · fuente parcial CC BY-SA 2.1 JP.`;
}
async function loadModel(){
 if(state.loading)return;
 state.loading=true;
 $('neuro-loading').hidden=false;$('neuro-retry').hidden=true;
 $('neuro-loading-text').textContent='Descargando el modelo abierto (aprox. 5,1 MB)…';
 try{
  const loader=new GLTFLoader();
  const gltf=await loader.loadAsync(NERVE_SOURCE.url,event=>{
   if(event.total>0){
    $('neuro-loading-text').textContent=`Descargando mallas: ${Math.round(event.loaded/event.total*100)}%`;
   }
  });
  placeModel(gltf.scene);
 }catch(error){
  console.error('Carga del modelo neuroanatómico',error);
  $('neuro-loading-text').textContent='No fue posible cargar el modelo externo. Comprueba Internet y reintenta; la lista y los límites de la fuente siguen disponibles.';
  $('neuro-retry').hidden=false;
  $('neuro-status').textContent='Error de carga: no hay geometría 3D disponible por ahora.';
 }finally{state.loading=false}
}
$('neuro-group').replaceChildren();
for(const group of NERVE_GROUPS){
 const opt=document.createElement('option');opt.value=group.id;opt.textContent=group.label;
 $('neuro-group').appendChild(opt);
}
$('neuro-limits').replaceChildren();
for(const item of NERVE_LIMITS){
 const li=document.createElement('li');li.textContent=item;$('neuro-limits').appendChild(li);
}
$('neuro-group').addEventListener('change',event=>{
 state.group=event.target.value;clearSelection();renderList();refreshScene();
});
$('neuro-query').addEventListener('input',renderList);
$('neuro-context-toggle').addEventListener('click',()=>{
 state.context=!state.context;refreshScene();
});
$('neuro-view-front').addEventListener('click',()=>view('front'));
$('neuro-view-left').addEventListener('click',()=>view('left'));
$('neuro-view-back').addEventListener('click',()=>view('back'));
$('neuro-rail-isolate').addEventListener('click',isolate);
$('neuro-isolate').addEventListener('click',isolate);
$('neuro-info-isolate').addEventListener('click',isolate);
$('neuro-hide').addEventListener('click',hideSelected);
$('neuro-show-all').addEventListener('click',restore);
$('neuro-reset-rail').addEventListener('click',restore);
$('neuro-focus').addEventListener('click',()=>fitMesh(state.selected));
$('neuro-open-list').addEventListener('click',()=>openDrawer('neuro-list-drawer'));
$('neuro-open-search').addEventListener('click',()=>openDrawer('neuro-list-drawer',true));
$('neuro-open-info').addEventListener('click',()=>openDrawer('neuro-info-drawer'));
$('neuro-selected-info').addEventListener('click',()=>openDrawer('neuro-info-drawer'));
$('neuro-intro-list').addEventListener('click',()=>openDrawer('neuro-list-drawer'));
$('neuro-close-list').addEventListener('click',closeDrawers);
$('neuro-close-info').addEventListener('click',closeDrawers);
$('neuro-dismiss').addEventListener('click',closeDrawers);
$('neuro-retry').addEventListener('click',loadModel);
let pointerDown=null;
canvas.addEventListener('pointerdown',event=>{pointerDown={x:event.clientX,y:event.clientY}});
canvas.addEventListener('pointerup',event=>{
 const origin=pointerDown;pointerDown=null;
 if(!state.loaded||!origin||Math.hypot(event.clientX-origin.x,event.clientY-origin.y)>5)return;
 const rect=canvas.getBoundingClientRect();
 pointer.set((event.clientX-rect.left)/rect.width*2-1,-((event.clientY-rect.top)/rect.height*2-1));
 raycaster.setFromCamera(pointer,camera);
 const hits=raycaster.intersectObjects([...state.meshToEntry.keys()].filter(mesh=>mesh.visible),false);
 const target=hits.map(hit=>state.meshToEntry.get(hit.object)).find(Boolean);
 if(target)selectEntry(target);
});
window.addEventListener('keydown',event=>{
 if(event.key==='Escape'){
  if(!$('neuro-list-drawer').hidden||!$('neuro-info-drawer').hidden)closeDrawers();
  else if(state.isolated){state.isolated=false;refreshScene()}
 }
});
state.byId=new Map(state.entries.map(entry=>[entry.id,entry]));
renderList();refreshScene();showInfo();
loadModel();
