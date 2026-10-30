/** Datos anatómicos preliminares de Atlas (borradores, NO cotejados con Moore o Rouvière).
 * A partir de v0.3, la única bibliografía prevista para revisión es Moore y Rouvière.
 * Ningún texto se marca como verificado hasta cotejo con edición, tomo, capítulo y página.
 */
export const REGIONS = [
  {id:'body',label:'Cuerpo completo',icon:'◉',key:'Cuerpo completo'},
  {id:'skull',label:'Cráneo',icon:'◇',key:'Cráneo'},
  {id:'neck',label:'Cuello',icon:'⌁',key:'Cuello'},
  {id:'spine',label:'Columna vertebral',icon:'⋮',key:'Columna vertebral'},
  {id:'chest',label:'Caja torácica',icon:'⬡',key:'Caja torácica'},
  {id:'shoulder',label:'Cintura escapular',icon:'⋈',key:'Cintura escapular'},
  {id:'arm',label:'Miembro superior',icon:'╱',key:'Miembro superior'},
  {id:'pelvis',label:'Pelvis',icon:'⌣',key:'Pelvis'},
  {id:'leg',label:'Miembro inferior',icon:'╲',key:'Miembro inferior'},
];

/** Fichas preliminares en español: su contenido no ha sido cotejado aún con Moore y Rouvière. */
export const BONES = {
  'frontal bone': {name:'Frontal',latin:'Os frontale',category:'Neurocráneo',description:'Hueso impar que constituye la frente, el techo de las órbitas y parte de la fosa craneal anterior.',location:'Porción anterior del neurocráneo, anterior a los parietales y superior a los huesos nasales.',function:'Protege el encéfalo y contribuye a la formación de las órbitas.',clinical:'La región del pterion está próxima al trayecto de la arteria meníngea media.',sources:[]},
  'parietal bone':{name:'Parietal',latin:'Os parietale',category:'Neurocráneo',description:'Hueso par de morfología cuadrilátera que forma gran parte de la bóveda y las paredes laterales del cráneo.',location:'Posterior al frontal, superior al temporal y anterior al occipital.',function:'Protege la parte superior y lateral del encéfalo.',clinical:'Los dos parietales se unen mediante la sutura sagital.',sources:[]},
  'temporal bone':{name:'Temporal',latin:'Os temporale',category:'Neurocráneo',description:'Hueso par e irregular con porciones escamosa, petrosa, mastoidea y timpánica.',location:'Pared lateral y base del cráneo, inferior al parietal.',function:'Aloja estructuras del oído; participa en la articulación temporomandibular.',clinical:'Una fractura del pterion puede lesionar la arteria meníngea media.',sources:[]},
  'occipital bone':{name:'Occipital',latin:'Os occipitale',category:'Neurocráneo',description:'Hueso impar que forma la región posterior e inferior del cráneo. Contiene el foramen magno y los cóndilos occipitales.',location:'Posterior a los parietales y temporales; se articula con el atlas.',function:'Protege el tronco encefálico y el cerebelo y permite la articulación atlantooccipital.',clinical:'A través del foramen magno pasan estructuras del sistema nervioso central.',sources:[]},
  'sphenoid bone':{name:'Esfenoides',latin:'Os sphenoidale',category:'Neurocráneo',description:'Hueso impar de la base craneal, formado por cuerpo, alas mayores y menores, y procesos pterigoideos.',location:'Centro de la base del cráneo, posterior al etmoides y a las órbitas.',function:'Contribuye a la base del cráneo, las órbitas y el soporte de múltiples estructuras neurovasculares.',clinical:'En la silla turca se aloja la hipófisis.',sources:[]},
  'ethmoid bone':{name:'Etmoides',latin:'Os ethmoidale',category:'Neurocráneo',description:'Hueso impar, ligero y neumático con lámina cribosa, lámina perpendicular y laberintos etmoidales.',location:'Entre las órbitas, formando parte del techo de la cavidad nasal.',function:'Participa en la pared medial de las órbitas, el tabique nasal y el techo nasal.',clinical:'La lámina cribosa permite el paso de filetes del nervio olfatorio (I).',sources:[]},
  'maxilla':{name:'Maxilar',latin:'Maxilla',category:'Viscerocráneo',description:'Hueso par que constituye gran parte del macizo facial. Su cuerpo contiene el seno maxilar.',location:'Región media de la cara, inferior a las órbitas y lateral a la cavidad nasal.',function:'Soporta dientes superiores; forma parte del paladar duro, órbitas y fosas nasales.',clinical:'La clasificación de Le Fort describe patrones de fracturas del macizo facial.',sources:[]},
  'mandible':{name:'Mandíbula',latin:'Mandibula',category:'Viscerocráneo',description:'Hueso impar y móvil con cuerpo y dos ramas; posee procesos coronoides y condilares.',location:'Tercio inferior de la cara; se articula con ambos temporales.',function:'Permite la masticación y el habla y sostiene la arcada dentaria inferior.',clinical:'El foramen mandibular recibe el nervio alveolar inferior.',sources:[]},
  'zygomatic bone':{name:'Cigomático',latin:'Os zygomaticum',category:'Viscerocráneo',description:'Hueso par que forma la prominencia de la mejilla y parte del reborde y pared lateral de la órbita.',location:'Lateral al maxilar, inferior y lateral a la órbita.',function:'Forma el arco cigomático junto con el temporal y ofrece inserción al masetero.',clinical:'La fractura del complejo cigomaticomaxilar puede alterar el contorno orbitario.',sources:[]},
  'nasal bone':{name:'Nasal',latin:'Os nasale',category:'Viscerocráneo',description:'Hueso par pequeño que contribuye al puente óseo de la nariz.',location:'En la línea media del tercio superior de la nariz, inferior al frontal.',function:'Proporciona soporte a la porción superior de la nariz externa.',clinical:'Son frecuentes las fracturas de los huesos nasales tras traumatismos faciales.',sources:[]},
  'lacrimal bone':{name:'Lagrimal',latin:'Os lacrimale',category:'Viscerocráneo',description:'Hueso par muy delgado de la pared medial de la órbita, asociado al surco lagrimal.',location:'Porción anterior de la pared medial de cada órbita.',function:'Participa en la formación de la fosa del saco lagrimal.',clinical:'El conducto nasolagrimal lleva las lágrimas hacia el meato nasal inferior.',sources:[]},
  'palatine bone':{name:'Palatino',latin:'Os palatinum',category:'Viscerocráneo',description:'Hueso par con láminas horizontal y perpendicular y un proceso piramidal.',location:'Posterior al maxilar, en el paladar duro y pared lateral nasal.',function:'Forma el cuarto posterior del paladar duro y contribuye a la cavidad nasal y órbita.',clinical:'El foramen palatino mayor transmite vasos y nervio palatino mayor.',sources:[]},
  'vomer':{name:'Vómer',latin:'Vomer',category:'Viscerocráneo',description:'Hueso impar, plano y delgado, que contribuye a la parte posteroinferior del tabique nasal.',location:'Plano mediano de la cavidad nasal, inferior al esfenoides.',function:'Separa parcialmente las dos cavidades nasales.',clinical:'Forma parte del tabique nasal óseo junto con la lámina perpendicular del etmoides.',sources:[]},
  'inferior nasal concha bone':{name:'Concha nasal inferior',latin:'Concha nasalis inferior',category:'Viscerocráneo',description:'Hueso par independiente, de forma curva, situado en la pared lateral de la cavidad nasal.',location:'Pared lateral de las cavidades nasales, inferior a la concha media.',function:'Amplía la superficie de mucosa para acondicionar el aire inspirado.',clinical:'El conducto nasolagrimal desemboca por debajo de esta concha.',sources:[]},
  'sternum':{name:'Esternón',latin:'Sternum',category:'Caja torácica',description:'Hueso plano e impar compuesto por manubrio, cuerpo y proceso xifoides.',location:'Pared anterior del tórax, en la línea media.',function:'Protege estructuras torácicas y proporciona inserción a cartílagos costales y músculos.',clinical:'El ángulo esternal es referencia para contar costillas y ubicar T4–T5.',sources:[]},
  'clavicle':{name:'Clavícula',latin:'Clavicula',category:'Cintura escapular',description:'Hueso largo de curvatura en S que une el miembro superior con el esqueleto axial.',location:'Parte superior y anterior del tórax, entre esternón y escápula.',function:'Mantiene el hombro separado del tórax y transmite fuerzas al esqueleto axial.',clinical:'Las fracturas suelen producirse en su tercio medio.',sources:[]},
  'scapula':{name:'Escápula',latin:'Scapula',category:'Cintura escapular',description:'Hueso plano triangular, con espina, acromion, proceso coracoides y cavidad glenoidea.',location:'Región posterolateral del tórax.',function:'Da origen e inserción a músculos del hombro y forma la articulación glenohumeral.',clinical:'La cavidad glenoidea se articula con la cabeza del húmero.',sources:[]},
  'humerus':{name:'Húmero',latin:'Humerus',category:'Miembro superior',description:'Hueso largo del brazo, con cabeza proximal y cóndilo distal.',location:'Entre la escápula y los huesos del antebrazo.',function:'Actúa como palanca muscular en hombro y codo.',clinical:'El nervio radial discurre en el surco del nervio radial del húmero.',sources:[]},
  'radius':{name:'Radio',latin:'Radius',category:'Miembro superior',description:'Hueso lateral del antebrazo en posición anatómica, articulado con húmero, cúbito y carpo.',location:'Lado del pulgar, entre codo y muñeca.',function:'Participa en pronación, supinación y transmisión de cargas.',clinical:'Su extremo distal es un sitio frecuente de fracturas.',sources:[]},
  'ulna':{name:'Cúbito',latin:'Ulna',category:'Miembro superior',description:'Hueso medial del antebrazo, cuya incisura troclear se articula con la tróclea humeral.',location:'Lado del dedo meñique, entre codo y muñeca.',function:'Estabiliza el codo y participa en el movimiento del antebrazo.',clinical:'El olécranon constituye el relieve posterior del codo.',sources:[]},
  'femur':{name:'Fémur',latin:'Femur',category:'Miembro inferior',description:'Hueso largo del muslo, el más largo y resistente del cuerpo.',location:'Entre el acetábulo y la rodilla.',function:'Transmite el peso corporal y sirve como palanca para la marcha.',clinical:'La fractura del cuello femoral puede comprometer la irrigación de la cabeza femoral.',sources:[]},
  'tibia':{name:'Tibia',latin:'Tibia',category:'Miembro inferior',description:'Hueso medial y principal soporte de peso de la pierna.',location:'Entre fémur y astrágalo, medial a la fíbula.',function:'Transmite la mayor parte del peso desde la rodilla hasta el tobillo.',clinical:'El maléolo medial pertenece a la tibia.',sources:[]},
  'fibula':{name:'Fíbula (peroné)',latin:'Fibula',category:'Miembro inferior',description:'Hueso largo, delgado y lateral de la pierna.',location:'Lateral a la tibia, desde la rodilla hasta el maléolo lateral.',function:'Da inserción muscular y contribuye a la estabilidad del tobillo.',clinical:'La cabeza fibular está relacionada con el nervio fibular común.',sources:[]},
  'patella':{name:'Rótula',latin:'Patella',category:'Miembro inferior',description:'Hueso sesamoideo grande incluido en el tendón del cuádriceps.',location:'Anterior a la articulación de la rodilla.',function:'Mejora la ventaja mecánica del cuádriceps y protege la rodilla.',clinical:'Su cara posterior se articula con la tróclea femoral.',sources:[]},
  'malleus':{name:'Martillo',latin:'Malleus',category:'Huesecillos del oído',description:'Huesecillo del oído medio conectado a la membrana timpánica por su manubrio.',location:'Cavidad timpánica del temporal.',function:'Transmite las vibraciones del tímpano hacia el yunque.',clinical:'Las alteraciones de la cadena osicular pueden producir hipoacusia conductiva.',sources:[]},
  'incus':{name:'Yunque',latin:'Incus',category:'Huesecillos del oído',description:'Huesecillo del oído medio articulado entre el martillo y el estribo.',location:'Cavidad timpánica del temporal.',function:'Transmite las vibraciones mecánicas de la cadena de huesecillos.',clinical:'Forma las articulaciones incudomaleolar e incudoestapedial.',sources:[]},
  'stapes':{name:'Estribo',latin:'Stapes',category:'Huesecillos del oído',description:'Huesecillo del oído medio cuya base se relaciona con la ventana oval.',location:'Pared medial de la cavidad timpánica.',function:'Transmite las vibraciones a los líquidos del oído interno.',clinical:'La fijación del estribo puede ocasionar hipoacusia de conducción.',sources:[]},
  'hyoid bone':{name:'Hioides',latin:'Os hyoideum',category:'Cuello',description:'Hueso impar en forma de U, suspendido por músculos y ligamentos, sin articulación directa con otros huesos.',location:'Región cervical anterior, superior a la laringe.',function:'Ofrece inserción a músculos de la deglución y del suelo de la boca.',clinical:'Su posición se relaciona con la movilidad laríngea durante la deglución.',sources:[]},
  'sacrum':{name:'Sacro',latin:'Os sacrum',category:'Columna y pelvis',description:'Hueso formado por la fusión de cinco vértebras sacras en el adulto.',location:'En la pared posterior de la pelvis entre ambos huesos coxales.',function:'Transfiere la carga axial a la cintura pélvica.',clinical:'Los forámenes sacros permiten el paso de ramos nerviosos.',sources:[]},
};
/**
 * Inventario esperado de huesos del cráneo adulto (8 neurocráneo, 14 cara).
 * Son 14 tipos y 22 posiciones; no se incluyen los 6 huesecillos del oído.
 * El catálogo es una herramienta de control geométrico, no una cita bibliográfica
 * ni una afirmación de que el modelo esté completo o clínicamente validado.
 */
export const SKULL_BONES = Object.freeze([
  {id:'frontal bone',name:'Frontal',division:'neuro',paired:false},
  {id:'parietal bone',name:'Parietal',division:'neuro',paired:true},
  {id:'temporal bone',name:'Temporal',division:'neuro',paired:true},
  {id:'occipital bone',name:'Occipital',division:'neuro',paired:false},
  {id:'sphenoid bone',name:'Esfenoides',division:'neuro',paired:false},
  {id:'ethmoid bone',name:'Etmoides',division:'neuro',paired:false},
  {id:'maxilla',name:'Maxilar',division:'face',paired:true},
  {id:'mandible',name:'Mandíbula',division:'face',paired:false},
  {id:'zygomatic bone',name:'Cigomático',division:'face',paired:true},
  {id:'nasal bone',name:'Nasal',division:'face',paired:true},
  {id:'lacrimal bone',name:'Lagrimal',division:'face',paired:true},
  {id:'palatine bone',name:'Palatino',division:'face',paired:true},
  {id:'vomer',name:'Vómer',division:'face',paired:false},
  {id:'inferior nasal concha bone',name:'Concha nasal inferior',division:'face',paired:true}
]);

/** Lateralidad explícita en la nomenclatura de la malla: jamás se infiere por posición. */
export function boneSide(raw=''){
  const text=String(raw||'').trim().replace(/\.\d{3}$/,'');
  if(/^(?:left)\s+/i.test(text)||/(?:[._-](?:l|left)|\((?:l|left)\)|\s+left)$/i.test(text))return 'left';
  if(/^(?:right)\s+/i.test(text)||/(?:[._-](?:r|right)|\((?:r|right)\)|\s+right)$/i.test(text))return 'right';
  return null;
}
export function normalizeName(raw=''){
  return String(raw||'').trim().replace(/\.\d{3}$/,'')
    .replace(/^(?:left|right)\s+/i,'')
    .replace(/\s*(?:[._-](?:l|r|left|right)|\((?:l|r|left|right)\)|\s+(?:left|right))$/i,'').trim();
}
export function skullBoneId(raw=''){
  const name=normalizeName(raw).toLowerCase();
  const found=SKULL_BONES.find(b=>name===b.id||name.startsWith(b.id+' ')||name.endsWith(' '+b.id));
  return found?.id||null;
}
export function skullDivision(raw){
  const id=skullBoneId(raw);
  return SKULL_BONES.find(b=>b.id===id)?.division||null;
}
/**
 * Conteo de posiciones óseas reconocibles en las etiquetas, NO de mallas.
 * Varias mallas pueden representar el mismo hueso; una malla bilateral sin
 * lateralidad explícita queda sin resolver, en vez de contarse dos veces.
 */
export function skullInventory(entries=[]){
  const identified=new Set(),unresolved=new Set();
  for(const entry of entries){
    const raw=typeof entry==='string'?entry:entry?.name;
    const id=skullBoneId(raw||'');
    if(!id)continue;
    const bone=SKULL_BONES.find(b=>b.id===id);
    if(!bone.paired){identified.add(id+':single');continue}
    const side=boneSide(raw);
    if(!side){unresolved.add(String(raw));continue}
    identified.add(id+':'+side);
  }
  const missing=[];
  for(const bone of SKULL_BONES){
    for(const side of (bone.paired?['left','right']:['single'])){
      if(!identified.has(bone.id+':'+side)){
        const suffix=side==='single'?'':(side==='left'?' izquierda':' derecha');
        const masculine=bone.name!=='Mandíbula'&&bone.name!=='Concha nasal inferior';
        const ending=masculine?(side==='left'?' izquierdo':' derecho'):suffix;
        missing.push({id:bone.id,side,name:bone.name+(side==='single'?'':ending),division:bone.division});
      }
    }
  }
  return {
    total:22,
    identified:22-missing.length,
    missing,
    unresolved:[...unresolved].sort((a,b)=>a.localeCompare(b,'es'))
  };
}

export function classifyRegion(raw,group=''){
 const name=normalizeName(raw).toLowerCase();const g=(group||'').toLowerCase();
 if(/hyoid/i.test(name))return 'neck';
 if(skullDivision(raw)|| /malleus|incus|stapes|skull/i.test(name)||/skull|cranial|facial bone|mandibular|maxillary|ossicle/i.test(g))return 'skull';
 if(/vertebra|sacrum|coccyx|intervertebral/i.test(name))return 'spine';
 if(/sternum|rib\b|costal|xiphoid/i.test(name))return 'chest';
 if(/clavicle|scapula/i.test(name))return 'shoulder';
 if(/humerus|ulna|radius|carpal|metacarpal|hamate|capitate|pisiform|trapezium|trapezoid|scaphoid|lunate|triquetr|phalange.*hand|phalanx.*hand|finger/i.test(name))return 'arm';
 if(/hip bone|coxal|ilium|ischium|pubis|pubic bone|acetabulum/i.test(name))return 'pelvis';
 if(/femur|tibia|fibula|patella|talus|calcaneus|cuboid|navicular|cuneiform|tarsal|metatarsal|phalange.*foot|phalanx.*foot|toe/i.test(name))return 'leg';
 if(/pelvic|ilium|ischium/i.test(g))return 'pelvis';
 if(/upper limb|arm|forearm|hand/i.test(g))return 'arm';
 if(/lower limb|leg|foot/i.test(g))return 'leg';
 if(/thorax|chest/i.test(g))return 'chest';
 return 'body';
}
export function boneInfo(raw){
 const clean=normalizeName(raw);const k=clean.toLowerCase();
 let meta=BONES[k];if(!meta){const starts=Object.keys(BONES).find(x=>k.startsWith(x+' ')||k.endsWith(' '+x));if(starts)meta=BONES[starts]}
 const feminine=/^(clavícula|escápula|rótula|fíbula|tibia|vértebra|costilla|falange|concha|mandíbula)/i.test(meta?.name||clean);
 let side='';if(boneSide(raw)==='left')side=feminine?' izquierda':' izquierdo';if(boneSide(raw)==='right')side=feminine?' derecha':' derecho';
 if(meta)return {...meta,name:meta.name+side,verified:false,reviewStatus:'pendiente_cotejo',sourceRefs:[]};
 const terms=[
  [/^cervical vertebra/i,'Vértebra cervical'],[/^thoracic vertebra/i,'Vértebra torácica'],[/^lumbar vertebra/i,'Vértebra lumbar'],
  [/^vertebra/i,'Vértebra'],[/^rib/i,'Costilla'],[/^metacarpal/i,'Metacarpiano'],[/^metatarsal/i,'Metatarsiano'],
  [/^proximal phalanx/i,'Falange proximal'],[/^middle phalanx/i,'Falange media'],[/^distal phalanx/i,'Falange distal'],
  [/^carpal/i,'Hueso carpiano'],[/^tarsal/i,'Hueso tarsiano'],[/^hip bone/i,'Hueso coxal'],
  [/^calcaneus/i,'Calcáneo'],[/^talus/i,'Astrágalo'],[/^navicular/i,'Navicular'],[/^cuboid/i,'Cuboides'],
  [/^cuneiform/i,'Cuneiforme'],[/^coccyx/i,'Cóccix'],[/^pisiform/i,'Pisiforme'],[/^hamate/i,'Ganchoso'],
  [/^capitate/i,'Grande'],[/^scaphoid/i,'Escafoides'],[/^trapezium/i,'Trapecio'],[/^trapezoid/i,'Trapezoide'],
  [/^lunate/i,'Semilunar'],[/^triquetral/i,'Piramidal']
 ];
 let pretty=clean.replace(/\bBone\b/gi,'').trim();
 for(const [pattern,translation] of terms)if(pattern.test(clean)){pretty=clean.replace(pattern,translation);break}
 return {name:pretty+(side||''),latin:clean,category:'Estructura ósea',description:'Estructura identificada en el modelo tridimensional. La descripción anatómica específica de este hueso está pendiente de revisión bibliográfica.',location:'Consulta su posición seleccionando la estructura en el visor.',function:'Su ficha funcional está pendiente de revisión.',clinical:'',sources:[],sourceRefs:[],reviewStatus:'pendiente_cotejo',verified:false};
}
