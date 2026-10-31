/** ATLAS laboratorio 04 · modelo abierto de vasos. Fuente: OrganUI vessels-3d
 * BodyParts3D / Anatomography 4.3 © DBCLS, CC BY-SA 2.1 Japón.
 * Cada registro corresponde a un grupo visible del GLB, NO necesariamente un único
 * vaso ni ambos lados bien segmentados. La nomenclatura requiere revisión editorial.
 * Las relaciones son índices didácticos entre grupos, NO una simulación hemodinámica.
 */
export const VASCULAR_SOURCE=Object.freeze({
 url:'https://cdn.jsdelivr.net/gh/organui/vessels-3d@74be339badd85f1d3d93e585ed2a5a79c7679342/public/models/vessels.glb',
 repository:'https://github.com/organui/vessels-3d',
 attribution:'https://github.com/organui/vessels-3d/blob/74be339badd85f1d3d93e585ed2a5a79c7679342/public/models/ATTRIBUTION.md',
 license:'CC BY-SA 2.1 Japón',
 licenseUrl:'https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en',
 source:'BodyParts3D / Anatomography 4.3 © DBCLS, adaptación OrganUI',
 commit:'74be339badd85f1d3d93e585ed2a5a79c7679342',
 size:2419320,
 sha256:'d2dd99113eda9ccf39d8a9bff7d6c9d07252867cabdcaf7bc1c3454a2883701d'
});
export const VASCULAR_REGIONS=Object.freeze([
 {id:'all',name:'Todo el cuerpo'},
 {id:'head',name:'Cabeza y cuello'},
 {id:'chest',name:'Tórax'},
 {id:'upper',name:'Miembros superiores'},
 {id:'abdomen',name:'Abdomen'},
 {id:'pelvis',name:'Pelvis'},
 {id:'lower',name:'Miembros inferiores'}
]);
export const VASCULAR_STRUCTURES=Object.freeze([
 {
  "id": "carotid-arteries",
  "name": "Arterias carótidas",
  "originalName": "common, internal and external carotid arteries",
  "fma": "FMA69325",
  "region": "head",
  "kind": "artery",
  "sourceElements": 5,
  "paired": true
 },
 {
  "id": "vertebral-arteries",
  "name": "Arterias vertebrales",
  "originalName": "right and left vertebral arteries",
  "fma": "FMA76260",
  "region": "head",
  "kind": "artery",
  "sourceElements": 2,
  "paired": true
 },
 {
  "id": "jugular-veins",
  "name": "Venas yugulares",
  "originalName": "internal jugular veins and right external jugular vein",
  "fma": "FMA50818",
  "region": "head",
  "kind": "vein",
  "sourceElements": 3,
  "paired": true
 },
 {
  "id": "ascending-aorta",
  "name": "Aorta ascendente",
  "originalName": "ascending aorta",
  "fma": "FMA3736",
  "region": "chest",
  "kind": "artery",
  "sourceElements": 1,
  "paired": false
 },
 {
  "id": "aortic-arch",
  "name": "Arco de la aorta",
  "originalName": "arch of aorta",
  "fma": "FMA3768",
  "region": "chest",
  "kind": "artery",
  "sourceElements": 1,
  "paired": false
 },
 {
  "id": "thoracic-aorta",
  "name": "Aorta torácica",
  "originalName": "descending aorta, above the coeliac trunk",
  "fma": "FMA87217",
  "region": "chest",
  "kind": "artery",
  "sourceElements": 1,
  "paired": false
 },
 {
  "id": "brachiocephalic-trunk",
  "name": "Tronco braquiocefálico",
  "originalName": "trunk of brachiocephalic artery",
  "fma": "FMA69316",
  "region": "chest",
  "kind": "artery",
  "sourceElements": 1,
  "paired": false
 },
 {
  "id": "internal-thoracic-arteries",
  "name": "Arterias torácicas internas",
  "originalName": "right and left internal thoracic arteries",
  "fma": "FMA76302",
  "region": "chest",
  "kind": "artery",
  "sourceElements": 2,
  "paired": true
 },
 {
  "id": "pulmonary-trunk",
  "name": "Tronco pulmonar",
  "originalName": "pulmonary trunk",
  "fma": "FMA8612",
  "region": "chest",
  "kind": "artery",
  "sourceElements": 1,
  "paired": false
 },
 {
  "id": "pulmonary-arteries",
  "name": "Arterias pulmonares",
  "originalName": "trunks of right and left pulmonary arteries",
  "fma": "FMA8615",
  "region": "chest",
  "kind": "artery",
  "sourceElements": 2,
  "paired": true
 },
 {
  "id": "pulmonary-veins",
  "name": "Venas pulmonares",
  "originalName": "trunks of the four pulmonary veins",
  "fma": "FMA8648",
  "region": "chest",
  "kind": "vein",
  "sourceElements": 7,
  "paired": true
 },
 {
  "id": "superior-vena-cava",
  "name": "Vena cava superior",
  "originalName": "superior vena cava",
  "fma": "FMA4720",
  "region": "chest",
  "kind": "vein",
  "sourceElements": 1,
  "paired": false
 },
 {
  "id": "brachiocephalic-veins",
  "name": "Venas braquiocefálicas",
  "originalName": "right and left brachiocephalic veins",
  "fma": "FMA66647",
  "region": "chest",
  "kind": "vein",
  "sourceElements": 2,
  "paired": true
 },
 {
  "id": "azygos-system",
  "name": "Sistema ácigos",
  "originalName": "azygos, hemiazygos and accessory hemiazygos veins",
  "fma": "FMA4838",
  "region": "chest",
  "kind": "vein",
  "sourceElements": 3,
  "paired": true
 },
 {
  "id": "subclavian-arteries",
  "name": "Arterias subclavias",
  "originalName": "trunks of right and left subclavian arteries",
  "fma": "FMA69317",
  "region": "upper",
  "kind": "artery",
  "sourceElements": 2,
  "paired": true
 },
 {
  "id": "axillary-arteries",
  "name": "Arterias axilares",
  "originalName": "right and left axillary arteries",
  "fma": "FMA22654",
  "region": "upper",
  "kind": "artery",
  "sourceElements": 2,
  "paired": true
 },
 {
  "id": "brachial-arteries",
  "name": "Arterias braquiales",
  "originalName": "right and left brachial arteries",
  "fma": "FMA22689",
  "region": "upper",
  "kind": "artery",
  "sourceElements": 2,
  "paired": true
 },
 {
  "id": "radial-arteries",
  "name": "Arterias radiales",
  "originalName": "trunks of right and left radial arteries",
  "fma": "FMA66621",
  "region": "upper",
  "kind": "artery",
  "sourceElements": 2,
  "paired": true
 },
 {
  "id": "ulnar-arteries",
  "name": "Arterias cubitales",
  "originalName": "trunks of right and left ulnar arteries",
  "fma": "FMA66622",
  "region": "upper",
  "kind": "artery",
  "sourceElements": 2,
  "paired": true
 },
 {
  "id": "palmar-arches",
  "name": "Arcos palmares profundos",
  "originalName": "right and left deep palmar arches",
  "fma": "FMA22838",
  "region": "upper",
  "kind": "artery",
  "sourceElements": 2,
  "paired": true
 },
 {
  "id": "subclavian-veins",
  "name": "Venas subclavias",
  "originalName": "right and left subclavian veins",
  "fma": "FMA4725",
  "region": "upper",
  "kind": "vein",
  "sourceElements": 2,
  "paired": true
 },
 {
  "id": "axillary-veins",
  "name": "Venas axilares",
  "originalName": "right and left axillary veins",
  "fma": "FMA13329",
  "region": "upper",
  "kind": "vein",
  "sourceElements": 2,
  "paired": true
 },
 {
  "id": "cephalic-veins",
  "name": "Venas cefálicas",
  "originalName": "right and left cephalic veins",
  "fma": "FMA13324",
  "region": "upper",
  "kind": "vein",
  "sourceElements": 2,
  "paired": true
 },
 {
  "id": "basilic-veins",
  "name": "Venas basílicas",
  "originalName": "right and left basilic veins",
  "fma": "FMA22908",
  "region": "upper",
  "kind": "vein",
  "sourceElements": 2,
  "paired": true
 },
 {
  "id": "abdominal-aorta",
  "name": "Aorta abdominal",
  "originalName": "descending aorta, from the coeliac trunk down",
  "fma": "FMA3789",
  "region": "abdomen",
  "kind": "artery",
  "sourceElements": 1,
  "paired": false
 },
 {
  "id": "celiac-trunk",
  "name": "Tronco celíaco",
  "originalName": "celiac trunk",
  "fma": "FMA14812",
  "region": "abdomen",
  "kind": "artery",
  "sourceElements": 1,
  "paired": false
 },
 {
  "id": "hepatic-artery",
  "name": "Arteria hepática",
  "originalName": "trunks of common hepatic artery and hepatic artery proper",
  "fma": "FMA14767",
  "region": "abdomen",
  "kind": "artery",
  "sourceElements": 2,
  "paired": false
 },
 {
  "id": "splenic-artery",
  "name": "Arteria esplénica",
  "originalName": "splenic artery",
  "fma": "FMA14773",
  "region": "abdomen",
  "kind": "artery",
  "sourceElements": 3,
  "paired": false
 },
 {
  "id": "superior-mesenteric-artery",
  "name": "Arteria mesentérica superior",
  "originalName": "trunk of superior mesenteric artery",
  "fma": "FMA66358",
  "region": "abdomen",
  "kind": "artery",
  "sourceElements": 1,
  "paired": false
 },
 {
  "id": "inferior-mesenteric-artery",
  "name": "Arteria mesentérica inferior",
  "originalName": "trunk of inferior mesenteric artery",
  "fma": "FMA66359",
  "region": "abdomen",
  "kind": "artery",
  "sourceElements": 1,
  "paired": false
 },
 {
  "id": "renal-arteries",
  "name": "Arterias renales",
  "originalName": "trunks and anterior and posterior divisions of right and left renal arteries",
  "fma": "FMA66363",
  "region": "abdomen",
  "kind": "artery",
  "sourceElements": 20,
  "paired": true
 },
 {
  "id": "inferior-vena-cava",
  "name": "Vena cava inferior",
  "originalName": "inferior vena cava",
  "fma": "FMA10951",
  "region": "abdomen",
  "kind": "vein",
  "sourceElements": 2,
  "paired": false
 },
 {
  "id": "renal-veins",
  "name": "Venas renales",
  "originalName": "right and left renal veins",
  "fma": "FMA14334",
  "region": "abdomen",
  "kind": "vein",
  "sourceElements": 4,
  "paired": true
 },
 {
  "id": "portal-vein",
  "name": "Vena porta hepática",
  "originalName": "pre-hepatic portal vein and trunks of right and left portal veins",
  "fma": "FMA71904",
  "region": "abdomen",
  "kind": "vein",
  "sourceElements": 3,
  "paired": true
 },
 {
  "id": "splenic-mesenteric-veins",
  "name": "Venas esplénica y mesentéricas",
  "originalName": "splenic, superior mesenteric and inferior mesenteric veins",
  "fma": "FMA50736",
  "region": "abdomen",
  "kind": "vein",
  "sourceElements": 3,
  "paired": true
 },
 {
  "id": "common-iliac-arteries",
  "name": "Arterias ilíacas comunes",
  "originalName": "trunks of right and left common iliac arteries",
  "fma": "FMA69382",
  "region": "pelvis",
  "kind": "artery",
  "sourceElements": 2,
  "paired": true
 },
 {
  "id": "internal-iliac-arteries",
  "name": "Arterias ilíacas internas",
  "originalName": "right and left internal iliac arteries",
  "fma": "FMA18809",
  "region": "pelvis",
  "kind": "artery",
  "sourceElements": 2,
  "paired": true
 },
 {
  "id": "external-iliac-arteries",
  "name": "Arterias ilíacas externas",
  "originalName": "trunks proper of right and left external iliac arteries",
  "fma": "FMA69389",
  "region": "pelvis",
  "kind": "artery",
  "sourceElements": 2,
  "paired": true
 },
 {
  "id": "common-iliac-veins",
  "name": "Venas ilíacas comunes",
  "originalName": "right and left common iliac veins",
  "fma": "FMA14333",
  "region": "pelvis",
  "kind": "vein",
  "sourceElements": 2,
  "paired": true
 },
 {
  "id": "internal-iliac-veins",
  "name": "Venas ilíacas internas",
  "originalName": "right and left internal iliac veins",
  "fma": "FMA18884",
  "region": "pelvis",
  "kind": "vein",
  "sourceElements": 9,
  "paired": true
 },
 {
  "id": "external-iliac-veins",
  "name": "Venas ilíacas externas",
  "originalName": "right and left external iliac veins",
  "fma": "FMA18883",
  "region": "pelvis",
  "kind": "vein",
  "sourceElements": 2,
  "paired": true
 },
 {
  "id": "femoral-arteries",
  "name": "Arterias femorales",
  "originalName": "trunks of right and left femoral arteries",
  "fma": "FMA20730",
  "region": "lower",
  "kind": "artery",
  "sourceElements": 2,
  "paired": true
 },
 {
  "id": "deep-femoral-arteries",
  "name": "Arterias femorales profundas",
  "originalName": "right and left deep femoral arteries",
  "fma": "FMA20741",
  "region": "lower",
  "kind": "artery",
  "sourceElements": 2,
  "paired": true
 },
 {
  "id": "popliteal-arteries",
  "name": "Arterias poplíteas",
  "originalName": "right and left popliteal arteries",
  "fma": "FMA77155",
  "region": "lower",
  "kind": "artery",
  "sourceElements": 2,
  "paired": true
 },
 {
  "id": "anterior-tibial-arteries",
  "name": "Arterias tibiales anteriores",
  "originalName": "trunks of right and left anterior tibial arteries",
  "fma": "FMA66420",
  "region": "lower",
  "kind": "artery",
  "sourceElements": 2,
  "paired": true
 },
 {
  "id": "posterior-tibial-arteries",
  "name": "Arterias tibiales posteriores",
  "originalName": "trunks of right and left posterior tibial arteries",
  "fma": "FMA66421",
  "region": "lower",
  "kind": "artery",
  "sourceElements": 2,
  "paired": true
 },
 {
  "id": "fibular-arteries",
  "name": "Arterias fibulares",
  "originalName": "right and left peroneal arteries",
  "fma": "FMA43921",
  "region": "lower",
  "kind": "artery",
  "sourceElements": 2,
  "paired": true
 },
 {
  "id": "foot-arteries",
  "name": "Arterias dorsales y plantares del pie",
  "originalName": "dorsalis pedis arteries and plantar arches",
  "fma": "FMA43916",
  "region": "lower",
  "kind": "artery",
  "sourceElements": 4,
  "paired": true
 },
 {
  "id": "femoral-veins",
  "name": "Venas femorales",
  "originalName": "right and left femoral veins",
  "fma": "FMA21185",
  "region": "lower",
  "kind": "vein",
  "sourceElements": 2,
  "paired": true
 },
 {
  "id": "popliteal-veins",
  "name": "Venas poplíteas",
  "originalName": "right and left popliteal veins",
  "fma": "FMA44327",
  "region": "lower",
  "kind": "vein",
  "sourceElements": 2,
  "paired": true
 },
 {
  "id": "great-saphenous-veins",
  "name": "Venas safenas magnas",
  "originalName": "right and left great saphenous veins",
  "fma": "FMA21376",
  "region": "lower",
  "kind": "vein",
  "sourceElements": 2,
  "paired": true
 },
 {
  "id": "small-saphenous-veins",
  "name": "Venas safenas menores",
  "originalName": "right and left small saphenous veins",
  "fma": "FMA44333",
  "region": "lower",
  "kind": "vein",
  "sourceElements": 2,
  "paired": true
 }
].map(x=>Object.freeze(x)));
export const VASCULAR_BY_ID=Object.freeze(Object.fromEntries(VASCULAR_STRUCTURES.map(s=>[s.id,s])));
export const VASCULAR_RELATIONS=Object.freeze({
 "ascending-aorta": [
  "aortic-arch"
 ],
 "aortic-arch": [
  "brachiocephalic-trunk",
  "thoracic-aorta",
  "subclavian-arteries",
  "carotid-arteries"
 ],
 "thoracic-aorta": [
  "abdominal-aorta"
 ],
 "abdominal-aorta": [
  "celiac-trunk",
  "superior-mesenteric-artery",
  "renal-arteries",
  "inferior-mesenteric-artery",
  "common-iliac-arteries"
 ],
 "celiac-trunk": [
  "hepatic-artery",
  "splenic-artery"
 ],
 "common-iliac-arteries": [
  "internal-iliac-arteries",
  "external-iliac-arteries"
 ],
 "external-iliac-arteries": [
  "femoral-arteries"
 ],
 "femoral-arteries": [
  "deep-femoral-arteries",
  "popliteal-arteries"
 ],
 "popliteal-arteries": [
  "anterior-tibial-arteries",
  "posterior-tibial-arteries"
 ],
 "anterior-tibial-arteries": [
  "foot-arteries"
 ],
 "posterior-tibial-arteries": [
  "foot-arteries"
 ],
 "brachiocephalic-trunk": [
  "carotid-arteries",
  "subclavian-arteries"
 ],
 "subclavian-arteries": [
  "axillary-arteries",
  "vertebral-arteries",
  "internal-thoracic-arteries"
 ],
 "axillary-arteries": [
  "brachial-arteries"
 ],
 "brachial-arteries": [
  "radial-arteries",
  "ulnar-arteries"
 ],
 "radial-arteries": [
  "palmar-arches"
 ],
 "ulnar-arteries": [
  "palmar-arches"
 ],
 "popliteal-veins": [
  "femoral-veins"
 ],
 "great-saphenous-veins": [
  "femoral-veins"
 ],
 "femoral-veins": [
  "external-iliac-veins"
 ],
 "external-iliac-veins": [
  "common-iliac-veins"
 ],
 "internal-iliac-veins": [
  "common-iliac-veins"
 ],
 "common-iliac-veins": [
  "inferior-vena-cava"
 ],
 "renal-veins": [
  "inferior-vena-cava"
 ],
 "cephalic-veins": [
  "axillary-veins"
 ],
 "basilic-veins": [
  "axillary-veins"
 ],
 "axillary-veins": [
  "subclavian-veins"
 ],
 "subclavian-veins": [
  "brachiocephalic-veins"
 ],
 "jugular-veins": [
  "brachiocephalic-veins"
 ],
 "brachiocephalic-veins": [
  "superior-vena-cava"
 ],
 "splenic-mesenteric-veins": [
  "portal-vein"
 ]
});
export const VASCULAR_LIMITS=Object.freeze([
 'Las 52 estructuras son grupos de uno o más vasos; muchos pares derecho e izquierdo no se seleccionan por separado.',
 'El modelo omite corazón, microvasculatura, gran parte de las ramas finas y vasos intraparenquimatosos de los órganos.',
 'En el cuello, la carótida externa y yugular externa solo están presentes a la derecha; la yugular interna izquierda es parcial.',
 'Las superficies fueron simplificadas para la web y no se deben usar para mediciones, procedimientos ni diagnóstico.',
 'Los colores son convencionales: arterias rojas, venas azules, con excepción de las arterias pulmonares (azules) y venas pulmonares (rojas).'
]);
export function vascularColor(record){
 if(!record)return '#8a9498';
 if(record.id==='pulmonary-arteries'||record.id==='pulmonary-trunk')return '#689ab9';
 if(record.id==='pulmonary-veins')return '#c76a71';
 return record.kind==='artery'?'#c76762':'#6286b8';
}
export function vascularVisible(record,{kind='all',region='all',hiddenIds=new Set(),isolateId=null}={}){
 if(!record||hiddenIds.has(record.id))return false;
 if(isolateId!==null)return record.id===isolateId;
 return (kind==='all'||record.kind===kind)&&(region==='all'||record.region===region);
}
export function vesselNext(id){
 return (VASCULAR_RELATIONS[id]||[]).filter(k=>Boolean(VASCULAR_BY_ID[k]));
}
