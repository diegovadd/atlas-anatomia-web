/**
 * Atlas · geometría DIDÁCTICA para ensayar el visor muscular antes de integrar
 * mallas anatómicas segmentadas verificadas.
 *
 * Las posiciones y proporciones son esquemáticas; NO representan músculos
 * precisos, no sirven para localizar inserciones ni para diagnóstico.
 * Se crean en el navegador: sin descargas, credenciales ni licencias externas.
 */
export const DEMO_MUSCLES=Object.freeze([
 // clave del catálogo, x desde plano medio, y, z (frente+), ancho, alto, profundidad, inclinación
 ['temporalis',.145,2.94,.11,.115,.14,.115,.17],
 ['masseter',.133,2.72,.145,.085,.135,.09,-.14],
 ['sternocleidomastoid',.105,2.45,.105,.065,.23,.065,-.25],
 ['trapezius',.25,2.29,-.18,.21,.33,.095,.35],
 ['pectoralis major',.224,2.05,.205,.22,.29,.12,-.35],
 ['latissimus dorsi',.29,1.72,-.17,.145,.38,.105,.16],
 ['deltoid',.545,2.14,.035,.17,.245,.145,-.24],
 ['biceps brachii',.584,1.76,.12,.115,.29,.106,-.17],
 ['triceps brachii',.593,1.72,-.105,.115,.31,.10,.12],
 ['brachioradialis',.765,1.23,.088,.076,.255,.075,.08],
 ['rectus abdominis',.129,1.51,.213,.103,.38,.092,.0],
 ['external oblique',.292,1.47,.14,.115,.315,.095,-.22],
 ['gluteus maximus',.22,1.08,-.198,.205,.22,.15,-.22],
 ['rectus femoris',.199,.57,.158,.119,.40,.13,.065],
 ['vastus lateralis',.321,.56,.1,.116,.38,.13,-.12],
 ['sartorius',.233,.67,.261,.055,.435,.049,.31],
 ['gastrocnemius',.24,-.36,-.145,.128,.30,.13,.02],
 ['tibialis anterior',.204,-.36,.132,.075,.32,.065,-.09],
].map(([key,x,y,z,w,h,d,tilt])=>Object.freeze({key,x,y,z,w,h,d,tilt})));

export const DEMO_GUIDE=Object.freeze([
 // y, x, z, radioX, radioY, radioZ
 [2.87,0,0,.205,.245,.176],
 [2.46,0,0,.114,.17,.12],
 [1.91,0,0,.425,.66,.225],
 [1.14,0,0,.34,.27,.215],
 ...[-1,1].flatMap(s=>[
  [1.80,s*.58,0,.145,.44,.15],
  [1.29,s*.73,0,.10,.35,.11],
  [.59,s*.22,0,.205,.60,.19],
  [-.37,s*.23,0,.123,.51,.13],
  [-.89,s*.25,.105,.115,.085,.19],
 ])
].map(([y,x,z,rx,ry,rz])=>Object.freeze({x,y,z,rx,ry,rz})));

export function demoMeshSpecifications(){
 return DEMO_MUSCLES.flatMap(({key,x,y,z,w,h,d,tilt})=>[
  Object.freeze({name:key.charAt(0).toUpperCase()+key.slice(1)+'.R',x:-x,y,z,w,h,d,tilt:-tilt}),
  Object.freeze({name:key.charAt(0).toUpperCase()+key.slice(1)+'.L',x,y,z,w,h,d,tilt})
 ]);
}

export function createMuscleDemo(THREE){
 const muscles=new THREE.Group(),guide=new THREE.Group();
 const geometry=new THREE.SphereGeometry(1,24,16);
 for(const shape of demoMeshSpecifications()){
  const material=new THREE.MeshStandardMaterial({
   color:'#a85856',roughness:.88,metalness:0,side:THREE.DoubleSide
  });
  const m=new THREE.Mesh(geometry,material);
  m.name=shape.name;
  m.position.set(shape.x,shape.y,shape.z);
  m.scale.set(shape.w,shape.h,shape.d);
  m.rotation.z=shape.tilt;
  m.userData.atlasDemo=true;
  muscles.add(m);
 }
 const translucent=new THREE.MeshStandardMaterial({
  color:'#6d8b94',transparent:true,opacity:.13,depthWrite:false,
  roughness:1,metalness:0,side:THREE.DoubleSide
 });
 const guideGeometry=new THREE.SphereGeometry(1,18,12);
 for(const p of DEMO_GUIDE){
  const m=new THREE.Mesh(guideGeometry,translucent);
  m.scale.set(p.rx,p.ry,p.rz);m.position.set(p.x,p.y,p.z);
  m.name='Silueta esquemática (no seleccionable)';
  m.renderOrder=1;
  guide.add(m);
 }
 return {muscles,guide};
}
