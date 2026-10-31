/**
 * Atlas LAB · Etapa 03 — registro derivado del inventario publicado por OrganUI.
 *
 * Origen: BodyParts3D / Anatomography 4.3, © DBCLS. CC BY-SA 2.1 Japan.
 * Adaptación del modelo original: OrganUI; licencia del modelo NO es MIT.
 * Los nombres en español son etiquetas de navegación sin cotejo editorial final.
 * NO inferir nervios derechos ni segmentos faltantes; el GLB no los contiene.
 */
export const NERVE_SOURCE=Object.freeze({
 url:'https://cdn.jsdelivr.net/gh/organui/spinal-cord-3d@3e26f98b847fcdf5c920e62eb622174e9de7b297/public/models/spinal-cord.glb',
 repository:'https://github.com/organui/spinal-cord-3d',
 attribution:'https://github.com/organui/spinal-cord-3d/blob/3e26f98b847fcdf5c920e62eb622174e9de7b297/public/models/ATTRIBUTION.md',
 license:'CC BY-SA 2.1 Japón',
 licenseUrl:'https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en',
 source:'BodyParts3D / Anatomography 4.3 © DBCLS; adaptación OrganUI',
 commit:'3e26f98b847fcdf5c920e62eb622174e9de7b297',
 approxBytes:5104752
});
export const NERVE_GROUPS=Object.freeze([
 {id:'all',label:'Todas las estructuras'},
 {id:'central',label:'Médula y neuroeje'},
 {id:'spinal',label:'Nervios espinales disponibles'},
 {id:'plexus',label:'Plexo braquial'},
 {id:'bones',label:'Vértebras y sacro'},
 {id:'discs',label:'Discos intervertebrales'},
 {id:'vessels',label:'Arterias de referencia'}
]);
export const NERVE_REGISTRY=Object.freeze([
 {
  "id": "spinal-cord",
  "name": "Médula espinal",
  "sourceName": "neural tissue of spinal cord",
  "fma": "FMA242005",
  "group": "central",
  "side": null
 },
 {
  "id": "medulla-oblongata",
  "name": "Bulbo raquídeo",
  "sourceName": "medulla oblongata",
  "fma": "FMA62004",
  "group": "central",
  "side": null
 },
 {
  "id": "nerve-c1",
  "name": "Nervio espinal C1 izquierdo",
  "sourceName": "left first cervical nerve",
  "fma": "FMA6442",
  "group": "spinal",
  "side": "left"
 },
 {
  "id": "nerve-c2",
  "name": "Nervio espinal C2 izquierdo",
  "sourceName": "trunk of left second cervical nerve",
  "fma": "FMA7003",
  "group": "spinal",
  "side": "left"
 },
 {
  "id": "nerve-c3",
  "name": "Nervio espinal C3 izquierdo",
  "sourceName": "trunk of left third cervical nerve",
  "fma": "FMA7005",
  "group": "spinal",
  "side": "left"
 },
 {
  "id": "nerve-c4",
  "name": "Nervio espinal C4 izquierdo",
  "sourceName": "trunk of left fourth cervical nerve",
  "fma": "FMA7007",
  "group": "spinal",
  "side": "left"
 },
 {
  "id": "nerve-c5",
  "name": "Nervio espinal C5 izquierdo",
  "sourceName": "trunk of left fifth cervical nerve",
  "fma": "FMA24105",
  "group": "spinal",
  "side": "left"
 },
 {
  "id": "nerve-c6",
  "name": "Nervio espinal C6 izquierdo",
  "sourceName": "trunk of left sixth cervical nerve",
  "fma": "FMA7011",
  "group": "spinal",
  "side": "left"
 },
 {
  "id": "nerve-c7",
  "name": "Nervio espinal C7 izquierdo",
  "sourceName": "trunk of left seventh cervical nerve",
  "fma": "FMA7013",
  "group": "spinal",
  "side": "left"
 },
 {
  "id": "nerve-c8",
  "name": "Nervio espinal C8 izquierdo",
  "sourceName": "trunk of left eighth cervical nerve",
  "fma": "FMA7015",
  "group": "spinal",
  "side": "left"
 },
 {
  "id": "nerve-t1",
  "name": "Nervio espinal T1 izquierdo",
  "sourceName": "trunk of left first thoracic nerve",
  "fma": "FMA7023",
  "group": "spinal",
  "side": "left"
 },
 {
  "id": "nerve-t2",
  "name": "Nervio espinal T2 izquierdo",
  "sourceName": "trunk of left second thoracic nerve",
  "fma": "FMA7025",
  "group": "spinal",
  "side": "left"
 },
 {
  "id": "brachial-plexus",
  "name": "Plexo braquial izquierdo",
  "sourceName": "trunks and cords of left brachial nerve plexus",
  "fma": "FMA65364",
  "group": "plexus",
  "side": "left"
 },
 {
  "id": "cauda-equina",
  "name": "Cauda equina",
  "sourceName": "cauda equina",
  "fma": "FMA52590",
  "group": "central",
  "side": null
 },
 {
  "id": "vertebra-c1",
  "name": "Atlas (C1)",
  "sourceName": "atlas",
  "fma": "FMA12519",
  "group": "bones",
  "side": null
 },
 {
  "id": "vertebra-c2",
  "name": "Axis (C2)",
  "sourceName": "axis",
  "fma": "FMA12520",
  "group": "bones",
  "side": null
 },
 {
  "id": "vertebra-c3",
  "name": "Vértebra C3",
  "sourceName": "third cervical vertebra",
  "fma": "FMA12521",
  "group": "bones",
  "side": null
 },
 {
  "id": "vertebra-c4",
  "name": "Vértebra C4",
  "sourceName": "fourth cervical vertebra",
  "fma": "FMA12522",
  "group": "bones",
  "side": null
 },
 {
  "id": "vertebra-c5",
  "name": "Vértebra C5",
  "sourceName": "fifth cervical vertebra",
  "fma": "FMA12523",
  "group": "bones",
  "side": null
 },
 {
  "id": "vertebra-c6",
  "name": "Vértebra C6",
  "sourceName": "sixth cervical vertebra",
  "fma": "FMA12524",
  "group": "bones",
  "side": null
 },
 {
  "id": "vertebra-c7",
  "name": "Vértebra C7",
  "sourceName": "seventh cervical vertebra",
  "fma": "FMA12525",
  "group": "bones",
  "side": null
 },
 {
  "id": "vertebra-t1",
  "name": "Vértebra T1",
  "sourceName": "first thoracic vertebra",
  "fma": "FMA9165",
  "group": "bones",
  "side": null
 },
 {
  "id": "vertebra-t2",
  "name": "Vértebra T2",
  "sourceName": "second thoracic vertebra",
  "fma": "FMA9187",
  "group": "bones",
  "side": null
 },
 {
  "id": "vertebra-t3",
  "name": "Vértebra T3",
  "sourceName": "third thoracic vertebra",
  "fma": "FMA9209",
  "group": "bones",
  "side": null
 },
 {
  "id": "vertebra-t4",
  "name": "Vértebra T4",
  "sourceName": "fourth thoracic vertebra",
  "fma": "FMA9248",
  "group": "bones",
  "side": null
 },
 {
  "id": "vertebra-t5",
  "name": "Vértebra T5",
  "sourceName": "fifth thoracic vertebra",
  "fma": "FMA9922",
  "group": "bones",
  "side": null
 },
 {
  "id": "vertebra-t6",
  "name": "Vértebra T6",
  "sourceName": "sixth thoracic vertebra",
  "fma": "FMA9945",
  "group": "bones",
  "side": null
 },
 {
  "id": "vertebra-t7",
  "name": "Vértebra T7",
  "sourceName": "seventh thoracic vertebra",
  "fma": "FMA9968",
  "group": "bones",
  "side": null
 },
 {
  "id": "vertebra-t8",
  "name": "Vértebra T8",
  "sourceName": "eighth thoracic vertebra",
  "fma": "FMA9991",
  "group": "bones",
  "side": null
 },
 {
  "id": "vertebra-t9",
  "name": "Vértebra T9",
  "sourceName": "ninth thoracic vertebra",
  "fma": "FMA10014",
  "group": "bones",
  "side": null
 },
 {
  "id": "vertebra-t10",
  "name": "Vértebra T10",
  "sourceName": "tenth thoracic vertebra",
  "fma": "FMA10037",
  "group": "bones",
  "side": null
 },
 {
  "id": "vertebra-t11",
  "name": "Vértebra T11",
  "sourceName": "eleventh thoracic vertebra",
  "fma": "FMA10059",
  "group": "bones",
  "side": null
 },
 {
  "id": "vertebra-t12",
  "name": "Vértebra T12",
  "sourceName": "twelfth thoracic vertebra",
  "fma": "FMA10081",
  "group": "bones",
  "side": null
 },
 {
  "id": "vertebra-l1",
  "name": "Vértebra L1",
  "sourceName": "first lumbar vertebra",
  "fma": "FMA13072",
  "group": "bones",
  "side": null
 },
 {
  "id": "vertebra-l2",
  "name": "Vértebra L2",
  "sourceName": "second lumbar vertebra",
  "fma": "FMA13073",
  "group": "bones",
  "side": null
 },
 {
  "id": "vertebra-l3",
  "name": "Vértebra L3",
  "sourceName": "third lumbar vertebra",
  "fma": "FMA13074",
  "group": "bones",
  "side": null
 },
 {
  "id": "vertebra-l4",
  "name": "Vértebra L4",
  "sourceName": "fourth lumbar vertebra",
  "fma": "FMA13075",
  "group": "bones",
  "side": null
 },
 {
  "id": "vertebra-l5",
  "name": "Vértebra L5",
  "sourceName": "fifth lumbar vertebra",
  "fma": "FMA13076",
  "group": "bones",
  "side": null
 },
 {
  "id": "sacrum",
  "name": "Sacro",
  "sourceName": "sacrum",
  "fma": "FMA16202",
  "group": "bones",
  "side": null
 },
 {
  "id": "disc-c2-c3",
  "name": "Disco intervertebral C2–C3",
  "sourceName": "intervertebral disk of axis",
  "fma": "FMA25058",
  "group": "discs",
  "side": null
 },
 {
  "id": "disc-c3-c4",
  "name": "Disco intervertebral C3–C4",
  "sourceName": "intervertebral disk of third cervical vertebra",
  "fma": "FMA13896",
  "group": "discs",
  "side": null
 },
 {
  "id": "disc-c4-c5",
  "name": "Disco intervertebral C4–C5",
  "sourceName": "intervertebral disk of fourth cervical vertebra",
  "fma": "FMA13897",
  "group": "discs",
  "side": null
 },
 {
  "id": "disc-c5-c6",
  "name": "Disco intervertebral C5–C6",
  "sourceName": "intervertebral disk of fifth cervical vertebra",
  "fma": "FMA13898",
  "group": "discs",
  "side": null
 },
 {
  "id": "disc-c6-c7",
  "name": "Disco intervertebral C6–C7",
  "sourceName": "intervertebral disk of sixth cervical vertebra",
  "fma": "FMA13899",
  "group": "discs",
  "side": null
 },
 {
  "id": "disc-c7-t1",
  "name": "Disco intervertebral C7–T1",
  "sourceName": "intervertebral disk of seventh cervical vertebra",
  "fma": "FMA13900",
  "group": "discs",
  "side": null
 },
 {
  "id": "disc-t1-t2",
  "name": "Disco intervertebral T1–T2",
  "sourceName": "intervertebral disk of first thoracic vertebra",
  "fma": "FMA10458",
  "group": "discs",
  "side": null
 },
 {
  "id": "disc-t2-t3",
  "name": "Disco intervertebral T2–T3",
  "sourceName": "intervertebral disk of second thoracic vertebra",
  "fma": "FMA13495",
  "group": "discs",
  "side": null
 },
 {
  "id": "disc-t3-t4",
  "name": "Disco intervertebral T3–T4",
  "sourceName": "intervertebral disk of third thoracic vertebra",
  "fma": "FMA13500",
  "group": "discs",
  "side": null
 },
 {
  "id": "disc-t4-t5",
  "name": "Disco intervertebral T4–T5",
  "sourceName": "intervertebral disk of fourth thoracic vertebra",
  "fma": "FMA13501",
  "group": "discs",
  "side": null
 },
 {
  "id": "disc-t5-t6",
  "name": "Disco intervertebral T5–T6",
  "sourceName": "intervertebral disk of fifth thoracic vertebra",
  "fma": "FMA13502",
  "group": "discs",
  "side": null
 },
 {
  "id": "disc-t6-t7",
  "name": "Disco intervertebral T6–T7",
  "sourceName": "intervertebral disk of sixth thoracic vertebra",
  "fma": "FMA13503",
  "group": "discs",
  "side": null
 },
 {
  "id": "disc-t7-t8",
  "name": "Disco intervertebral T7–T8",
  "sourceName": "intervertebral disk of seventh thoracic vertebra",
  "fma": "FMA13504",
  "group": "discs",
  "side": null
 },
 {
  "id": "disc-t8-t9",
  "name": "Disco intervertebral T8–T9",
  "sourceName": "intervertebral disk of eighth thoracic vertebra",
  "fma": "FMA13505",
  "group": "discs",
  "side": null
 },
 {
  "id": "disc-t9-t10",
  "name": "Disco intervertebral T9–T10",
  "sourceName": "intervertebral disk of ninth thoracic vertebra",
  "fma": "FMA13506",
  "group": "discs",
  "side": null
 },
 {
  "id": "disc-t10-t11",
  "name": "Disco intervertebral T10–T11",
  "sourceName": "intervertebral disk of tenth thoracic vertebra",
  "fma": "FMA13507",
  "group": "discs",
  "side": null
 },
 {
  "id": "disc-t11-t12",
  "name": "Disco intervertebral T11–T12",
  "sourceName": "intervertebral disk of eleventh thoracic vertebra",
  "fma": "FMA13508",
  "group": "discs",
  "side": null
 },
 {
  "id": "disc-t12-l1",
  "name": "Disco intervertebral T12–L1",
  "sourceName": "intervertebral disk of twelfth thoracic vertebra",
  "fma": "FMA13509",
  "group": "discs",
  "side": null
 },
 {
  "id": "disc-l1-l2",
  "name": "Disco intervertebral L1–L2",
  "sourceName": "intervertebral disk of first lumbar vertebra",
  "fma": "FMA16033",
  "group": "discs",
  "side": null
 },
 {
  "id": "disc-l2-l3",
  "name": "Disco intervertebral L2–L3",
  "sourceName": "intervertebral disk of second lumbar vertebra",
  "fma": "FMA16034",
  "group": "discs",
  "side": null
 },
 {
  "id": "disc-l3-l4",
  "name": "Disco intervertebral L3–L4",
  "sourceName": "intervertebral disk of third lumbar vertebra",
  "fma": "FMA16035",
  "group": "discs",
  "side": null
 },
 {
  "id": "disc-l4-l5",
  "name": "Disco intervertebral L4–L5",
  "sourceName": "intervertebral disk of fourth lumbar vertebra",
  "fma": "FMA16036",
  "group": "discs",
  "side": null
 },
 {
  "id": "disc-l5-s1",
  "name": "Disco intervertebral L5–S1",
  "sourceName": "intervertebral disk of fifth lumbar vertebra",
  "fma": "FMA16037",
  "group": "discs",
  "side": null
 },
 {
  "id": "vertebral-arteries",
  "name": "Arterias vertebrales",
  "sourceName": "trunks of right and left vertebral arteries",
  "fma": "FMA76261",
  "group": "vessels",
  "side": null
 }
].map(x=>Object.freeze(x)));
export const NERVE_BY_ID=Object.freeze(Object.fromEntries(NERVE_REGISTRY.map(x=>[x.id,x])));
export const NERVE_LIMITS=Object.freeze([
 'Los nervios espinales disponibles corresponden al lado izquierdo, de C1 a T2; no existen nervios derechos en este recurso.',
 'El plexo braquial representado es izquierdo; no incluye una segmentación completa de todos sus nervios terminales.',
 'La cauda equina se representa mediante una malla conjunta, no raíces lumbosacras individuales.',
 'No hay pares craneales ni nervios periféricos de todo el cuerpo en este recurso.',
 'El archivo fue adaptado desde BodyParts3D 4.3; aún requiere auditoría anatómica específica en Atlas.'
]);
export const NEURAL_GROUPS=new Set(['central','spinal','plexus']);
export function nerveCategory(id){
 return NERVE_BY_ID[id]?.group||null;
}
export function nerveIsNeural(record){
 return Boolean(record&&NEURAL_GROUPS.has(record.group));
}
export function nerveVisible(record,{group='all',context=true,hiddenIds=new Set(),isolateId=null}={}){
 if(!record||hiddenIds.has(record.id))return false;
 if(isolateId!==null)return record.id===isolateId;
 if(!context&&!nerveIsNeural(record))return false;
 return group==='all'||record.group===group;
}
export function nerveRelated(record){
 if(!record)return [];
 if(record.id==='brachial-plexus')return ['nerve-c5','nerve-c6','nerve-c7','nerve-c8','nerve-t1'];
 if(/^nerve-(c[5-8]|t1)$/.test(record.id))return ['brachial-plexus'];
 if(record.id==='cauda-equina')return ['spinal-cord'];
 if(record.id==='medulla-oblongata')return ['spinal-cord'];
 if(record.id==='spinal-cord')return ['medulla-oblongata','cauda-equina'];
 return [];
}
