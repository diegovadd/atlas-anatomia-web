/**
 * Ajustes de visualización del visor óseo.
 * Aumentar la resolución de dibujo mejora la nitidez de la pantalla,
 * pero no añade polígonos ni accidentes anatómicos al GLB.
 */
export const QUALITY_PRESETS = Object.freeze({
  ahorro: Object.freeze({label:'Ahorro',pixelRatioCap:1}),
  equilibrada: Object.freeze({label:'Equilibrada',pixelRatioCap:1.5}),
  alta: Object.freeze({label:'Alta',pixelRatioCap:2})
});
export const DEFAULT_RENDER_SETTINGS = Object.freeze({quality:'equilibrada',light:90});
export const BONE_SURFACE = Object.freeze({roughness:0.96,metalness:0});

export function normalizeRenderQuality(value){
  return Object.hasOwn(QUALITY_PRESETS,value)?value:DEFAULT_RENDER_SETTINGS.quality;
}
export function normalizeLightLevel(value){
  const num=Number(value);
  if(!Number.isFinite(num))return DEFAULT_RENDER_SETTINGS.light;
  return Math.min(120,Math.max(60,Math.round(num/5)*5));
}
export function displayPixelRatio(quality,devicePixelRatio=1){
  const dpr=Number(devicePixelRatio);
  const safe=Number.isFinite(dpr)&&dpr>0?dpr:1;
  return Math.min(safe,QUALITY_PRESETS[normalizeRenderQuality(quality)].pixelRatioCap);
}
export function displayExposure(light=DEFAULT_RENDER_SETTINGS.light){
  // ACES: rango de 0.57 a 1.14; predeterminado mate ≈0.855.
  return Number((0.95*normalizeLightLevel(light)/100).toFixed(3));
}
