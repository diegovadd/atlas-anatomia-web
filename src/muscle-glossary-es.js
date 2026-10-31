/**
 * Glosario preliminar bilingüe, separado de los datos OINA.
 * Es una nomenclatura de identificación para explorar mallas Écorché.
 * Las etiquetas no implican validación anatómica de la forma 3D.
 * NO asignar origen/inserción/inervación/acción sin cotejar bibliografía.
 */
const G=[
 // Cara y cuello
 ['temporalis','Temporal','head'],
 ['masseter','Masetero','head'],
 ['orbicularis oris','Orbicular de la boca','head'],
 ['orbicularis oculi','Orbicular del ojo','head'],
 ['frontalis','Frontal','head'],
 ['nasalis','Nasal','head'],
 ['mentalis','Mentoniano','head'],
 ['procerus','Prócer','head'],
 ['risorius','Risorio','head'],
 ['corrugator supercilii','Corrugador superciliar','head'],
 ['zygomaticus major','Cigomático mayor','head'],
 ['zygomaticus minor','Cigomático menor','head'],
 ['depressor anguli oris','Depresor del ángulo de la boca','head'],
 ['depressor labii inferioris','Depresor del labio inferior','head'],
 ['levator labii superioris','Elevador del labio superior','head'],
 ['medial pterygoid','Pterigoideo medial','head'],
 ['lateral pterygoid','Pterigoideo lateral','head'],
 ['sternocleidomastoid','Esternocleidomastoideo','neck'],
 ['sternohyoid','Esternohioideo','neck'],
 ['sternothyroid','Esternotiroideo','neck'],
 ['thyrohyoid','Tirohioideo','neck'],
 ['omohyoid','Omohioideo','neck'],
 ['scalenus anterior','Escaleno anterior','neck'],
 ['scalenus medius','Escaleno medio','neck'],
 ['scalenus posterior','Escaleno posterior','neck'],
 ['levator scapulae','Elevador de la escápula','neck'],
 ['splenius capitis','Esplenio de la cabeza','neck'],
 ['splenius cervicis','Esplenio del cuello','neck'],
 ['rectus capitis posterior major','Recto posterior mayor de la cabeza','neck'],
 ['rectus capitis posterior minor','Recto posterior menor de la cabeza','neck'],
 ['obliquus capitis inferior','Oblicuo inferior de la cabeza','neck'],
 ['obliquus capitis superior','Oblicuo superior de la cabeza','neck'],
 // Tórax, abdomen y dorso
 ['pectoralis major','Pectoral mayor','chest'],
 ['pectoralis minor','Pectoral menor','chest'],
 ['subclavius','Subclavio','chest'],
 ['external intercostal','Intercostal externo','chest'],
 ['serratus anterior','Serrato anterior','chest'],
 ['trapezius','Trapecio','back'],
 ['latissimus dorsi','Dorsal ancho','back'],
 ['rhomboid major','Romboides mayor','back'],
 ['rhomboid minor','Romboides menor','back'],
 ['serratus posterior superior','Serrato posterior superior','back'],
 ['serratus posterior inferior','Serrato posterior inferior','back'],
 ['longissimus capitis','Longísimo de la cabeza','back'],
 ['longissimus cervicis','Longísimo del cuello','back'],
 ['longissimus thoracis','Longísimo del tórax','back'],
 ['iliocostalis cervicis','Iliocostal cervical','back'],
 ['iliocostalis thoracis','Iliocostal torácico','back'],
 ['iliocostalis lumborum','Iliocostal lumbar','back'],
 ['spinalis thoracis','Espinoso del tórax','back'],
 ['multifidus cervicis','Multífido cervical','back'],
 ['multifidus thoracis','Multífido torácico','back'],
 ['multifidus lumborum','Multífido lumbar','back'],
 ['rotatores','Rotadores vertebrales','back'],
 ['semispinalis capitis','Semiespinoso de la cabeza','back'],
 ['semispinalis cervicis','Semiespinoso del cuello','back'],
 ['semispinalis thoracis','Semiespinoso del tórax','back'],
 ['rectus abdominis','Recto del abdomen','abdomen'],
 ['external oblique','Oblicuo externo del abdomen','abdomen'],
 ['internal oblique','Oblicuo interno del abdomen','abdomen'],
 ['transversus abdominis','Transverso del abdomen','abdomen'],
 ['quadratus lumborum','Cuadrado lumbar','back'],
 // Miembro superior
 ['deltoid','Deltoides','upper'],
 ['infraspinatus','Infraespinoso','upper'],
 ['supraspinatus','Supraespinoso','upper'],
 ['subscapularis','Subescapular','upper'],
 ['teres major','Redondo mayor','upper'],
 ['teres minor','Redondo menor','upper'],
 ['biceps brachii','Bíceps braquial','upper'],
 ['triceps brachii','Tríceps braquial','upper'],
 ['brachialis','Braquial','upper'],
 ['brachioradialis','Braquiorradial','upper'],
 ['coracobrachialis','Coracobraquial','upper'],
 ['anconeus','Ancóneo','upper'],
 ['supinator','Supinador','upper'],
 ['pronator teres','Pronador redondo','upper'],
 ['pronator quadratus','Pronador cuadrado','upper'],
 ['palmaris longus','Palmar largo','upper'],
 ['flexor carpi radialis','Flexor radial del carpo','upper'],
 ['flexor carpi ulnaris','Flexor cubital del carpo','upper'],
 ['extensor carpi radialis longus','Extensor radial largo del carpo','upper'],
 ['extensor carpi radialis brevis','Extensor radial corto del carpo','upper'],
 ['extensor carpi ulnaris','Extensor cubital del carpo','upper'],
 ['extensor digiti minimi','Extensor del dedo meñique','upper'],
 ['extensor digitorum','Extensor de los dedos','upper'],
 ['extensor indicis','Extensor del índice','upper'],
 ['extensor pollicis longus','Extensor largo del pulgar','upper'],
 ['extensor pollicis brevis','Extensor corto del pulgar','upper'],
 ['abductor pollicis longus','Abductor largo del pulgar','upper'],
 ['abductor pollicis brevis','Abductor corto del pulgar','upper'],
 ['flexor pollicis longus','Flexor largo del pulgar','upper'],
 ['flexor pollicis brevis','Flexor corto del pulgar','upper'],
 ['adductor pollicis','Aductor del pulgar','upper'],
 ['opponens pollicis','Oponente del pulgar','upper'],
 ['flexor digitorum profundus','Flexor profundo de los dedos','upper'],
 ['flexor digitorum superficialis','Flexor superficial de los dedos','upper'],
 ['abductor digiti minimi of hand','Abductor del dedo meñique de la mano','upper'],
 ['flexor digiti minimi brevis of hand','Flexor corto del dedo meñique de la mano','upper'],
 ['opponens digiti minimi of hand','Oponente del dedo meñique de la mano','upper'],
 ['set of dorsal interossei of hand','Conjunto de interóseos dorsales de la mano','upper'],
 ['set of palmar interossei of hand','Conjunto de interóseos palmares de la mano','upper'],
 ['set of lumbricals of hand','Conjunto de lumbricales de la mano','upper'],
 // Pelvis y muslo
 ['psoas major','Psoas mayor','pelvis'],
 ['iliacus','Ilíaco','pelvis'],
 ['gluteus maximus','Glúteo mayor','pelvis'],
 ['gluteus medius','Glúteo medio','pelvis'],
 ['gluteus minimus','Glúteo menor','pelvis'],
 ['tensor fasciae latae','Tensor de la fascia lata','pelvis'],
 ['piriformis','Piriforme','pelvis'],
 ['gemellus superior','Gémino superior','pelvis'],
 ['gemellus inferior','Gémino inferior','pelvis'],
 ['obturator externus','Obturador externo','pelvis'],
 ['obturator internus','Obturador interno','pelvis'],
 ['quadratus femoris','Cuadrado femoral','pelvis'],
 ['adductor brevis','Aductor corto','lower'],
 ['adductor longus','Aductor largo','lower'],
 ['adductor magnus','Aductor mayor','lower'],
 ['adductor minimus','Aductor mínimo','lower'],
 ['pectineus','Pectíneo','lower'],
 ['gracilis','Grácil','lower'],
 ['sartorius','Sartorio','lower'],
 ['biceps femoris','Bíceps femoral','lower'],
 ['semimembranosus','Semimembranoso','lower'],
 ['semitendinosus','Semitendinoso','lower'],
 ['rectus femoris','Recto femoral','lower'],
 ['vastus medialis','Vasto medial','lower'],
 ['vastus lateralis','Vasto lateral','lower'],
 ['vastus intermedius','Vasto intermedio','lower'],
 // Pierna, pie
 ['tibialis anterior','Tibial anterior','lower'],
 ['tibialis posterior','Tibial posterior','lower'],
 ['fibularis longus','Fibular largo','lower'],
 ['fibularis brevis','Fibular corto','lower'],
 ['fibularis tertius','Fibular tercero','lower'],
 ['soleus','Sóleo','lower'],
 ['gastrocnemius','Gastrocnemio','lower'],
 ['popliteus','Poplíteo','lower'],
 ['plantaris','Plantar','lower'],
 ['extensor digitorum longus','Extensor largo de los dedos del pie','lower'],
 ['flexor digitorum longus','Flexor largo de los dedos del pie','lower'],
 ['flexor digitorum brevis','Flexor corto de los dedos del pie','lower'],
 ['extensor hallucis longus','Extensor largo del dedo gordo','lower'],
 ['extensor hallucis brevis','Extensor corto del dedo gordo','lower'],
 ['flexor hallucis longus','Flexor largo del dedo gordo','lower'],
 ['flexor hallucis brevis','Flexor corto del dedo gordo','lower'],
 ['abductor hallucis','Abductor del dedo gordo','lower'],
 ['adductor hallucis','Aductor del dedo gordo','lower'],
 ['abductor digiti minimi of foot','Abductor del dedo meñique del pie','lower'],
 ['flexor digiti minimi brevis of foot','Flexor corto del dedo meñique del pie','lower'],
 ['opponens digiti minimi of foot','Oponente del dedo meñique del pie','lower'],
 // Estructuras de tejido conectivo que la fuente incluye en capas musculares
 ['calcaneal tendon','Tendón calcáneo (de Aquiles)','lower','connective'],
 ['iliotibial tract','Tracto iliotibial','lower','connective'],
 ['flexor retinaculum of wrist','Retináculo flexor de la muñeca','upper','connective'],
 ['posterior layer of thoracolumbar fascia','Lámina posterior de la fascia toracolumbar','back','connective'],
 ['linea alba','Línea alba','abdomen','connective']
];

export const MUSCLE_GLOSSARY=Object.freeze(Object.fromEntries(
 G.map(([english,spanish,region,kind='muscle'])=>
  [english,Object.freeze({spanish,region,kind})])
));
const PARTS=Object.freeze({
 'abdominal part':'Porción abdominal',
 'acromial part':'Porción acromial',
 'ascending part':'Porción ascendente',
 'clavicular part':'Porción clavicular',
 'deep part':'Porción profunda',
 'descending part':'Porción descendente',
 'orbital part':'Porción orbitaria',
 'palpebral part':'Porción palpebral',
 'spinal part':'Porción espinal',
 'sternocostal part':'Porción esternocostal',
 'superficial part':'Porción superficial',
 'transverse part':'Porción transversa',
 'humeral head':'Cabeza humeral',
 'inferior head':'Cabeza inferior',
 'lateral head':'Cabeza lateral',
 'long head':'Cabeza larga',
 'medial head':'Cabeza medial',
 'oblique head':'Cabeza oblicua',
 'short head':'Cabeza corta',
 'superior head':'Cabeza superior',
 'transverse head':'Cabeza transversa',
 'ulnar head':'Cabeza cubital'
});
const ORDINAL=Object.freeze({first:'Primer',second:'Segundo',third:'Tercer',fourth:'Cuarto'});
const normalize=v=>String(v||'').trim().toLowerCase().replace(/\s+/g,' ');
export function stripSourceLaterality(name=''){
 return normalize(name)
  .replace(/\(\d+\)$/,'').trim()
  .replace(/\b(left|right)\b/g,'')
  .replace(/\s+/g,' ').trim()
  .replace(/\s+muscle$/,'');
}
export function translateSourceStructure(name=''){
 const base=stripSourceLaterality(name);
 if(MUSCLE_GLOSSARY[base])return {...MUSCLE_GLOSSARY[base],translated:true};
 const partial=base.match(/^(.*?) of (.*?)$/);
 if(partial){
  const prefix=PARTS[partial[1]];
  const root=MUSCLE_GLOSSARY[partial[2]];
  if(prefix&&root&&root.kind==='muscle'){
   return {spanish:prefix+' del '+root.spanish.toLowerCase(),region:root.region,kind:'muscle',translated:true};
  }
 }
 const ordinal=base.match(/^(first|second|third|fourth) (lumbrical|plantar interosseous) of foot$/);
 if(ordinal)return {
  spanish:ORDINAL[ordinal[1]]+(ordinal[2]==='lumbrical'?' lumbrical del pie':' interóseo plantar del pie'),
  region:'lower',kind:'muscle',translated:true
 };
 return {spanish:null,region:null,kind:'muscle',translated:false};
}
export const GLOSSARY_ENTRY_COUNT=Object.keys(MUSCLE_GLOSSARY).length;
