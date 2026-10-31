import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {
 INTEGRATION_SYSTEMS,INTEGRATION_SYSTEM_MAP,INTEGRATION_REGIONS,
 INTEGRATION_ENTRIES,findStructures,MODEL_ALIGNMENT
} from './integration-data.js';

const $=id=>document.getElementById(id);
const CONFIG={antialias:true,alpha:true,powerPreference:'high-performance'};
const paneIds=['a','b'];
let syncGuard=false,moreCount=60,requestSequence=0;
const allEntries=new Map(INTEGRATION_SYSTEMS.map(s=>[s.id,INTEGRATION_ENTRIES.filter(x=>x.system===s.id)]));
const lookupBySystem=new Map([...allEntries].map(([key,entries])=>[key,new Map(entries.map(x=>[x.sourceId,x]))]));
const norm=s=>String(s||'').trim().toLowerCase().replace(/\s+/g,' ');
const boundsOf=meshes=>{
 const b=new THREE.Box3();for(const m of meshes)b.expandByObject(m);return b;
};

function newPane(side){
 const canvas=$('canvas-'+side);
 const renderer=new THREE.WebGLRenderer({...CONFIG,canvas});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.45));
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.05;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(43,1,.001,400);
 scene.add(new THREE.HemisphereLight(0xdce5ec,0x23303d,1.8));
 const key=new THREE.DirectionalLight(0xffffff,1.8);key.position.set(4,6,5);scene.add(key);
 const rim=new THREE.DirectionalLight(0xb1c7e1,.8);rim.position.set(-4,2,-5);scene.add(rim);
 const controls=new OrbitControls(camera,canvas);
 controls.enableDamping=true;controls.dampingFactor=.08;
 controls.enablePan=true;controls.minDistance=.06;controls.maxDistance=100;
 const pane={side,canvas,renderer,scene,camera,controls,model:null,system:null,
  selected:null,loading:0,entries:[],found:new Map(),meshToEntry:new Map(),
  hidden:new Set(),isolated:false,center:new THREE.Vector3(),radius:3,
  ray:new THREE.Raycaster(),mouse:new THREE.Vector2(),mouseDown:null};
 const area=$('canvas-area-'+side);
 const resize=()=>{
  const w=area.clientWidth,h=area.clientHeight;if(w<2||h<2)return;
  camera.aspect=w/h;camera.updateProjectionMatrix();
  renderer.setSize(w,h,false);
 };
 new ResizeObserver(resize).observe(area);resize();
 canvas.addEventListener('pointerdown',e=>{pane.mouseDown={x:e.clientX,y:e.clientY}});
 canvas.addEventListener('pointerup',e=>{
  const down=pane.mouseDown;pane.mouseDown=null;
  if(!pane.model||!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)return;
  const rect=canvas.getBoundingClientRect();
  pane.mouse.set(2*(e.clientX-rect.left)/rect.width-1,1-2*(e.clientY-rect.top)/rect.height);
  pane.ray.setFromCamera(pane.mouse,pane.camera);
  const hits=pane.ray.intersectObjects([...pane.meshToEntry.keys()].filter(m=>m.visible),false);
  const hit=hits.map(h=>pane.meshToEntry.get(h.object)).find(Boolean);
  if(hit)selectStructure(pane,hit);
 });
 controls.addEventListener('change',()=>{
  if(syncGuard||!$('sync-orbit').checked)return;
  const other=panes.find(x=>x&&x!==pane);
  if(!other||!other.model)return;
  syncGuard=true;
  const axis=pane.camera.position.clone().sub(controls.target).normalize();
  const distance=other.camera.position.distanceTo(other.controls.target);
  other.camera.position.copy(other.controls.target).addScaledVector(axis,distance||other.radius*1.75);
  other.camera.up.copy(pane.camera.up);
  other.camera.lookAt(other.controls.target);
  other.controls.update();
  syncGuard=false;
 });
 return pane;
}
const panes=[null,null];
panes[0]=newPane('a');panes[1]=newPane('b');
function animate(){
 requestAnimationFrame(animate);
 if(!document.hidden){
  for(const p of panes){p.controls.update();p.renderer.render(p.scene,p.camera)}
 }
}
animate();
function cameraView(p,mode='front',focus=p.center,radius=p.radius){
 const direction=mode==='back'?new THREE.Vector3(0,0,-1):mode==='left'?
  new THREE.Vector3(1,0,0):new THREE.Vector3(0,0,1);
 const extent=Math.max(.15,radius);
 p.controls.target.copy(focus);
 p.camera.position.copy(focus).addScaledVector(direction,Math.max(.4,extent*1.8));
 p.camera.near=Math.max(.0001,extent/2500);p.camera.far=Math.max(300,extent*40);
 p.camera.updateProjectionMatrix();p.camera.lookAt(focus);p.controls.update();
}
function focusSelection(p){
 if(!p.selected)return;
 const meshes=p.found.get(p.selected.id)||[];
 if(!meshes.length)return;
 const box=boundsOf(meshes);
 if(box.isEmpty())return;
 const size=box.getSize(new THREE.Vector3());
 const direction=p.camera.position.clone().sub(p.controls.target).normalize();
 const distance=Math.max(.23,Math.max(size.x,size.y,size.z)*2.2);
 const target=box.getCenter(new THREE.Vector3());
 p.controls.target.copy(target);p.camera.position.copy(target).addScaledVector(direction,distance);
 p.camera.near=Math.max(.0001,distance/1000);p.camera.far=Math.max(100,distance*30);
 p.camera.updateProjectionMatrix();p.camera.lookAt(target);p.controls.update();
}
function panelState(p){
 const side=p.side;
 $('selected-'+side).textContent=p.selected?.name||'Sin selección';
 $('selected-sub-'+side).textContent=p.selected?
  (p.selected.originalName+' · '+p.selected.kind):
  'Selecciona una malla o utiliza el catálogo.';
 for(const id of ['focus','isolate','hide'])$(id+'-'+side).disabled=!p.selected;
 $('isolate-'+side).textContent=p.isolated?'Mostrar demás':'Aislar';
}
function refresh(p){
 for(const [id,meshes] of p.found){
  const active=p.selected?.id===id;
  const show=!p.hidden.has(id)&&(!p.isolated||!p.selected||active);
  for(const mesh of meshes){
   mesh.visible=show;
   const m=mesh.material;
   if(active){
    m.color.set('#f9e9c7');m.emissive.set('#71512f');m.emissiveIntensity=.33;
   }else{
    m.color.copy(mesh.userData._atlasOriginalColor);
    m.emissive.set('#000000');m.emissiveIntensity=0;
   }
   const fade=p.selected&&!active&&!p.isolated;
   const opacity=fade?.24:1;
   if(m.opacity!==opacity||m.transparent!==Boolean(fade)){
    m.opacity=opacity;m.transparent=Boolean(fade);m.depthWrite=!fade;m.needsUpdate=true;
   }
  }
 }
 panelState(p);
}
function selectStructure(p,entry,focus=false){
 if(!entry)return;
 p.hidden.delete(entry.id);
 p.selected=entry;p.isolated=false;refresh(p);
 if(focus)focusSelection(p);
 $('caption-'+p.side).textContent=entry.name+' · selección del modelo '+p.side.toUpperCase();
}
function clearSelection(p){p.selected=null;p.isolated=false;refresh(p)}
function release(p){
 if(p.model){
  p.scene.remove(p.model);
  const geometries=new Set(),materials=new Set();
  p.model.traverse(obj=>{
   if(!obj.isMesh)return;
   if(obj.geometry)geometries.add(obj.geometry);
   for(const m of Array.isArray(obj.material)?obj.material:[obj.material])if(m)materials.add(m);
  });
  for(const geo of geometries)geo.dispose();
  for(const mat of materials)mat.dispose();
 }
 p.model=null;p.entries=[];p.found.clear();p.meshToEntry.clear();
 p.hidden.clear();p.selected=null;p.isolated=false;panelState(p);
}
function metadataFor(system,obj){
 if(system==='muscle'){
  const info=obj.userData||{};
  return info.name||info.zname||obj.name||null;
 }
 return obj.userData?.structureId||obj.name||null;
}
function installModel(p,system,gltf){
 const entries=allEntries.get(system),candidate=new Map(entries.map(x=>[x.id,[]]));
 const map=new Map(),root=gltf.scene,bySource=lookupBySystem.get(system);
 const byMuscle=system==='muscle'?
  new Map(entries.map(x=>[norm(x.sourceId),x])):null;
 root.traverse(obj=>{
  if(!obj.isMesh)return;
  const key=metadataFor(system,obj);
  const entry=system==='muscle'?byMuscle.get(norm(key)):bySource.get(key);
  if(!entry){obj.visible=false;return}
  candidate.get(entry.id).push(obj);map.set(obj,entry);
 });
 const found=[...candidate].filter(([,list])=>list.length);
 const minRequired=system==='muscle'?20:Math.ceil(entries.length*.80);
 if(found.length<minRequired){
  throw new Error('El archivo no coincide con el inventario: '+found.length+'/'+entries.length+' grupos reconocidos.');
 }
 const bbox=new THREE.Box3().setFromObject(root);
 if(bbox.isEmpty())throw new Error('El archivo no contiene geometría visible.');
 // Validación completada: ahora sí sustituimos el modelo anterior.
 release(p);
 for(const [id,meshes] of found){
  const entry=entries.find(e=>e.id===id);
  const tint=system==='vessel'?(entry.kind==='artery'?'#bf615b':'#638bbd'):
   system==='muscle'?'#ba7776':system==='nerve'?'#d5ae7c':entry.kind==='bone'?'#9fa09b':'#c3b28b';
  for(const obj of meshes){
   const old=Array.isArray(obj.material)?obj.material[0]:obj.material;
   const material=new THREE.MeshStandardMaterial({color:tint,metalness:0,roughness:.85,side:THREE.DoubleSide});
   // Conservar color de vértice de músculos cuando exista.
   if(system==='muscle'&&old?.vertexColors){
    material.color.set('#ffffff');material.vertexColors=true;
   }
   obj.material=material;obj.userData._atlasOriginalColor=material.color.clone();
   obj.frustumCulled=false;
  }
 }
 p.model=root;p.system=system;p.entries=entries;
 p.found=new Map(found);p.meshToEntry=map;
 p.scene.add(root);
 const size=bbox.getSize(new THREE.Vector3());
 p.center=bbox.getCenter(new THREE.Vector3());
 p.radius=Math.max(size.x,size.y,size.z);
 cameraView(p,'front');
 refresh(p);
 $('loading-'+p.side).hidden=true;
 $('caption-'+p.side).textContent=found.length+'/'+entries.length+' estructuras identificadas · modelo de fuente externa';
}
async function loadSystem(p,system,selectId=null){
 const conf=INTEGRATION_SYSTEM_MAP[system];
 if(!conf)return;
 const sequence=++requestSequence;p.loading=sequence;
 $('system-'+p.side).value=system;
 $('viewer-link-'+p.side).href=conf.viewer;
 $('source-'+p.side).href=conf.attribution;
 $('license-'+p.side).textContent=conf.license;
 const indicator=$('loading-'+p.side);
 indicator.hidden=false;indicator.replaceChildren();
 indicator.textContent='Descargando '+conf.label+' (aprox. '+(conf.bytes/1e6).toFixed(1)+' MB)…';
 try{
  const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const gltf=await loader.loadAsync(conf.url,progress=>{
   if(sequence===p.loading&&progress.total>0)
    indicator.textContent='Descargando '+conf.label+': '+Math.round(progress.loaded/progress.total*100)+' %';
  });
  if(sequence!==p.loading){
   gltf.scene.traverse(obj=>{if(obj.isMesh){obj.geometry?.dispose();obj.material?.dispose?.()}});
   return;
  }
  installModel(p,system,gltf);
  if(selectId){
   const record=p.entries.find(x=>x.id===selectId);
   if(record&&p.found.has(record.id))selectStructure(p,record,true);
  }
 }catch(err){
  if(sequence!==p.loading)return;
  console.error('Atlas Integración · '+system,err);
  indicator.replaceChildren();
  const text=document.createElement('p');text.textContent='No se pudo cargar '+conf.label+'. Conservamos el modelo anterior.';
  indicator.appendChild(text);
  const retry=document.createElement('button');retry.type='button';retry.textContent='Reintentar';
  retry.addEventListener('click',()=>loadSystem(p,system,selectId));
  indicator.appendChild(retry);
 }
}
for(const p of panes){
 const selector=$('system-'+p.side);
 for(const item of INTEGRATION_SYSTEMS){
  const opt=document.createElement('option');opt.value=item.id;opt.textContent=item.label;selector.appendChild(opt);
 }
 selector.addEventListener('change',event=>loadSystem(p,event.target.value));
 $('focus-'+p.side).addEventListener('click',()=>focusSelection(p));
 $('isolate-'+p.side).addEventListener('click',()=>{p.isolated=!p.isolated;refresh(p)});
 $('hide-'+p.side).addEventListener('click',()=>{
  if(!p.selected)return;
  p.hidden.add(p.selected.id);clearSelection(p);
 });
 $('restore-'+p.side).addEventListener('click',()=>{
  p.hidden.clear();clearSelection(p);cameraView(p,'front');
 });
}
for(const btn of document.querySelectorAll('[data-view]')){
 btn.addEventListener('click',()=>{for(const p of panes)if(p.model)cameraView(p,btn.dataset.view)});
}
$('reset-panes').addEventListener('click',()=>{
 for(const p of panes){p.hidden.clear();clearSelection(p);if(p.model)cameraView(p,'front')}
});
$('why-no-overlay').addEventListener('click',()=>$('alignment-dialog').showModal());

const selectedSystems=new Set(INTEGRATION_SYSTEMS.map(x=>x.id));
for(const s of INTEGRATION_SYSTEMS){
 const label=document.createElement('label');
 const input=document.createElement('input');
 input.type='checkbox';input.value=s.id;input.checked=true;
 input.addEventListener('change',()=>{
  if(input.checked)selectedSystems.add(s.id);else selectedSystems.delete(s.id);
  moreCount=60;renderCatalogue();
 });
 label.appendChild(input);label.append(' '+s.label);
 $('system-filters').appendChild(label);
}
for(const r of INTEGRATION_REGIONS){
 const option=document.createElement('option');option.value=r.id;option.textContent=r.label;
 $('global-region').appendChild(option);
}
function drawer(open){
 $('catalogue-drawer').hidden=!open;
 $('close-backdrop').hidden=!open;
 if(open)$('global-query').focus();
}
$('open-catalogue').addEventListener('click',()=>drawer(true));
$('close-catalogue').addEventListener('click',()=>drawer(false));
$('close-backdrop').addEventListener('click',()=>drawer(false));
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('catalogue-drawer').hidden)drawer(false)});
$('global-query').addEventListener('input',()=>{moreCount=60;renderCatalogue()});
$('global-region').addEventListener('change',()=>{moreCount=60;renderCatalogue()});
$('load-more').addEventListener('click',()=>{moreCount+=60;renderCatalogue()});
function renderCatalogue(){
 const results=findStructures({
  query:$('global-query').value,region:$('global-region').value,
  systems:[...selectedSystems]
 });
 $('result-count').textContent=results.length+' registros';
 const host=$('global-results');host.replaceChildren();
 for(const entry of results.slice(0,moreCount)){
  const button=document.createElement('button');button.type='button';button.className='catalogue-entry';
  const origin=document.createElement('span');origin.className='result-system';
  origin.textContent=INTEGRATION_SYSTEM_MAP[entry.system]?.label||entry.system;
  const title=document.createElement('strong');title.textContent=entry.name;
  const sub=document.createElement('small');sub.textContent=entry.originalName;
  button.append(origin,title,sub);
  button.addEventListener('click',()=>{
   const current=panes.find(p=>p.system===entry.system);
   const p=current||panes[0];
   drawer(false);
   if(current&&current.model){
    const target=p.entries.find(x=>x.id===entry.id);
    if(target&&p.found.has(target.id))selectStructure(p,target,true);
    else $('caption-'+p.side).textContent='El catálogo incluye '+entry.name+', pero la malla correspondiente no fue identificada.';
   }else loadSystem(p,entry.system,entry.id);
  });
  host.appendChild(button);
 }
 if(!results.length){
  const msg=document.createElement('p');msg.className='empty-results';
  msg.textContent='Sin coincidencias. Prueba otra región o nombre.';
  host.appendChild(msg);
 }
 $('load-more').hidden=results.length<=moreCount;
 $('global-total').textContent=String(INTEGRATION_ENTRIES.length);
}
renderCatalogue();
loadSystem(panes[0],'nerve');
loadSystem(panes[1],'vessel');
