import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {REGIONS, classifyRegion, skullDivision, skullInventory, skullBoneId, boneSide, boneInfo} from './anatomy-data.js';
import {summarizeSkullGeometry, canUseDetailedSkull} from './geometry-stats.js';
import {updateDualSelection, findContralateralBone, selectBilateralPair, wantsExtendedSelection} from './selection.js';
import {PRIMARY_BIBLIOGRAPHY} from './bibliography.js';
import {landmarkSuggestions,validLandmarkLabel,normalizeLandmarkCollection,landmarkStorageKey,landmarksForBone} from './landmarks.js';
import {BONE_SURFACE, DEFAULT_RENDER_SETTINGS, normalizeRenderQuality, normalizeLightLevel, displayPixelRatio, displayExposure} from './render-settings.js';
import {readStudyPreferences,saveStudyPreferences} from './study-preferences.js';

// Modelo derivado de Z-Anatomy / BodyParts3D. Licencias y atribución: ver README.md.
const URLS=[
  './assets/skeleton.glb',
  'https://cdn.jsdelivr.net/gh/SeemaBansal1/3d-human-body-anatomy@main/web/public/models/skeleton.glb',
  'https://raw.githubusercontent.com/SeemaBansal1/3d-human-body-anatomy/main/web/public/models/skeleton.glb'
];
const $=id=>document.getElementById(id);
const state={scene:null,renderer:null,camera:null,controls:null,root:null,model:null,entries:[],selected:null,selectedEntries:[],multiSelectMode:false,region:'body',filter:'all',search:'',isolated:false,ghost:false,opacity:1,pointerStart:null,loaded:false,showOnly:null,baseScene:null,detailScene:null,detailActive:false,detailName:'',baseSkullStats:null,detailStats:null,quality:DEFAULT_RENDER_SETTINGS.quality,lightLevel:DEFAULT_RENDER_SETTINGS.light,baseSourceKey:'reference-skeleton-v1',detailSourceKey:'',annotations:[],placingAnnotation:false,annotationRendered:[]};
const study={active:false,panel:null,automatic:false,autoFocusOnIsolate:true};
const tempBox=new THREE.Box3();
let homePos=new THREE.Vector3(0,1,3),homeTarget=new THREE.Vector3(0,0.85,0);
const raycaster=new THREE.Raycaster(), mouse=new THREE.Vector2();

function restoreDisplayPreferences(){
 try{
  const saved=JSON.parse(localStorage.getItem('atlas:display')||'null');
  if(saved&&typeof saved==='object'){
   state.quality=normalizeRenderQuality(saved.quality);
   state.lightLevel=normalizeLightLevel(saved.lightLevel);
  }
 }catch(error){console.warn('Preferencias visuales no disponibles',error)}
}
function updateDisplaySettings(save=false){
 $('quality-mode').value=state.quality;
 $('light-level').value=String(state.lightLevel);
 $('light-value').textContent=state.lightLevel+'%';
 if(state.renderer){
  state.renderer.setPixelRatio(displayPixelRatio(state.quality,window.devicePixelRatio));
  state.renderer.toneMappingExposure=displayExposure(state.lightLevel);
 }
 if(save){
  try{localStorage.setItem('atlas:display',JSON.stringify({quality:state.quality,lightLevel:state.lightLevel}))}
  catch(error){console.warn('No fue posible guardar las preferencias visuales',error)}
 }
}
// El modo enfoque solo modifica la interfaz; no elimina estructuras ni datos del visor.
function restoreStudyPreferences(){
 study.autoFocusOnIsolate=readStudyPreferences(localStorage).autoFocusOnIsolate;
 $('auto-focus-isolate').checked=study.autoFocusOnIsolate;
}
function refreshFocusInterface(){
 const app=$('app');
 app.classList.toggle('study-focus',study.active);
 $('sidebar').classList.toggle('focus-open',study.active&&study.panel==='navigation');
 $('inspector').classList.toggle('focus-open',study.active&&study.panel==='details');
 $('focus-toolbar').hidden=!study.active;
 $('focus-show-region').hidden=!state.isolated;
 $('study-selection').hidden=!study.active;
 $('study-selection-name').textContent=state.selectedEntries.length>1?
  state.selectedEntries.map(entry=>entry.info.name).join(' + '):
  state.selected?.info.name||REGIONS.find(region=>region.id===state.region)?.label||'Sistema óseo';
 const focusButton=$('btn-focus-mode');
 focusButton.setAttribute('aria-pressed',String(study.active));
 focusButton.querySelector('span').textContent=study.active?'Vista clásica':'Vista inmersiva';
 focusButton.title=study.active?'Cambiar a distribución clásica (F)':'Volver al visor inmersivo (F)';
 for(const id of ['bubble-regions','bubble-search','bubble-select'])$(id).setAttribute('aria-expanded',String(study.active&&study.panel==='navigation'));
 for(const id of ['bubble-info','bubble-annotations','bubble-settings'])$(id).setAttribute('aria-expanded',String(study.active&&study.panel==='details'));
 $('bubble-isolate').disabled=!state.selectedEntries.length;
 $('bubble-annotations').disabled=state.region!=='skull'||!state.loaded;
 $('bubble-annotations').title=state.region==='skull'?'Flechas anatómicas del cráneo':'Disponible en el cráneo';
 $('bubble-isolate').classList.toggle('selected',state.isolated);
 $('bubble-isolate').setAttribute('aria-pressed',String(state.isolated));
 $('focus-nav').setAttribute('aria-expanded',String(study.active&&study.panel==='navigation'));
 $('focus-info').setAttribute('aria-expanded',String(study.active&&study.panel==='details'));
}
function setStudyFocus(active,automatic=false){
 study.active=Boolean(active);
 study.automatic=study.active&&automatic;
 if(!study.active)study.panel=null;
 refreshFocusInterface();
}
function openStudyPanel(panel){
 if(!study.active)setStudyFocus(true);
 study.panel=panel;
 refreshFocusInterface();
}
function openStudyNavigation(section,search=false){
 openStudyPanel('navigation');
 requestAnimationFrame(()=>{
  const node=$(section);
  if(node)node.scrollIntoView({block:'nearest',behavior:'smooth'});
  if(search)$('search').focus({preventScroll:true});
 });
}
function openStudyDetails(section){
 openStudyPanel('details');
 if(section){
  const node=$(section);
  if(node){node.open=true;requestAnimationFrame(()=>node.scrollIntoView({block:'nearest',behavior:'smooth'}));}
 }
}
function toggleStudyPanel(panel){
 if(!study.active)return;
 study.panel=study.panel===panel?null:panel;
 refreshFocusInterface();
}
function exitAutoFocus(){
 if(study.active&&study.automatic)setStudyFocus(false);
}
function showRegionFromFocus(){
 state.isolated=false;
 state.placingAnnotation=false;
 exitAutoFocus();
 updateVisibility();
}
function initThree(){
 const canvas=$('scene'), viewport=$('viewport');
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
 const scene=new THREE.Scene();
 const camera=new THREE.PerspectiveCamera(34,1,.008,150);camera.position.copy(homePos);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.07;controls.minDistance=.08;controls.maxDistance=12;controls.enablePan=true;controls.target.copy(homeTarget);
 scene.add(new THREE.AmbientLight(0xf8eede,0.55));
 const hemi=new THREE.HemisphereLight(0xe8f0f1,0x273c43,1.05);scene.add(hemi);
 const key=new THREE.DirectionalLight(0xfff2e4,1.8);key.position.set(2,6,4);scene.add(key);
 const fill=new THREE.DirectionalLight(0xcedfda,0.55);fill.position.set(-3,2,1);scene.add(fill);
 const rim=new THREE.DirectionalLight(0xb4c7dd,0.60);rim.position.set(-2,4,-3);scene.add(rim);
 const floor=new THREE.GridHelper(4.8,20,0x294653,0x1d323e);floor.material.transparent=true;floor.material.opacity=.12;floor.position.y=-.018;scene.add(floor);
 for(const [radius,opacity] of [[.75,.16],[1.0,.08]]){const g=new THREE.RingGeometry(radius,radius+.004,160);const m=new THREE.MeshBasicMaterial({color:0x5abcae,side:THREE.DoubleSide,transparent:true,opacity,depthWrite:false});const ring=new THREE.Mesh(g,m);ring.rotation.x=-Math.PI/2;ring.position.y=-.012;scene.add(ring)}
 const root=new THREE.Group();scene.add(root);Object.assign(state,{scene,camera,controls,renderer,root});updateDisplaySettings();
 const resize=()=>{let w=viewport.clientWidth,h=viewport.clientHeight;if(!w||!h)return;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setPixelRatio(displayPixelRatio(state.quality,window.devicePixelRatio));renderer.setSize(w,h,false)};new ResizeObserver(resize).observe(viewport);resize();
 let active=true;function animate(){if(!active)return;requestAnimationFrame(animate);controls.update();updateAnnotationScreen();renderer.render(scene,camera)}animate();
 canvas.addEventListener('pointerdown',e=>{state.pointerStart={x:e.clientX,y:e.clientY,extend:wantsExtendedSelection(e,state.multiSelectMode)}});
 canvas.addEventListener('pointerup',e=>{const p=state.pointerStart;state.pointerStart=null;if(!p||Math.hypot(e.clientX-p.x,e.clientY-p.y)>5)return;pick(e,p.extend)});
 window.addEventListener('keydown',e=>{
  const typing=['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName);
  if(e.key.toLowerCase()==='f'&&!typing&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();setStudyFocus(!study.active);return}
  if(e.key==='Escape'){
   if(study.active&&study.panel){study.panel=null;refreshFocusInterface();return}
   if(study.active)setStudyFocus(false);
   state.placingAnnotation=false;clearSelection();updateVisibility();refreshInfo();renderList();$('help-dialog').hidden=true;
  }
  if(e.key==='/'&&!typing){e.preventDefault();$('search').focus()}
 });
}
function updateStatus(text,error=false){$('model-status-short').textContent=text;document.querySelector('.data-indicator').classList.toggle('error',error)}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function loadDefault(){
 $('loading-overlay').hidden=false;$('retry-model').hidden=true;$('loading-title').textContent='Preparando anatomía 3D';$('loading-message').textContent='Conectando con la colección anatómica…';$('load-progress').style.width='6%';updateStatus('Cargando geometría');
 for(let i=0;i<URLS.length;i++){
  const url=URLS[i];try{
   const gltf=await loadGLB(url,p=>{if(p?.total){const percent=Math.min(92,8+Math.round(p.loaded/p.total*82));$('load-progress').style.width=percent+'%';$('loading-message').textContent=`Descargando mallas óseas… ${percent}%`}});
   state.baseScene=gltf.scene;state.baseSourceKey='reference-skeleton-v1';state.detailScene=null;state.detailStats=null;state.detailName='';state.detailActive=false;acceptModel(gltf.scene);$('loading-overlay').hidden=true;return;
  }catch(e){console.warn('No se pudo cargar',url,e);await sleep(120)}
 }
 $('loading-title').textContent='No se pudo descargar el modelo';$('loading-message').textContent='Comprueba tu conexión a Internet o importa un archivo skeleton.glb desde el botón superior.';$('retry-model').hidden=false;updateStatus('Modelo no disponible',true);$('load-progress').style.width='0%';
}
function loadGLB(url,onProgress){
 return new Promise((resolve,reject)=>{
  const loader=new GLTFLoader();const draco=new DRACOLoader();draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');loader.setDRACOLoader(draco);
  loader.load(url,g=>{draco.dispose();resolve(g)},onProgress,e=>{draco.dispose();reject(e)});
 });
}
function atlasMeshLabel(obj){
 const ud=Object.keys(obj.userData||{}).length?obj.userData:(obj.parent?.userData||{});
 const possibilities=[ud.zname,obj.name,obj.parent?.name].filter(value=>typeof value==='string'&&value.trim());
 return String(possibilities.find(name=>skullBoneId(name))||possibilities[0]||'Hueso sin nombre').trim();
}
function readSkullScene(scene){
 const meshes=[];
 scene.traverse(obj=>{if(obj.isMesh)meshes.push({name:atlasMeshLabel(obj),geometry:obj.geometry,isMesh:true})});
 return summarizeSkullGeometry(meshes);
}
function updateDetailPanel(){
 const section=$('skull-detail-section');
 section.hidden=!state.loaded||state.region!=='skull';
 $('advanced-skull').hidden=section.hidden;
 if(section.hidden)return;
 const base=state.baseSkullStats;
 const detail=state.detailStats;
 $('skull-detail-title').textContent=state.detailActive?'CRÁNEO IMPORTADO':'ESQUELETO ORIGINAL';
 $('skull-detail-baseline').textContent=base?`${base.skullMeshes} mallas identificadas · ${base.triangles.toLocaleString('es')} triángulos`:'Sin datos';
 $('skull-detail-alternate').textContent=detail?`${detail.skullMeshes} mallas · ${detail.triangles.toLocaleString('es')} triángulos · ${detail.coverage.identified}/22 posiciones identificadas`:'Sin archivo de detalle';
 $('skull-detail-switch').disabled=!state.detailScene;
 $('skull-detail-switch').textContent=state.detailActive?'Volver al esqueleto':'Ver cráneo importado';
 $('skull-detail-audit').textContent=detail?
  `Archivo: ${state.detailName}. El número de triángulos mide complejidad de malla, no exactitud anatómica. ${detail.unknownMeshes} mallas no identificadas como huesos craneales.`:
  'Puedes cargar un archivo GLB con huesos del cráneo separados y correctamente nombrados. No se envía al servidor.';
}
function acceptModel(scene,region='body'){
 if(state.model){state.root.remove(state.model);state.model.traverse(o=>{if(o.isMesh&&o.material?.dispose)o.material.dispose()})}
 state.model=scene;state.root.add(scene);state.entries=[];
 const palette=[0xc9c0b2,0xc4bcaf,0xd0c5b7,0xc6bcae,0xcbbfae];let index=0;
 scene.traverse(obj=>{
  if(!obj.isMesh)return;
  const ud=Object.keys(obj.userData||{}).length?obj.userData:(obj.parent?.userData||{});
  const raw=atlasMeshLabel(obj);
  const group=String(ud.zgroup||'');
  const region=classifyRegion(raw,group), info=boneInfo(raw);
  const color=new THREE.Color(palette[index%palette.length]);index++;
  const mat=new THREE.MeshStandardMaterial({color,metalness:BONE_SURFACE.metalness,roughness:BONE_SURFACE.roughness,side:THREE.DoubleSide});
  obj.material=mat;obj.userData={...ud,atlasName:raw,atlasRegion:region,atlasInfo:info,atlasOriginal:mat,atlasBaseColor:color.clone(),atlasGroup:group};
  obj.frustumCulled=false;
  state.entries.push({id:state.entries.length,name:raw,region,info,mesh:obj,division:skullDivision(raw)});
 });
 if(!state.entries.length)throw new Error('El archivo no contiene geometrías Mesh seleccionables');
 // Centrar en el suelo y en el eje vertical sin modificar las coordenadas locales del modelo.
 state.root.position.set(0,0,0);state.root.updateMatrixWorld(true);
 const bbox=new THREE.Box3().setFromObject(scene),c=bbox.getCenter(new THREE.Vector3()),sz=bbox.getSize(new THREE.Vector3());
 state.root.position.set(-c.x,-bbox.min.y,-c.z);state.root.updateMatrixWorld(true);
 const h=Math.max(sz.y,.5);homeTarget=new THREE.Vector3(0,h*.52,0);homePos=new THREE.Vector3(h*.14,h*.58,h*2.2);state.camera.position.copy(homePos);state.controls.target.copy(homeTarget);state.controls.minDistance=Math.max(.04,h*.045);state.controls.maxDistance=h*7;state.camera.far=Math.max(100,h*20);state.camera.updateProjectionMatrix();state.controls.update();
 state.loaded=true;state.region=region;state.selected=null;state.selectedEntries=[];state.multiSelectMode=false;state.isolated=false;state.placingAnnotation=false;state.annotations=readStoredAnnotations();state.ghost=false;state.opacity=1;$('opacity').value='100';$('opacity-value').textContent='100%';
 if(!state.detailActive)state.baseSkullStats=readSkullScene(scene);
 $('load-progress').style.width='100%';updateStatus(`${state.entries.length} mallas disponibles`);renderRegions();renderList();refreshInfo();updateVisibility();updateTitles();if(region==='skull')focusRegion();
}
function getRegionEntries(){return state.region==='body'?state.entries:state.entries.filter(e=>e.region===state.region)}
function currentList(){let es=getRegionEntries();if(state.region==='skull'&&state.filter!=='all')es=es.filter(e=>e.division===state.filter);if(state.search.trim()){const q=fold(state.search);es=es.filter(e=>fold(e.name+' '+e.info.name+' '+e.info.latin).includes(q))}return es.sort((a,b)=>a.info.name.localeCompare(b.info.name,'es'))}
function fold(x){return String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function renderRegions(){
 const el=$('regions');el.innerHTML='';REGIONS.forEach(r=>{let count=r.id==='body'?state.entries.length:state.entries.filter(e=>e.region===r.id).length;const b=document.createElement('button');b.className='region'+(state.region===r.id?' active':'');b.type='button';b.innerHTML=`<span class="region-symbol">${r.icon}</span><span></span><span class="region-chevron">${count||'–'} ›</span>`;b.children[1].textContent=r.label;b.addEventListener('click',()=>selectRegion(r.id));el.appendChild(b)})}
function renderSkullInventory(){
 const section=$('skull-inventory');
 section.hidden=state.region!=='skull'||!state.loaded;
 if(section.hidden)return;
 const result=skullInventory(getRegionEntries());
 $('skull-inventory-summary').textContent=`Inventario del modelo: ${result.identified}/${result.total} posiciones óseas identificadas`;
 const details=$('skull-inventory-missing');details.replaceChildren();
 const text=document.createElement('p');
 text.textContent='Conteo basado en nombres y lateralidad de las mallas; no demuestra precisión anatómica. Los huesecillos del oído no se incluyen.';
 details.appendChild(text);
 if(result.missing.length){
  const heading=document.createElement('strong');heading.textContent=`Posiciones sin identificar (${result.missing.length}):`;details.appendChild(heading);
  const ul=document.createElement('ul');
  for(const missing of result.missing){const li=document.createElement('li');li.textContent=missing.name;ul.appendChild(li)}
  details.appendChild(ul);
 }else{
  const complete=document.createElement('p');complete.textContent='Se reconocieron las 22 posiciones por nombre y lado. Falta comprobar visualmente las mallas y la anatomía.';details.appendChild(complete);
 }
 if(result.unresolved.length){
  const note=document.createElement('p');
  note.textContent=`Hay ${result.unresolved.length} nombres de huesos pares sin lado definido; no se contabilizan como completos: ${result.unresolved.join(', ')}.`;
  details.appendChild(note);
 }
}
function renderList(){
 renderSkullInventory();updateDetailPanel();
 const list=currentList(),container=$('structure-list');container.replaceChildren();$('structure-count').textContent=String(list.length);$('structures-heading').textContent=state.region==='body'?'ESTRUCTURAS':('HUESOS · '+(REGIONS.find(x=>x.id===state.region)?.label||'')).toUpperCase();$('skull-filters').hidden=state.region!=='skull';
 if(!list.length){container.innerHTML='<div class="small-help">No hay resultados en esta región. Prueba otra búsqueda o selecciona «Cuerpo completo».</div>';return}
 for(const entry of list){const b=document.createElement('button');b.className='structure-item'+(state.selectedEntries.some(item=>item.id===entry.id)?' active':'');b.setAttribute('aria-pressed',String(state.selectedEntries.some(item=>item.id===entry.id)));b.type='button';const d=document.createElement('span');d.className='tiny-circle';const name=document.createElement('span');name.textContent=entry.info.name;const side=document.createElement('span');side.className='item-side';side.textContent=boneSide(entry.name)==='left'?'Izq.':boneSide(entry.name)==='right'?'Der.':entry.division==='neuro'?'N':entry.division==='face'?'V':'›';b.append(d,name,side);b.title=entry.name;b.addEventListener('click',event=>selectBone(entry,true,wantsExtendedSelection(event,state.multiSelectMode)));container.appendChild(b)}
}
function selectRegion(id){
 if(state.detailActive&&id!=='skull'&&state.baseScene){
  state.detailActive=false;
  acceptModel(state.baseScene);
  if(id!=='body')selectRegion(id);
  return;
 }
 state.region=id;clearSelection();state.filter='all';state.isolated=false;state.ghost=false;document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b.dataset.filter==='all'));
 updateTitles();renderRegions();renderList();refreshInfo();updateVisibility();focusRegion();
}
function updateTitles(){let reg=REGIONS.find(r=>r.id===state.region);$('crumb-region').textContent=reg.label;const title=state.region==='body'?'Sistema <em>óseo</em>':state.region==='skull'?'Cráneo <em>humano</em>':reg.label.split(' ').slice(0,-1).join(' ')+` <em>${reg.label.split(' ').at(-1)}</em>`;$('viewer-title').innerHTML=title;
 $('viewer-subtitle').innerHTML=state.region==='skull'?'Neurocráneo y viscerocráneo.<br>Selecciona cada hueso para conocer sus detalles.':'Selecciona una estructura para estudiar su anatomía.<br>Gira, acerca y aísla cada componente.';
 $('focus-pill').hidden=state.region==='body';$('focus-pill-text').textContent=reg.label;
}
function clearSelection(){
 state.selectedEntries=[];state.selected=null;state.isolated=false;state.ghost=false;state.placingAnnotation=false;
 exitAutoFocus();
}
function selectedMeshes(){return state.selectedEntries.map(entry=>entry.mesh)}
function selectBone(entry,focus=false,extend=false){
 exitAutoFocus();
 state.placingAnnotation=false;state.selectedEntries=updateDualSelection(state.selectedEntries,entry,extend);
 state.selected=state.selectedEntries.at(-1)||null;
 state.isolated=false;state.ghost=false;
 updateVisibility();refreshInfo();renderList();
 if(focus&&state.selectedEntries.length)focusObjects(selectedMeshes());
}
function selectOppositeBone(){
 if(state.selectedEntries.length!==1)return;
 exitAutoFocus();
 const entry=state.selectedEntries[0];
 const paired=selectBilateralPair(state.entries,entry);
 if(paired.length!==2)return;
 state.placingAnnotation=false;state.selectedEntries=paired;state.selected=entry;
 state.isolated=false;state.ghost=false;
 updateVisibility();refreshInfo();renderList();focusObjects(selectedMeshes());
}
function updateSelectionControls(){
 const count=state.selectedEntries.length;
 const multi=$('btn-multi-select');
 multi.setAttribute('aria-pressed',String(state.multiSelectMode));
 multi.classList.toggle('active',state.multiSelectMode);
 multi.textContent=state.multiSelectMode?'Selección múltiple: activada':'Selección múltiple: desactivada';
 $('selection-mode-hint').textContent=state.multiSelectMode
  ?'Elige dos huesos con clics normales, en la lista o el modelo 3D. Otro clic en un hueso seleccionado lo quita.'
  :'Activa el botón para seleccionar dos huesos sin teclas. También puedes usar Ctrl/Shift + clic.';
 $('selected-summary').textContent=count===0?'Ningún hueso seleccionado':count===1?'1 hueso seleccionado':'2 huesos seleccionados: '+state.selectedEntries.map(e=>e.info.name).join(' + ');
 const other=count===1?findContralateralBone(state.entries,state.selectedEntries[0]):null;
 $('btn-pair').disabled=!other;
 $('btn-pair').title=other?'Seleccionar '+other.info.name:'Disponible para huesos pares reconocidos en el modelo';
 $('btn-clear-selection').disabled=count===0;
}
function focusObjects(objects){if(!objects?.length)return;const box=new THREE.Box3();objects.forEach(o=>box.expandByObject(o));if(box.isEmpty())return;const center=box.getCenter(new THREE.Vector3());const size=box.getSize(new THREE.Vector3());const r=Math.max(size.x,size.y,size.z,.06);const dist=Math.max(r*2.9,.12);
 const direction=new THREE.Vector3(.18,.1,1).normalize();state.controls.target.copy(center);state.camera.position.copy(center).addScaledVector(direction,dist);state.controls.update()}
function focusRegion(){const selected=getRegionEntries();if(state.region==='body'){resetView();return}if(selected.length)focusObjects(selected.map(e=>e.mesh))}
function resetView(){state.camera.position.copy(homePos);state.controls.target.copy(homeTarget);state.controls.update()}
function updateVisibility(){
 for(const e of state.entries){const allowed=state.region==='body'||e.region===state.region;const inFilter=state.region!=='skull'||state.filter==='all'||e.division===state.filter;const isSelected=state.selectedEntries.some(item=>item.id===e.id);
  const visible=allowed&&inFilter&&(!state.isolated||state.selectedEntries.length===0||isSelected);e.mesh.visible=visible;
  const mat=e.mesh.material;let opacity=state.opacity;if(state.ghost&&state.selectedEntries.length&&!isSelected)opacity=.12;if(isSelected)opacity=1;
  mat.transparent=opacity<.999;mat.opacity=opacity;mat.depthWrite=opacity>.65;
  if(isSelected){mat.color.set('#9fc9be');mat.emissive.set('#173f37');mat.emissiveIntensity=.12}else{mat.color.copy(e.mesh.userData.atlasBaseColor);mat.emissive.set('#000000');mat.emissiveIntensity=0}
 }
 updateSelectionControls();updateAnnotationControls();refreshFocusInterface();$('btn-isolate').disabled=!state.selectedEntries.length;$('btn-ghost').disabled=!state.selectedEntries.length;$('btn-isolate').classList.toggle('active',state.isolated);$('btn-ghost').classList.toggle('active',state.ghost);
 $('btn-isolate').innerHTML=state.isolated?'<span>◎</span> Mostrar región':'<span>◎</span> Aislar estructuras';$('btn-ghost').innerHTML=state.ghost?'<span>◌</span> Vista normal':'<span>◌</span> Transparencia';
}
// Anatomical arrows remain attached to local mesh coordinates as the camera moves.
// A suggestion is only a NAME; its anatomical location must be explicitly marked.
function modelFileKey(file){
 return [String(file.name).slice(0,95),file.size,file.lastModified].join(':');
}
function activeAnnotationKey(){
 return state.detailActive?state.detailSourceKey:state.baseSourceKey;
}
function readStoredAnnotations(){
 try{return normalizeLandmarkCollection(JSON.parse(localStorage.getItem(landmarkStorageKey(activeAnnotationKey()))||'[]'))}
 catch(error){console.warn('Marcadores anatómicos no disponibles:',error);return []}
}
function saveAnnotations(){
 try{localStorage.setItem(landmarkStorageKey(activeAnnotationKey()),JSON.stringify(state.annotations))}
 catch(error){$('annotation-status').textContent='Los marcadores funcionan en esta sesión, pero el navegador no permitió guardarlos.';console.warn(error)}
}
function canAnnotateBone(){
 return state.loaded&&state.region==='skull'&&state.isolated&&state.selectedEntries.length===1&&Boolean(skullBoneId(state.selected?.name||''));
}
function updateAnnotationControls(){
 const section=$('annotation-panel');
 section.hidden=state.region!=='skull'||!state.loaded;
 $('annotation-disclosure').hidden=section.hidden;
 if(section.hidden){state.placingAnnotation=false;renderLandmarkOverlay();return}
 const selected=state.selectedEntries.length===1?state.selectedEntries[0]:null;
 const suggestions=$('annotation-suggestions'),identifier=selected?.name||'';
 if(suggestions.dataset.bone!==identifier){
  suggestions.dataset.bone=identifier;suggestions.replaceChildren();
  for(const name of landmarkSuggestions(identifier)){
   const option=document.createElement('option');option.value=name;suggestions.appendChild(option);
  }
  $('annotation-name').value='';$('annotation-description').value='';
 }
 const ready=canAnnotateBone();
 if(!ready)state.placingAnnotation=false;
 $('annotation-start').disabled=!ready;
 $('annotation-start').textContent=state.placingAnnotation?'Esperando clic en el 3D…':'Añadir flecha al hueso';
 $('annotation-start').setAttribute('aria-pressed',String(state.placingAnnotation));
 $('annotation-cancel').hidden=!state.placingAnnotation;
 $('annotation-instructions').textContent=ready?
  'Elige un nombre y pulsa «Añadir flecha». Después, señala el detalle en la superficie del hueso 3D. Las flechas giran con el modelo.':
  'Selecciona un hueso del cráneo y pulsa «Aislar estructuras» para añadir o consultar flechas.';
 renderLandmarkOverlay();
}
function removeLandmark(id){
 state.annotations=state.annotations.filter(item=>item.id!==id);
 saveAnnotations();renderLandmarkOverlay();
 $('annotation-status').textContent='Flecha eliminada.';
}
function placeLandmark(hit,entry){
 const label=validLandmarkLabel($('annotation-name').value);
 if(!label){state.placingAnnotation=false;updateAnnotationControls();return}
 const local=entry.mesh.worldToLocal(hit.point.clone());
 const existing=state.annotations.find(item=>item.meshId===entry.id&&item.boneName===entry.name&&item.label.toLocaleLowerCase('es')===label.toLocaleLowerCase('es'));
 const note=$('annotation-description').value.trim().replace(/\s+/g,' ').slice(0,350);
 const marker={id:existing?.id||('lm-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)),
  label,boneName:entry.name,meshId:entry.id,point:[local.x,local.y,local.z],...(note?{note}:{})};
 if(existing)state.annotations=state.annotations.filter(item=>item.id!==existing.id);
 if(!existing&&state.annotations.length>=40){
  $('annotation-status').textContent='Máximo 40 flechas por modelo; elimina alguna antes de añadir otra.';
  state.placingAnnotation=false;updateAnnotationControls();return;
 }
 state.annotations.push(marker);saveAnnotations();
 state.placingAnnotation=false;updateAnnotationControls();
 $('annotation-status').textContent='Flecha guardada para «'+label+'». Ubicación indicada por el usuario; pendiente de revisión anatómica.';
}
function renderLandmarkOverlay(){
 const labels=$('annotation-labels'),arrows=$('annotation-arrow-items'),items=$('annotation-list');
 labels.replaceChildren();arrows.replaceChildren();items.replaceChildren();
 state.annotationRendered=[];
 $('annotation-count').textContent='0 flechas';
 if(!canAnnotateBone())return;
 const selected=state.selectedEntries[0];
 const annotations=landmarksForBone(state.annotations,selected);
 $('annotation-count').textContent=annotations.length+' flechas en este hueso';
 if(!annotations.length){
  const text=document.createElement('p');text.className='annotation-empty';
  text.textContent='Todavía no hay detalles marcados en este hueso.';items.appendChild(text);
  return;
 }
 for(const [i,marker] of annotations.entries()){
  const svgNS='http://www.w3.org/2000/svg';
  const line=document.createElementNS(svgNS,'line');line.setAttribute('class','annotation-arrow');
  line.setAttribute('marker-end','url(#annotation-arrowhead)');
  const dot=document.createElementNS(svgNS,'circle');dot.setAttribute('class','annotation-dot');dot.setAttribute('r','3.5');
  arrows.append(line,dot);
  const bubble=document.createElement('div');bubble.className='annotation-bubble';
  const index=document.createElement('span');index.className='annotation-index';index.textContent=String(i+1).padStart(2,'0');
  const title=document.createElement('span');title.textContent=marker.label;
  bubble.append(index,title);labels.appendChild(bubble);
  const item=document.createElement('div');item.className='annotation-item';
  const details=document.createElement('div');details.className='annotation-item-details';
  const name=document.createElement('span');name.textContent=(i+1)+'. '+marker.label;
  details.appendChild(name);
  if(marker.note){const note=document.createElement('p');note.textContent=marker.note;details.appendChild(note)}
  const remove=document.createElement('button');remove.type='button';remove.textContent='Quitar';
  remove.setAttribute('aria-label','Eliminar flecha: '+marker.label);
  remove.addEventListener('click',()=>removeLandmark(marker.id));
  item.append(details,remove);items.appendChild(item);
  state.annotationRendered.push({marker,mesh:selected.mesh,local:new THREE.Vector3(...marker.point),line,dot,bubble,index:i});
 }
}
function updateAnnotationScreen(){
 const markers=state.annotationRendered;
 if(!markers?.length||!canAnnotateBone())return;
 state.camera.updateMatrixWorld();
 const viewport=$('viewport'),w=viewport.clientWidth,h=viewport.clientHeight;
 if(!w||!h)return;
 state.root.updateMatrixWorld(true);
 for(const {mesh,local,line,dot,bubble,index} of markers){
  const p=mesh.localToWorld(local.clone()).project(state.camera);
  const visible=p.z>=-1&&p.z<=1&&Math.abs(p.x)<.985&&Math.abs(p.y)<.985;
  bubble.hidden=!visible;line.style.display=visible?'':'none';dot.style.display=visible?'':'none';
  if(!visible)continue;
  const x=(p.x+1)*w/2,y=(1-p.y)*h/2;
  const right=x>w*.56;
  const bx=Math.max(6,Math.min(w-190,x+(right?-204:28)));
  const by=Math.max(6,Math.min(h-42,y-48-(index%3)*39));
  bubble.style.transform='translate('+Math.round(bx)+'px,'+Math.round(by)+'px)';
  line.setAttribute('x1',String(bx+(right?178:8)));
  line.setAttribute('y1',String(by+19));
  line.setAttribute('x2',String(x));line.setAttribute('y2',String(y));
  dot.setAttribute('cx',String(x));dot.setAttribute('cy',String(y));
 }
}

function renderBibliography(){
 const container=$('book-sources');
 container.replaceChildren();
 for(const book of PRIMARY_BIBLIOGRAPHY){
  const a=document.createElement('a');
  a.href=book.url;a.target='_blank';a.rel='noopener noreferrer';
  a.textContent=book.short+' ↗';a.title=book.display;
  container.appendChild(a);
 }
}
function refreshInfo(){
 const e=state.selected;
 if(state.selectedEntries.length===2){
  const [left,right]=state.selectedEntries;
  $('info-type').textContent='COMPARACIÓN ANATÓMICA · BORRADOR';
  $('info-title').textContent=left.info.name+' + '+right.info.name;
  $('info-latin').textContent=left.info.latin+' · '+right.info.latin;
  $('info-desc').textContent='Dos estructuras seleccionadas para estudiar sus relaciones. Utiliza «Aislar estructuras» o «Transparencia» para examinarlas juntas. Sus fichas individuales siguen pendientes de revisión.';
  $('info-location').textContent=left.info.location+' / '+right.info.location;
  $('info-function').textContent='Selecciona cada hueso individualmente para revisar su función específica.';
  $('clinical-section').hidden=true;$('sources').hidden=true;
  $('info-icon').textContent='◇◇';$('selected-index').textContent='02 / '+state.entries.length;
  $('book-review-note').textContent='Comparación preliminar: pendiente de cotejo con Moore y Rouvière.';
  return;
 }
 if(!e){
 $('info-type').textContent=state.region==='skull'?'CRÁNEO':'SISTEMA ÓSEO';$('info-title').innerHTML=state.region==='skull'?'22 huesos del<br>cráneo.':'Explora cada<br>estructura.';$('info-latin').textContent=state.region==='skull'?'Neurocranium · Viscerocranium':'Anatomia ossium';$('info-desc').textContent=state.region==='skull'?'El cráneo adulto se organiza en 8 huesos del neurocráneo y 14 del viscerocráneo, sin contar los huesecillos del oído. Haz clic en un hueso para explorar su anatomía.':'Selecciona un hueso desde el modelo 3D o desde la lista de la izquierda para ver sus características anatómicas.';
 $('info-location').textContent='Explora las regiones del esqueleto y utiliza los controles 3D para girar el modelo.';$('info-function').textContent='Sostén, protección de órganos, movimiento, reserva mineral y hematopoyesis.';$('clinical-section').hidden=true;$('sources').hidden=true;$('info-icon').textContent='◈';$('selected-index').textContent='00 / '+state.entries.length;return}
 const info=e.info;$('info-type').textContent=info.verified?info.category.toUpperCase():`${info.category.toUpperCase()} · BORRADOR`;$('info-title').textContent=info.name;$('info-latin').textContent=info.latin;$('info-desc').textContent=info.description;$('info-location').textContent=info.location;$('info-function').textContent=info.function;
 $('clinical-section').hidden=!info.clinical;$('info-clinical').textContent=info.clinical||'';$('info-icon').textContent='◇';$('selected-index').textContent=String(e.id+1).padStart(2,'0')+' / '+state.entries.length;
 const src=$('sources');src.replaceChildren();
 const cited=(info.verified&&Array.isArray(info.sourceRefs))?info.sourceRefs:[];
 src.hidden=cited.length===0;
 cited.forEach((item,i)=>{const label=document.createElement('span');label.textContent=`Cita verificada ${i+1}: ${item.book_id}, ${item.chapter}, p. ${item.page}`;src.appendChild(label)});
 $('book-review-note').textContent=info.verified?'Contenido cotejado con bibliografía primaria.':'Borrador informativo: pendiente de cotejo con Moore y Rouvière. No se atribuyen páginas aún.';
}
function pick(e,extendFromPointerDown=false){
 if(!state.loaded)return;
 const rect=$('scene').getBoundingClientRect();
 mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
 raycaster.setFromCamera(mouse,state.camera);
 if(state.placingAnnotation){
  const selected=state.selectedEntries[0];
  if(!selected||!canAnnotateBone()){state.placingAnnotation=false;updateAnnotationControls();return}
  const hit=raycaster.intersectObject(selected.mesh,false)[0];
  if(!hit){$('annotation-status').textContent='Haz clic directamente sobre la superficie del hueso aislado.';return}
  placeLandmark(hit,selected);return;
 }
 const allowed=state.entries.filter(x=>x.mesh.visible&&x.mesh.material.opacity>.25).map(x=>x.mesh);
 const hit=raycaster.intersectObjects(allowed,false)[0];if(!hit)return;
 const entry=state.entries.find(x=>x.mesh===hit.object);
 if(entry)selectBone(entry,false,extendFromPointerDown||wantsExtendedSelection(e,state.multiSelectMode));
}
function setCameraView(mode){if(!state.loaded)return;const t=state.controls.target.clone();const distance=Math.max(state.camera.position.distanceTo(t),.25);const v={front:[0,0,1],back:[0,0,-1],side:[1,0,0],top:[0,1,0]};const d=new THREE.Vector3(...(v[mode]||v.front)).normalize();state.camera.position.copy(t).addScaledVector(d,distance);state.camera.up.set(0,1,0);if(mode==='top')state.camera.up.set(0,0,-1);state.controls.update()}
function bindUI(){
 $('bubble-regions').addEventListener('click',()=>openStudyNavigation('regions-section'));
 $('bubble-search').addEventListener('click',()=>openStudyNavigation('structures-section',true));
 $('bubble-select').addEventListener('click',()=>openStudyNavigation('structures-section'));
 $('bubble-info').addEventListener('click',()=>openStudyDetails());
 $('study-open-info').addEventListener('click',()=>openStudyDetails());
 $('bubble-isolate').addEventListener('click',()=>$('btn-isolate').click());
 $('bubble-annotations').addEventListener('click',()=>openStudyDetails('annotation-disclosure'));
 $('bubble-settings').addEventListener('click',()=>openStudyDetails('visual-options'));
 $('btn-focus-mode').addEventListener('click',()=>setStudyFocus(!study.active));
 $('focus-leave').addEventListener('click',()=>setStudyFocus(false));
 $('focus-nav').addEventListener('click',()=>toggleStudyPanel('navigation'));
 $('focus-info').addEventListener('click',()=>toggleStudyPanel('details'));
 $('focus-close-nav').addEventListener('click',()=>toggleStudyPanel('navigation'));
 $('focus-close-info').addEventListener('click',()=>toggleStudyPanel('details'));
 $('focus-show-region').addEventListener('click',showRegionFromFocus);
 $('auto-focus-isolate').addEventListener('change',event=>{
  study.autoFocusOnIsolate=event.target.checked;
  saveStudyPreferences(localStorage,{autoFocusOnIsolate:study.autoFocusOnIsolate});
 });
 $('show-all').addEventListener('click',()=>selectRegion('body'));
 $('clear-focus').addEventListener('click',()=>selectRegion('body'));
 $('search').addEventListener('input',e=>{state.search=e.target.value;renderList()});
 document.querySelectorAll('.filter').forEach(b=>b.addEventListener('click',()=>{state.filter=b.dataset.filter;if(state.filter!=='all'){state.selectedEntries=state.selectedEntries.filter(item=>item.division===state.filter);state.selected=state.selectedEntries.at(-1)||null;if(!state.selectedEntries.length){state.isolated=false;state.ghost=false}}refreshInfo();document.querySelectorAll('.filter').forEach(a=>a.classList.toggle('active',a===b));renderList();updateVisibility();if(state.region==='skull'){const es=getRegionEntries().filter(e=>state.filter==='all'||e.division===state.filter);if(es.length)focusObjects(es.map(e=>e.mesh))}}));
 $('btn-reset').addEventListener('click',()=>{selectRegion('body');resetView()});$('btn-center').addEventListener('click',()=>{state.selectedEntries.length?focusObjects(selectedMeshes()):focusRegion()});
 document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setCameraView(b.dataset.view)));
 $('btn-isolate').addEventListener('click',()=>{
  if(!state.selectedEntries.length)return;
  state.isolated=!state.isolated;
  if(state.isolated){
   state.ghost=false;
   if(study.autoFocusOnIsolate&&!study.active)setStudyFocus(true,true);
  }else{
   state.placingAnnotation=false;
   exitAutoFocus();
  }
  updateVisibility();
  if(state.isolated)focusObjects(selectedMeshes());
 });
 $('btn-ghost').addEventListener('click',()=>{
  if(!state.selectedEntries.length)return;
  state.ghost=!state.ghost;
  if(state.ghost){state.isolated=false;exitAutoFocus()}
  updateVisibility();
 });
 $('btn-multi-select').addEventListener('click',()=>{state.multiSelectMode=!state.multiSelectMode;updateSelectionControls()});
 $('btn-pair').addEventListener('click',selectOppositeBone);
 $('btn-clear-selection').addEventListener('click',()=>{clearSelection();updateVisibility();refreshInfo();renderList()});
 $('opacity').addEventListener('input',e=>{state.opacity=Number(e.target.value)/100;$('opacity-value').textContent=e.target.value+'%';updateVisibility()});
 $('quality-mode').addEventListener('change',e=>{state.quality=normalizeRenderQuality(e.target.value);updateDisplaySettings(true)});
 $('light-level').addEventListener('input',e=>{state.lightLevel=normalizeLightLevel(e.target.value);updateDisplaySettings(true)});
 $('reset-render').addEventListener('click',()=>{
  state.quality=DEFAULT_RENDER_SETTINGS.quality;
  state.lightLevel=DEFAULT_RENDER_SETTINGS.light;
  updateDisplaySettings(true);
 });
 $('annotation-start').addEventListener('click',()=>{
  if(!canAnnotateBone())return;
  const label=validLandmarkLabel($('annotation-name').value);
  if(!label){$('annotation-status').textContent='Primero escribe o elige un detalle anatómico de al menos 3 caracteres.';return}
  state.placingAnnotation=!state.placingAnnotation;
  $('annotation-status').textContent=state.placingAnnotation
   ?'Ahora haz clic sobre el lugar exacto del detalle en el hueso 3D. Escape cancela.'
   :'Marcación cancelada.';
  updateAnnotationControls();
 });
 $('annotation-cancel').addEventListener('click',()=>{
  state.placingAnnotation=false;updateAnnotationControls();$('annotation-status').textContent='Marcación cancelada.';
 });
 $('skull-detail-upload').addEventListener('click',()=>$('skull-detail-file').click());
 $('skull-detail-switch').addEventListener('click',()=>{
  if(!state.baseScene||!state.detailScene)return;
  if(state.detailActive){state.detailActive=false;acceptModel(state.baseScene);selectRegion('skull')}
  else{state.detailActive=true;acceptModel(state.detailScene,'skull')}
 });
 $('skull-detail-file').addEventListener('change',async event=>{
  const file=event.target.files?.[0];
  if(!file)return;
  const status=$('skull-detail-status');
  if(!/\.glb$/i.test(file.name)){status.textContent='El archivo debe tener formato GLB (binario).';event.target.value='';return}
  status.textContent='Leyendo cráneo segmentado…';
  const url=URL.createObjectURL(file);
  try{
   const gltf=await loadGLB(url);
   const summary=readSkullScene(gltf.scene);
   if(!canUseDetailedSkull(summary))throw new Error('Necesita al menos 2 tipos de huesos del cráneo identificables y geometría triangular.');
   state.detailScene=gltf.scene;state.detailStats=summary;state.detailName=file.name;state.detailSourceKey='skull:'+modelFileKey(file);
   state.detailActive=true;acceptModel(gltf.scene,'skull');
   status.textContent='Cráneo de detalle cargado. Revisa la cobertura y la correspondencia anatómica antes de utilizarlo para estudiar.';
  }catch(err){status.textContent='No se pudo incorporar el cráneo: '+err.message;console.warn('Cráneo de detalle no admitido:',err)}
  finally{URL.revokeObjectURL(url);event.target.value=''}
 });
 $('retry-model').addEventListener('click',loadDefault);
 const dialog=$('help-dialog');$('btn-help').addEventListener('click',()=>dialog.hidden=false);$('close-help').addEventListener('click',()=>dialog.hidden=true);$('help-understood').addEventListener('click',()=>dialog.hidden=true);dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.hidden=true});
 $('btn-upload').addEventListener('click',()=>$('model-file').click());$('model-file').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;const url=URL.createObjectURL(file);$('loading-overlay').hidden=false;$('loading-title').textContent='Importando modelo local…';$('loading-message').textContent=file.name;$('retry-model').hidden=true;try{const gltf=await loadGLB(url);state.baseScene=gltf.scene;state.baseSourceKey='skeleton:'+modelFileKey(file);state.detailScene=null;state.detailStats=null;state.detailName='';state.detailActive=false;acceptModel(gltf.scene);$('loading-overlay').hidden=true}catch(err){$('loading-title').textContent='No se pudo abrir el archivo';$('loading-message').textContent='Comprueba que sea un GLB válido con mallas individuales (y no un archivo de texto).';$('retry-model').hidden=false;updateStatus('Error de importación',true);console.error(err)}finally{URL.revokeObjectURL(url);e.target.value=''}})
}
function main(){restoreDisplayPreferences();restoreStudyPreferences();updateDisplaySettings();renderBibliography();bindUI();setStudyFocus(true);renderRegions();renderList();try{initThree();loadDefault()}catch(err){console.error(err);$('loading-title').textContent='WebGL no disponible';$('loading-message').textContent='Activa la aceleración gráfica del navegador y recarga la página.';$('retry-model').hidden=true;updateStatus('Error de visor',true)}}
main();
