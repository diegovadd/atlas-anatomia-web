import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {
 JOINTS_SOURCE,JOINTS_STRUCTURES,JOINTS_BY_ID,JOINTS_GROUPS,JOINTS_KINDS,
 JOINTS_LIMITS,jointVisible,jointColor,jointRelated
} from './joints-data.js';

const $=id=>document.getElementById(id);
const canvas=$('joint-canvas'),viewport=$('joint-viewport');
const state={
 model:null,loading:false,loaded:false,entries:JOINTS_STRUCTURES.map(s=>({...s,meshes:[]})),
 selected:null,group:'all',kind:'all',context:true,isolated:false,hidden:new Set(),
 byId:new Map(),meshEntries:new Map()
};
state.byId=new Map(state.entries.map(e=>[e.id,e]));
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.4));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(42,1,.001,300);
scene.add(new THREE.HemisphereLight(0xe8e4d8,0x2c3440,1.65));
const key=new THREE.DirectionalLight(0xffffff,1.85);key.position.set(4,7,6);scene.add(key);
const rim=new THREE.DirectionalLight(0xb4bcd5,.75);rim.position.set(-4,2,-5);scene.add(rim);
const controls=new OrbitControls(camera,canvas);
controls.enableDamping=true;controls.dampingFactor=.08;controls.enablePan=true;
controls.minDistance=.08;controls.maxDistance=70;
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
let center=new THREE.Vector3(),extent=3;
function resize(){
 const w=viewport.clientWidth,h=viewport.clientHeight;
 if(w<2||h<2)return;
 camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);
}
new ResizeObserver(resize).observe(viewport);resize();
function animate(){requestAnimationFrame(animate);if(!document.hidden){controls.update();renderer.render(scene,camera)}}
animate();
function view(mode='front',target=center,radius=extent){
 const axis=mode==='back'?new THREE.Vector3(0,0,-1):mode==='left'?
  new THREE.Vector3(1,0,0):new THREE.Vector3(0,0,1);
 controls.target.copy(target);
 camera.position.copy(target).add(axis.multiplyScalar(Math.max(1.1,radius*1.75)));
 camera.near=Math.max(.001,radius/2500);
 camera.far=Math.max(300,radius*40);camera.updateProjectionMatrix();
 camera.up.set(0,1,0);camera.lookAt(target);controls.update();
}
function focus(entry){
 if(!entry?.meshes.length)return;
 const b=new THREE.Box3();
 for(const m of entry.meshes)b.expandByObject(m);
 if(b.isEmpty())return;
 const size=b.getSize(new THREE.Vector3());
 view('front',b.getCenter(new THREE.Vector3()),Math.max(.28,size.x,size.y,size.z)*1.3);
}
function visible(entry){
 return jointVisible(entry,{
  group:state.group,kind:state.kind,context:state.context,hiddenIds:state.hidden,
  isolateId:state.isolated?state.selected?.id??null:null
 });
}
function refresh(){
 for(const entry of state.entries){
  const show=visible(entry),active=entry===state.selected;
  for(const mesh of entry.meshes){
   mesh.visible=show;
   const mat=mesh.material;
   mat.color.set(active?'#fff0c9':jointColor(entry));
   mat.emissive.set(active?'#6b4b26':'#000000');
   mat.emissiveIntensity=active?.34:0;
   const fade=Boolean(state.selected&&!active&&!state.isolated)&&entry.kind!=='bone';
   const contextFade=entry.kind==='bone';
   const alpha=fade?.20:contextFade?.19:1;
   const transparent=alpha<1;
   if(mat.transparent!==transparent||mat.opacity!==alpha){
    mat.transparent=transparent;mat.opacity=alpha;mat.depthWrite=!transparent;mat.needsUpdate=true;
   }
  }
 }
 $('joint-selected').hidden=!state.selected;
 $('joint-rail-isolate').disabled=!state.selected;
 $('joint-isolate').textContent=state.isolated?'Mostrar alrededor':'Aislar';
 $('joint-context').setAttribute('aria-pressed',String(state.context));
 $('joint-context').textContent=state.context?'Ocultar huesos':'Mostrar huesos';
 for(const [id,kind] of [['joint-kind-ligaments','ligament'],['joint-kind-cartilage','fibrocartilage'],['joint-kind-all','all']])
  $(id).setAttribute('aria-pressed',String(state.kind===kind));
 $('joint-kind').value=state.kind;$('joint-group').value=state.group;
}
function list(){
 const host=$('joint-list');host.replaceChildren();
 const norm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const q=norm($('joint-query').value.trim());
 const found=state.entries.filter(e=>
  (state.group==='all'||e.group===state.group)&&
  (state.kind==='all'||e.kind===state.kind)&&
  (!q||norm(e.name+' '+e.originalName+' '+e.regionName+' '+e.id).includes(q))
 );
 $('joint-count').textContent=`${found.length} de ${JOINTS_STRUCTURES.length} estructuras`;
 if(!found.length){
  const empty=document.createElement('p');empty.className='joint-empty';
  empty.textContent='Sin resultados en este filtro.';host.appendChild(empty);return;
 }
 let last='';
 for(const entry of found){
  if(state.group==='all'&&entry.group!==last){
   const h=document.createElement('div');h.className='joint-group-heading';
   h.textContent=entry.regionName;host.appendChild(h);last=entry.group;
  }
  const b=document.createElement('button');b.type='button';
  b.className='joint-item'+(entry===state.selected?' active':'')+(state.hidden.has(entry.id)?' hidden-item':'');
  b.dataset.kind=entry.kind;
  b.setAttribute('aria-pressed',String(entry===state.selected));
  b.textContent=entry.name+(state.hidden.has(entry.id)?' · retirado':'');
  b.title=entry.translated?'Nombre español preliminar':'Nombre original; traducción pendiente';
  b.addEventListener('click',()=>select(entry,true));
  host.appendChild(b);
 }
}
function info(){
 const e=state.selected;
 $('joint-info-empty').hidden=!!e;$('joint-info-content').hidden=!e;
 if(!e)return;
 $('joint-info-title').textContent=e.name;
 $('joint-info-subtitle').textContent=e.translated?'Denominación en español preliminar':'Nombre original conservado · traducción pendiente';
 $('joint-info-group').textContent=e.regionName;
 $('joint-info-kind').textContent=JOINTS_KINDS.find(x=>x.id===e.kind)?.name||e.kind;
 $('joint-info-source').textContent=e.originalName;
 $('joint-info-side').textContent=e.sourceCount>=2?
  'Varios elementos originales agrupados; no implica lateralidad independiente':
  'Un elemento original o conjunto fusionado';
 $('joint-info-translation').textContent=e.translated?'Provisional, pendiente de revisión':'No verificada (inglés original)';
 const host=$('joint-relations');host.replaceChildren();
 const ids=jointRelated(e).slice(0,10);
 if(!ids.length){
  const p=document.createElement('p');p.textContent='No hay otras mallas relacionadas de esta región en el recurso.';host.appendChild(p);
 }
 for(const id of ids){
  const related=state.byId.get(id);
  const button=document.createElement('button');button.type='button';button.textContent=related.name;
  button.addEventListener('click',()=>select(related,true));host.appendChild(button);
 }
}
function select(entry,shouldFocus=false){
 if(!entry)return;
 state.hidden.delete(entry.id);
 if(state.group!=='all'&&state.group!==entry.group)state.group='all';
 if(state.kind!=='all'&&state.kind!==entry.kind)state.kind='all';
 state.selected=entry;state.isolated=false;
 $('joint-selected-name').textContent=entry.name;
 $('joint-selected-group').textContent=entry.regionName.toUpperCase();
 refresh();list();info();
 if(shouldFocus&&state.loaded)focus(entry);
}
function clear(){
 state.selected=null;state.isolated=false;refresh();list();info();
}
function setKind(kind){
 state.kind=kind;clear();
 $('joint-status').textContent=kind==='all'?'Todos los tejidos disponibles.':JOINTS_KINDS.find(x=>x.id===kind)?.name||kind;
}
function isolate(){
 if(!state.selected)return;
 state.isolated=!state.isolated;refresh();
}
function hideSelected(){
 if(!state.selected)return;
 const name=state.selected.name;
 state.hidden.add(state.selected.id);
 clear();
 $('joint-status').textContent=`Retirado temporalmente: ${name}. Recupera la malla desde la lista o restablece las capas.`;
}
function reset(){
 state.hidden.clear();state.selected=null;state.isolated=false;
 state.group='all';state.kind='all';state.context=true;$('joint-query').value='';
 refresh();list();info();view('front');
 $('joint-status').textContent='Todos los tejidos articulares restaurados.';
}
function closeDrawers(){
 $('joint-list-drawer').hidden=true;$('joint-info-drawer').hidden=true;$('joint-dismiss').hidden=true;
}
function drawer(id,search=false){
 closeDrawers();$(id).hidden=false;$('joint-dismiss').hidden=false;
 if(search)$('joint-query').focus();
}
function install(model){
 const groups=new Map(JOINTS_STRUCTURES.map(s=>[s.id,{...s,meshes:[]}]));
 model.traverse(mesh=>{
  if(!mesh.isMesh)return;
  const entry=groups.get(mesh.userData?.structureId||mesh.name);
  if(entry)entry.meshes.push(mesh);else mesh.visible=false;
 });
 const missing=[...groups.values()].filter(x=>!x.meshes.length);
 if(missing.length)throw Error('GLB: '+missing.length+' estructuras no coinciden con el inventario.');
 const bbox=new THREE.Box3().setFromObject(model);
 if(bbox.isEmpty())throw Error('GLB sin geometría');
 for(const entry of groups.values())for(const mesh of entry.meshes){
  mesh.material=new THREE.MeshStandardMaterial({color:jointColor(entry),roughness:.80,metalness:0,side:THREE.DoubleSide});
  mesh.frustumCulled=false;
 }
 if(state.model)scene.remove(state.model);
 state.model=model;scene.add(model);
 state.entries=[...groups.values()];
 state.byId=new Map(state.entries.map(e=>[e.id,e]));
 state.meshEntries=new Map(state.entries.flatMap(e=>e.meshes.map(mesh=>[mesh,e])));
 center=bbox.getCenter(new THREE.Vector3());
 const sz=bbox.getSize(new THREE.Vector3());
 extent=Math.max(sz.x,sz.y,sz.z);
 state.loaded=true;state.selected=null;state.hidden.clear();
 state.kind='all';state.group='all';state.context=true;state.isolated=false;
 refresh();list();info();view('front');
 $('joint-loading').hidden=true;$('joint-intro').hidden=true;
 $('joint-status').textContent=`${state.entries.length} estructuras 3D · ligamentos, cápsulas, meniscos y referencias óseas. Tendones no incluidos.`;
}
async function load(){
 if(state.loading)return;
 state.loading=true;$('joint-loading').hidden=false;$('joint-retry').hidden=true;
 $('joint-loading-text').textContent='Descargando 2,9 MB de mallas articulares abiertas…';
 try{
  const loader=new GLTFLoader();
  const model=await loader.loadAsync(JOINTS_SOURCE.url,event=>{
   if(event.total>0)$('joint-loading-text').textContent=`Descargando: ${Math.round(event.loaded/event.total*100)}%`;
  });
  install(model.scene);
 }catch(error){
  console.error('Atlas Lab · carga articular:',error);
  $('joint-loading-text').textContent='No se pudo cargar el modelo 3D. Comprueba la conexión y reintenta. El catálogo textual continúa disponible.';
  $('joint-status').textContent='El modelo externo aún no está disponible.';
  $('joint-retry').hidden=false;
 }finally{state.loading=false}
}
for(const opt of JOINTS_GROUPS){const o=document.createElement('option');o.value=opt.id;o.textContent=opt.name;$('joint-group').appendChild(o)}
for(const opt of JOINTS_KINDS){const o=document.createElement('option');o.value=opt.id;o.textContent=opt.name;$('joint-kind').appendChild(o)}
for(const lim of JOINTS_LIMITS){const li=document.createElement('li');li.textContent=lim;$('joint-limits').appendChild(li)}
$('joint-group').addEventListener('change',event=>{
 state.group=event.target.value;clear();
 if(state.loaded){
  const shown=state.entries.filter(visible);
  if(shown.length){
   const b=new THREE.Box3();for(const e of shown)for(const mesh of e.meshes)b.expandByObject(mesh);
   if(!b.isEmpty()){const s=b.getSize(new THREE.Vector3());view('front',b.getCenter(new THREE.Vector3()),Math.max(s.x,s.y,s.z)*1.22)}
  }
 }
});
$('joint-kind').addEventListener('change',event=>setKind(event.target.value));
$('joint-kind-ligaments').addEventListener('click',()=>setKind('ligament'));
$('joint-kind-cartilage').addEventListener('click',()=>setKind('fibrocartilage'));
$('joint-kind-all').addEventListener('click',()=>setKind('all'));
$('joint-context').addEventListener('click',()=>{state.context=!state.context;refresh()});
$('joint-query').addEventListener('input',list);
$('joint-view-front').addEventListener('click',()=>view('front'));
$('joint-view-left').addEventListener('click',()=>view('left'));
$('joint-view-back').addEventListener('click',()=>view('back'));
$('joint-rail-isolate').addEventListener('click',isolate);
$('joint-isolate').addEventListener('click',isolate);
$('joint-info-isolate').addEventListener('click',isolate);
$('joint-hide').addEventListener('click',hideSelected);
$('joint-show-all').addEventListener('click',reset);
$('joint-reset-rail').addEventListener('click',reset);
$('joint-focus').addEventListener('click',()=>focus(state.selected));
$('joint-open-list').addEventListener('click',()=>drawer('joint-list-drawer'));
$('joint-open-search').addEventListener('click',()=>drawer('joint-list-drawer',true));
$('joint-open-info').addEventListener('click',()=>drawer('joint-info-drawer'));
$('joint-selected-info').addEventListener('click',()=>drawer('joint-info-drawer'));
$('joint-intro-list').addEventListener('click',()=>drawer('joint-list-drawer'));
$('joint-close-list').addEventListener('click',closeDrawers);
$('joint-close-info').addEventListener('click',closeDrawers);
$('joint-dismiss').addEventListener('click',closeDrawers);
$('joint-retry').addEventListener('click',load);
let down=null;
canvas.addEventListener('pointerdown',event=>{down={x:event.clientX,y:event.clientY}});
canvas.addEventListener('pointerup',event=>{
 const start=down;down=null;
 if(!state.loaded||!start||Math.hypot(event.clientX-start.x,event.clientY-start.y)>5)return;
 const rect=canvas.getBoundingClientRect();
 pointer.set((event.clientX-rect.left)/rect.width*2-1,-((event.clientY-rect.top)/rect.height*2-1));
 raycaster.setFromCamera(pointer,camera);
 const found=raycaster.intersectObjects([...state.meshEntries.keys()].filter(mesh=>mesh.visible),false)
  .map(hit=>state.meshEntries.get(hit.object)).find(Boolean);
 if(found)select(found);
});
window.addEventListener('keydown',event=>{
 if(event.key==='Escape'){
  if(!$('joint-list-drawer').hidden||!$('joint-info-drawer').hidden)closeDrawers();
  else if(state.isolated){state.isolated=false;refresh()}
 }
});
list();refresh();info();view('front');load();
