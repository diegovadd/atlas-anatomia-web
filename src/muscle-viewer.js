import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {MUSCLE_REGIONS,identifyMuscle,auditMuscleMeshList,muscleDraft} from './muscle-data.js';

const $=id=>document.getElementById(id);
const state={model:null,entries:[],selected:null,region:'all',query:'',isolate:false,loaded:false};
const renderer=new THREE.WebGLRenderer({canvas:$('muscle-canvas'),antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=.9;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(40,1,.01,120);
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.enablePan=true;controls.minDistance=.08;controls.maxDistance=15;
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
 const names=[ud.zname,obj.name,obj.parent?.name].filter(x=>typeof x==='string'&&x.trim());
 return names.find(name=>identifyMuscle(name))||names[0]||'Malla sin identificar';
}
function infoFor(entry){
 const info=muscleDraft(entry);
 $('muscle-name').textContent=info.name;
 $('muscle-region').textContent=info.region;
 $('muscle-origin').textContent=info.origin;
 $('muscle-insertion').textContent=info.insertion;
 $('muscle-innervation').textContent=info.innervation;
 $('muscle-action').textContent=info.action;
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
 return (state.region==='all'||entry.region===state.region) &&
  (!state.query||entry.displayName.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
    .includes(state.query.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()));
}
function refreshVisibility(){
 for(const entry of state.entries){
  entry.mesh.visible=(state.region==='all'||entry.region===state.region) &&
   (!state.isolate||!state.selected||entry===state.selected);
  const m=entry.mesh.material;
  if(entry===state.selected){m.color.set('#c88d88');m.emissive.set('#48211e');m.emissiveIntensity=.2}
  else{m.color.set('#965b56');m.emissive.set('#000000');m.emissiveIntensity=0}
 }
 $('muscle-isolate').disabled=!state.selected;
 $('muscle-isolate').textContent=state.isolate?'Mostrar músculos':'Aislar músculo';
}
function renderList(){
 const container=$('muscle-list');container.replaceChildren();
 const list=state.entries.filter(selectedFilter).sort((a,b)=>a.displayName.localeCompare(b.displayName,'es'));
 $('muscle-list-count').textContent=list.length+' resultados';
 if(!list.length){
  const p=document.createElement('p');p.className='muscle-empty';
  p.textContent=state.loaded?'No hay músculos reconocidos con este filtro.':'Importa un GLB segmentado para explorar los músculos.';
  container.appendChild(p);return;
 }
 for(const entry of list){
  const button=document.createElement('button');button.type='button';
  button.className='muscle-option'+(entry===state.selected?' active':'');
  button.setAttribute('aria-pressed',String(entry===state.selected));
  button.textContent=entry.displayName;
  button.addEventListener('click',()=>selectMuscle(entry,true));
  container.appendChild(button);
 }
}
function focusOnMeshes(meshes){
 const box=new THREE.Box3();
 for(const mesh of meshes)box.expandByObject(mesh);
 if(box.isEmpty())return;
 const center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
 const extent=Math.max(size.x,size.y,size.z,.08);
 controls.target.copy(center);
 camera.position.copy(center).add(new THREE.Vector3(.25,.18,1).normalize().multiplyScalar(extent*2.6));
 camera.near=Math.max(extent/2000,.0001);camera.far=Math.max(200,extent*40);camera.updateProjectionMatrix();controls.update();
}
function selectMuscle(entry,focus=false){
 state.selected=entry;state.isolate=false;
 refreshVisibility();renderList();infoFor(entry);
 if(focus)focusOnMeshes([entry.mesh]);
}
function changeRegion(id){
 state.region=id;state.selected=null;state.isolate=false;clearInfo();
 refreshVisibility();renderList();
 const shown=state.entries.filter(e=>state.region==='all'||e.region===state.region);
 if(shown.length)focusOnMeshes(shown.map(e=>e.mesh));
}
function renderRegions(){
 const c=$('muscle-regions');c.replaceChildren();
 for(const group of MUSCLE_REGIONS){
  const option=document.createElement('option');option.value=group.id;option.textContent=group.label;c.appendChild(option);
 }
 c.value='all';
}
function acceptModel(model,audit){
 if(state.model){root.remove(state.model);state.model.traverse(obj=>{if(obj.isMesh)obj.material?.dispose?.()})}
 state.model=model;root.add(model);state.entries=[];
 model.traverse(obj=>{
  if(!obj.isMesh)return;
  const raw=meshName(obj);
  const info=identifyMuscle(raw);
  if(!info){obj.visible=false;return}
  obj.material=new THREE.MeshStandardMaterial({color:0x965b56,roughness:.95,metalness:0,side:THREE.DoubleSide});
  obj.frustumCulled=false;
  state.entries.push({...info,mesh:obj,raw,id:state.entries.length});
 });
 state.loaded=true;state.selected=null;state.isolate=false;state.region='all';state.query='';
 $('muscle-onboarding').hidden=true;
 $('muscle-search').value='';$('muscle-regions').value='all';
 root.position.set(0,0,0);root.updateMatrixWorld(true);
 const box=new THREE.Box3().setFromObject(model),center=box.getCenter(new THREE.Vector3()),min=box.min.clone();
 root.position.set(-center.x,-min.y,-center.z);root.updateMatrixWorld(true);
 refreshVisibility();renderList();clearInfo();
 focusOnMeshes(state.entries.map(e=>e.mesh));
 $('muscle-status').textContent=`${audit.recognizedMeshes} mallas musculares, ${audit.recognizedTypes} tipos, ${audit.triangles.toLocaleString('es')} triángulos. ${audit.unclassifiedMeshes} mallas sin identificar (ocultas).`;
}
function loadGLB(url){
 return new Promise((resolve,reject)=>{
  const loader=new GLTFLoader(),draco=new DRACOLoader();
  draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
  loader.setDRACOLoader(draco);
  loader.load(url,g=>{draco.dispose();resolve(g.scene)},undefined,err=>{draco.dispose();reject(err)});
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
  acceptModel(model,audit);
 }catch(error){status.textContent='No se pudo cargar el modelo: '+(error?.message||'error desconocido');console.error(error)}
 finally{URL.revokeObjectURL(url);event.target.value=''}
});
$('muscle-regions').addEventListener('change',event=>changeRegion(event.target.value));
$('muscle-search').addEventListener('input',event=>{state.query=event.target.value.trim().toLowerCase();renderList()});
$('muscle-isolate').addEventListener('click',()=>{
 if(!state.selected)return;
 state.isolate=!state.isolate;refreshVisibility();
 if(state.isolate)focusOnMeshes([state.selected.mesh]);
});
$('muscle-all').addEventListener('click',()=>changeRegion('all'));
$('muscle-reset').addEventListener('click',()=>{
 state.selected=null;state.isolate=false;state.query='';state.region='all';
 $('muscle-search').value='';$('muscle-regions').value='all';
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
 const hit=raycaster.intersectObjects(state.entries.filter(e=>e.mesh.visible).map(e=>e.mesh),false)[0];
 if(hit){const entry=state.entries.find(e=>e.mesh===hit.object);if(entry)selectMuscle(entry)}
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
renderRegions();clearInfo();renderList();
