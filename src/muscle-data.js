/**
 * Atlas — etapa 2, catálogo inicial de etiquetas para mallas musculares.
 * Las fichas OINA son marcadores de revisión, NO datos verificados.
 * La clasificación solo reconoce nombres explícitos; no inventa músculos
 * a partir de la forma tridimensional.
 */
export const MUSCLE_REGIONS=Object.freeze([
 {id:'all',label:'Todos los músculos'},
 {id:'head',label:'Cabeza y cara'},
 {id:'neck',label:'Cuello'},
 {id:'chest',label:'Tórax'},
 {id:'back',label:'Espalda'},
 {id:'abdomen',label:'Abdomen'},
 {id:'upper',label:'Miembro superior'},
 {id:'pelvis',label:'Pelvis y cadera'},
 {id:'lower',label:'Miembro inferior'}
]);

export const MUSCLE_CATALOG=Object.freeze([
 ['temporalis','Temporal','head'],['masseter','Masetero','head'],['orbicularis oculi','Orbicular del ojo','head'],
 ['sternocleidomastoid','Esternocleidomastoideo','neck'],['scalene','Escaleno','neck'],
 ['pectoralis major','Pectoral mayor','chest'],['pectoralis minor','Pectoral menor','chest'],['serratus anterior','Serrato anterior','chest'],
 ['trapezius','Trapecio','back'],['latissimus dorsi','Dorsal ancho','back'],['rhomboid major','Romboides mayor','back'],['erector spinae','Erector de la columna','back'],
 ['rectus abdominis','Recto del abdomen','abdomen'],['external oblique','Oblicuo externo','abdomen'],['internal oblique','Oblicuo interno','abdomen'],
 ['deltoid','Deltoides','upper'],['biceps brachii','Bíceps braquial','upper'],['triceps brachii','Tríceps braquial','upper'],
 ['brachialis','Braquial','upper'],['brachioradialis','Braquiorradial','upper'],['supraspinatus','Supraespinoso','upper'],
 ['infraspinatus','Infraespinoso','upper'],['subscapularis','Subescapular','upper'],
 ['gluteus maximus','Glúteo mayor','pelvis'],['gluteus medius','Glúteo medio','pelvis'],['iliopsoas','Iliopsoas','pelvis'],
 ['rectus femoris','Recto femoral','lower'],['vastus medialis','Vasto medial','lower'],['vastus lateralis','Vasto lateral','lower'],
 ['sartorius','Sartorio','lower'],['biceps femoris','Bíceps femoral','lower'],['semitendinosus','Semitendinoso','lower'],
 ['semimembranosus','Semimembranoso','lower'],['gastrocnemius','Gastrocnemio','lower'],['soleus','Sóleo','lower'],
 ['tibialis anterior','Tibial anterior','lower'],['fibularis longus','Fibular largo','lower']
].map(([key,name,region])=>Object.freeze({key,name,region})));

export function cleanMuscleName(input=''){
 return String(input).trim()
  .replace(/\.\d{3}$/,'')
  .replace(/^(?:left|right)\s+/i,'')
  .replace(/(?:[._-](?:l|r|left|right)|\s+(?:left|right)|\s*\((?:l|r)\))$/i,'')
  .replace(/[_-]+/g,' ').trim();
}
export function muscleSide(input=''){
 const text=String(input).trim().replace(/\.\d{3}$/,'');
 if(/^(?:left)\s+/i.test(text)||/(?:[._-](?:l|left)|\s+left|\(l\))$/i.test(text))return 'left';
 if(/^(?:right)\s+/i.test(text)||/(?:[._-](?:r|right)|\s+right|\(r\))$/i.test(text))return 'right';
 return null;
}
export function identifyMuscle(input=''){
 const raw=cleanMuscleName(input).toLowerCase();
 const match=MUSCLE_CATALOG.find(m=>raw===m.key);
 if(!match)return null;
 const side=muscleSide(input);
 const suffix=side==='left'?' izquierdo':side==='right'?' derecho':'';
 return {...match,side,displayName:match.name+suffix};
}
export function auditMuscleMeshList(meshes=[]){
 let totalMeshes=0,recognizedMeshes=0,triangles=0;
 const types=new Set();
 const entries=[];
 for(const mesh of meshes){
  if(mesh?.isMesh!==true)continue;
  totalMeshes++;
  const muscle=identifyMuscle(mesh.name);
  if(!muscle)continue;
  recognizedMeshes++;types.add(muscle.key);
  const count=mesh.geometry?.index?.count??mesh.geometry?.attributes?.position?.count??0;
  triangles+=Number.isFinite(count)&&count>0?Math.floor(count/3):0;
  entries.push({...muscle,meshName:mesh.name});
 }
 return {
  totalMeshes,recognizedMeshes,
  unclassifiedMeshes:totalMeshes-recognizedMeshes,
  recognizedTypes:types.size,triangles,entries,
  acceptable:types.size>=2&&triangles>0
 };
}
export function muscleDraft(info){
 return {
  name:info.displayName,
  region:MUSCLE_REGIONS.find(x=>x.id===info.region)?.label||'Sin región',
  origin:'Pendiente de verificación con Moore y Rouvière',
  insertion:'Pendiente de verificación con Moore y Rouvière',
  innervation:'Pendiente de verificación con Moore y Rouvière',
  action:'Pendiente de verificación con Moore y Rouvière',
  verified:false
 };
}
