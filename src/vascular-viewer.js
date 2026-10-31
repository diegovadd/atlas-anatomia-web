import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {
 VASCULAR_SOURCE,VASCULAR_STRUCTURES,VASCULAR_BY_ID,VASCULAR_REGIONS,
 VASCULAR_LIMITS,vascularColor,vascularVisible,vesselNext
} from './vascular-data.js';

const $=id=>document.getElementById(id);
const state={
 model:null,loaded:false,loading:false,selected:null,kind:'all',region:'all',
 isolated:false,hidden:new Set(),entries:VASCULAR_STRUCTURES.map(x=>({...x,meshes:[]})),
 byId:new Map(),meshToEntry:new Map()
};
state.byId=new Map(state.entries.map(e=>[e.id,e]));
const viewport=$('vasc-viewport'),canvas=$('vasc-canvas');
const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.45));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(42,1,.001,300);
scene.add(new THREE.HemisphereLight(0xe5ebf1,0x222e40,1.5));
const key=new THREE.DirectionalLight(0xffffff,2.05);key.position.set(4,6,5);scene.add(key);
const fill=new THREE.DirectionalLight(0x8fb0df,.7);fill.position.set(-4,2,-5);scene.add(fill);
const controls=new OrbitControls(camera,canvas);
controls.enableDamping=true;controls.dampingFactor=.08;controls.enablePan=true;
controls.minDistance=.15;controls.maxDistance=70;
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
let cameraExtent=3,defaultCenter=new THREE.Vector3();
function size(){
 const w=viewport.clientWidth,h=viewport.clientHeight;
 if(w<2||h<2)return;
 camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);
}
new ResizeObserver(size).observe(viewport);size();
function animate(){
 requestAnimationFrame(animate);
 if(!document.hidden){controls.update();renderer.render(scene,camera)}
}
animate();
function view(direction='front',center=defaultCenter,extent=cameraExtent){
 const distance=Math.max(1,extent*1.65);
 const axis=direction==='back'?new THREE.Vector3(0,0,-1):
  direction==='left'?new THREE.Vector3(1,0,0):new THREE.Vector3(0,0,1);
 controls.target.copy(center);
 camera.position.copy(center).add(axis.multiplyScalar(distance));
 camera.near=Math.max(.001,extent/2000);
 camera.far=Math.max(100,extent*35);camera.updateProjectionMatrix();
 camera.up.set(0,1,0);camera.lookAt(center);controls.update();
}
function focus(entry){
 if(!entry||!entry.meshes.length)return;
 const box=new THREE.Box3();
 for(const mesh of entry.meshes)box.expandByObject(mesh);
 if(box.isEmpty())return;
 const center=box.getCenter(new THREE.Vector3()),s=box.getSize(new THREE.Vector3());
 view('front',center,Math.max(.25,s.x,s.y,s.z)*1.32);
}
function shown(entry){
 return vascularVisible(entry,{
  kind:state.kind,region:state.region,hiddenIds:state.hidden,
  isolateId:state.isolated?state.selected?.id??null:null
 });
}
function refresh(){
 for(const entry of state.entries){
  const visible=shown(entry),chosen=entry===state.selected;
  for(const mesh of entry.meshes){
   mesh.visible=visible;
   const mat=mesh.material;
   mat.color.set(chosen?'#f8e7c2':vascularColor(entry));
   mat.emissive.set(chosen?'#755636':'#000000');
   mat.emissiveIntensity=chosen?.32:0;
   const ghost=Boolean(state.selected&&!chosen&&!state.isolated);
   const opacity=ghost?.23:1;
   mat.transparent=opacity<1;mat.opacity=opacity;mat.depthWrite=!mat.transparent;mat.needsUpdate=true;
  }
 }
 $('vasc-rail-isolate').disabled=!state.selected;
 $('vasc-selected').hidden=!state.selected;
 $('vasc-isolate').textContent=state.isolated?'Ver todos':'Aislar';
 $('vasc-kind-arteries').setAttribute('aria-pressed',String(state.kind==='artery'));
 $('vasc-kind-veins').setAttribute('aria-pressed',String(state.kind==='vein'));
 $('vasc-kind-all').setAttribute('aria-pressed',String(state.kind==='all'));
 $('vasc-kind').value=state.kind;
 $('vasc-group').value=state.region;
}
function selectEntry(entry,focusCamera=false){
 if(!entry)return;
 state.hidden.delete(entry.id);
 if(state.kind!=='all'&&entry.kind!==state.kind)state.kind='all';
 if(state.region!=='all'&&entry.region!==state.region)state.region='all';
 state.selected=entry;state.isolated=false;
 $('vasc-selected-name').textContent=entry.name;
 $('vasc-selected-group').textContent=entry.kind==='artery'?'ARTERIA / GRUPO ARTERIAL':'VENA / GRUPO VENOSO';
 refresh();renderList();showInfo();
 if(focusCamera&&state.loaded)focus(entry);
}
function clearSelection(){
 state.selected=null;state.isolated=false;
 refresh();renderList();showInfo();
}
function renderList(){
 const host=$('vasc-list');host.replaceChildren();
 const query=$('vasc-query').value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 const list=state.entries.filter(e=>
  (state.kind==='all'||e.kind===state.kind)&&
  (state.region==='all'||e.region===state.region)&&
  (!query||(e.name+' '+e.originalName+' '+e.id+' '+e.fma).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(query))
 );
 $('vasc-count').textContent=`${list.length} de ${VASCULAR_STRUCTURES.length} grupos`;
 let prev=null;
 for(const entry of list){
  if(state.region==='all'&&entry.region!==prev){
   const heading=document.createElement('div');heading.className='vasc-group-heading';
   heading.textContent=VASCULAR_REGIONS.find(x=>x.id===entry.region)?.name||entry.region;
   host.appendChild(heading);prev=entry.region;
  }
  const b=document.createElement('button');b.type='button';
  b.className='vasc-item'+(entry===state.selected?' active':'')+(state.hidden.has(entry.id)?' hidden-item':'');
  b.setAttribute('aria-pressed',String(entry===state.selected));
  b.dataset.kind=entry.kind;
  b.textContent=entry.name+(state.hidden.has(entry.id)?' · oculto':'');
  b.addEventListener('click',()=>selectEntry(entry,true));
  host.appendChild(b);
 }
 if(!list.length){
  const p=document.createElement('p');p.className='vasc-empty';
  p.textContent='Sin resultados. Prueba otro tipo o región.';
  host.appendChild(p);
 }
}
function showInfo(){
 const e=state.selected;
 $('vasc-info-empty').hidden=Boolean(e);$('vasc-info-content').hidden=!e;
 if(!e)return;
 $('vasc-info-title').textContent=e.name;
 $('vasc-info-subtitle').textContent='Grupo segmentado · nomenclatura en revisión editorial';
 $('vasc-info-kind').textContent=e.kind==='artery'?'Arteria (o grupo de arterias)':'Vena (o grupo de venas)';
 $('vasc-info-group').textContent=VASCULAR_REGIONS.find(r=>r.id===e.region)?.name||'No clasificada';
 $('vasc-info-source').textContent=e.originalName;
 $('vasc-info-fma').textContent=e.fma;
 $('vasc-info-side').textContent=e.paired?'Lados/ramas agrupados según la fuente':'Segmento único o agrupación sin lateralidad individual';
 const rel=$('vasc-relations');rel.replaceChildren();
 const next=vesselNext(e.id);
 if(!next.length){
  const p=document.createElement('p');
  p.textContent='No se registraron conexiones de referencia para este grupo.';
  rel.appendChild(p);
 }
 for(const id of next){
  const target=state.byId.get(id);
  if(!target)continue;
  const button=document.createElement('button');button.type='button';
  button.textContent='Explorar: '+target.name;
  button.addEventListener('click',()=>selectEntry(target,true));
  rel.appendChild(button);
 }
}
function setKind(kind){
 state.kind=kind;clearSelection();
 $('vasc-status').textContent=kind==='all'?'Arterias y venas visibles.':
  kind==='artery'?'Solo grupos arteriales visibles.':'Solo grupos venosos visibles.';
}
function toggleIsolate(){if(!state.selected)return;state.isolated=!state.isolated;refresh()}
function hideSelected(){
 if(!state.selected)return;
 state.hidden.add(state.selected.id);
 const name=state.selected.name;
 clearSelection();
 $('vasc-status').textContent='Ocultado temporalmente: '+name;
}
function restore(){
 state.hidden.clear();state.kind='all';state.region='all';state.isolated=false;state.selected=null;
 $('vasc-query').value='';
 refresh();renderList();showInfo();view('front');
 $('vasc-status').textContent='Restaurados los 52 grupos del atlas vascular.';
}
function closeDrawers(){
 $('vasc-list-drawer').hidden=true;$('vasc-info-drawer').hidden=true;$('vasc-dismiss').hidden=true;
}
function openDrawer(name,search=false){
 closeDrawers();$(name).hidden=false;$('vasc-dismiss').hidden=false;
 if(search)$('vasc-query').focus();
}
function installScene(model){
 // No sustituir la escena funcional si el archivo cargado no coincide
 // con el registro verificable de estructuras.
 const groups=new Map(VASCULAR_STRUCTURES.map(s=>[s.id,{...s,meshes:[]}]));
 const unmatched=[];
 model.traverse(obj=>{
  if(!obj.isMesh)return;
  const id=obj.userData?.structureId||obj.name;
  const entry=groups.get(id);
  if(!entry){unmatched.push(obj);return}
  entry.meshes.push(obj);
 });
 const missing=[...groups.values()].filter(g=>!g.meshes.length);
 if(missing.length)throw new Error('El GLB no contiene '+missing.length+' grupos de vasos esperados.');
 const box=new THREE.Box3().setFromObject(model);
 if(box.isEmpty())throw new Error('Geometría vacía en el modelo vascular');
 for(const obj of unmatched)obj.visible=false;
 for(const entry of groups.values()){
  for(const mesh of entry.meshes){
   mesh.material=new THREE.MeshStandardMaterial({
    color:vascularColor(entry),roughness:.70,metalness:0,side:THREE.DoubleSide
   });
   mesh.frustumCulled=false;
  }
 }
 if(state.model)scene.remove(state.model);
 state.model=model;scene.add(model);
 state.entries=[...groups.values()];
 state.byId=new Map(state.entries.map(x=>[x.id,x]));
 state.meshToEntry=new Map(state.entries.flatMap(e=>e.meshes.map(m=>[m,e])));
 const bounds=box.getSize(new THREE.Vector3());
 defaultCenter=box.getCenter(new THREE.Vector3());
 cameraExtent=Math.max(bounds.x,bounds.y,bounds.z);
 state.loaded=true;state.selected=null;state.hidden.clear();state.region='all';state.kind='all';state.isolated=false;
 refresh();renderList();showInfo();view('front');
 $('vasc-intro').hidden=true;$('vasc-loading').hidden=true;
 $('vasc-status').textContent='52 grupos vasculares cargados: 32 arteriales y 20 venosos. Anatomía preliminar: pendiente de auditoría médica.';
}
async function loadModel(){
 if(state.loading)return;
 state.loading=true;
 $('vasc-loading').hidden=false;$('vasc-retry').hidden=true;
 $('vasc-loading-text').textContent='Descargando 2,4 MB de geometría 3D desde la fuente abierta…';
 try{
  const loader=new GLTFLoader();
  const gltf=await loader.loadAsync(VASCULAR_SOURCE.url,event=>{
   if(event.total>0)$('vasc-loading-text').textContent=`Descargando modelo: ${Math.round(event.loaded/event.total*100)}%`;
  });
  installScene(gltf.scene);
 }catch(error){
  console.error('No se pudo cargar el modelo vascular:',error);
  $('vasc-loading-text').textContent='No se pudo descargar el GLB. Comprueba tu conexión y reintenta; puedes consultar el catálogo y la procedencia sin las mallas.';
  $('vasc-retry').hidden=false;
  $('vasc-status').textContent='Geometría no disponible: modelo externo pendiente de descarga.';
 }finally{state.loading=false}
}
for(const r of VASCULAR_REGIONS){
 const option=document.createElement('option');option.value=r.id;option.textContent=r.name;
 $('vasc-group').appendChild(option);
}
for(const line of VASCULAR_LIMITS){
 const li=document.createElement('li');li.textContent=line;$('vasc-limits').appendChild(li);
}
$('vasc-group').addEventListener('change',event=>{
 state.region=event.target.value;clearSelection();
 const found=state.entries.filter(shown);
 if(found.length&&state.loaded){
  const box=new THREE.Box3();for(const e of found)for(const mesh of e.meshes)box.expandByObject(mesh);
  if(!box.isEmpty()){
   const center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
   view('front',center,Math.max(size.x,size.y,size.z)*1.2);
  }
 }
});
$('vasc-kind').addEventListener('change',e=>setKind(e.target.value));
$('vasc-kind-arteries').addEventListener('click',()=>setKind('artery'));
$('vasc-kind-veins').addEventListener('click',()=>setKind('vein'));
$('vasc-kind-all').addEventListener('click',()=>setKind('all'));
$('vasc-query').addEventListener('input',renderList);
$('vasc-view-front').addEventListener('click',()=>view('front'));
$('vasc-view-left').addEventListener('click',()=>view('left'));
$('vasc-view-back').addEventListener('click',()=>view('back'));
$('vasc-rail-isolate').addEventListener('click',toggleIsolate);
$('vasc-isolate').addEventListener('click',toggleIsolate);
$('vasc-info-isolate').addEventListener('click',toggleIsolate);
$('vasc-hide').addEventListener('click',hideSelected);
$('vasc-show-all').addEventListener('click',restore);
$('vasc-reset-rail').addEventListener('click',restore);
$('vasc-focus').addEventListener('click',()=>focus(state.selected));
$('vasc-open-list').addEventListener('click',()=>openDrawer('vasc-list-drawer'));
$('vasc-open-search').addEventListener('click',()=>openDrawer('vasc-list-drawer',true));
$('vasc-open-info').addEventListener('click',()=>openDrawer('vasc-info-drawer'));
$('vasc-selected-info').addEventListener('click',()=>openDrawer('vasc-info-drawer'));
$('vasc-intro-list').addEventListener('click',()=>openDrawer('vasc-list-drawer'));
$('vasc-close-list').addEventListener('click',closeDrawers);
$('vasc-close-info').addEventListener('click',closeDrawers);
$('vasc-dismiss').addEventListener('click',closeDrawers);
$('vasc-retry').addEventListener('click',loadModel);
let down=null;
canvas.addEventListener('pointerdown',event=>{down={x:event.clientX,y:event.clientY}});
canvas.addEventListener('pointerup',event=>{
 const start=down;down=null;
 if(!state.loaded||!start||Math.hypot(event.clientX-start.x,event.clientY-start.y)>5)return;
 const rect=canvas.getBoundingClientRect();
 pointer.set((event.clientX-rect.left)/rect.width*2-1,-((event.clientY-rect.top)/rect.height*2-1));
 raycaster.setFromCamera(pointer,camera);
 const hit=raycaster.intersectObjects([...state.meshToEntry.keys()].filter(m=>m.visible),false)
  .map(h=>state.meshToEntry.get(h.object)).find(Boolean);
 if(hit)selectEntry(hit);
});
window.addEventListener('keydown',event=>{
 if(event.key==='Escape'){
  if(!$('vasc-list-drawer').hidden||!$('vasc-info-drawer').hidden)closeDrawers();
  else if(state.isolated){state.isolated=false;refresh()}
 }
});
renderList();refresh();showInfo();view('front');
loadModel();
