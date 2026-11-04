/**
 * Atlas · prueba pública. Informes preparados en el cliente.
 * No se envía contenido a servidores sin acción explícita del evaluador.
 * Los reportes son observaciones sin validar, nunca fichas aprobadas.
 */
export const FEEDBACK_SCHEMA='atlas-community-feedback-v1';
export const FEEDBACK_CATEGORIES=Object.freeze({
 navigation:'Navegación y facilidad de uso',
 readability:'Diseño y legibilidad',
 nomenclature:'Nombre o lateralidad',
 geometry:'Estructura y geometría 3D',
 missing:'Estructura faltante',
 other:'Otra observación'
});
export const FEEDBACK_DEVICES=Object.freeze({
 desktop:'Computadora',mobile:'Teléfono',tablet:'Tableta',other:'Otro dispositivo'
});
export const PUBLIC_ISSUES_URL='https://github.com/diegovadd/atlas-anatomia-web/issues/new';
const textOk=(v,max)=>typeof v==='string'&&v.trim().length>0&&v.trim().length<=max;
const contextField=(v,max)=>typeof v==='string'&&v.length<=max?v.trim():'';
export function createFeedback({category,device,observation,reference='',structure=null}={}){
 if(!Object.hasOwn(FEEDBACK_CATEGORIES,category))throw new TypeError('Selecciona un tipo de comentario');
 if(!Object.hasOwn(FEEDBACK_DEVICES,device))throw new TypeError('Selecciona el dispositivo utilizado');
 if(!textOk(observation,1400)||observation.trim().length<15)throw new TypeError('Describe el problema en al menos 15 caracteres (máximo 1400)');
 if(typeof reference!=='string'||reference.length>350)throw new TypeError('Referencia demasiado extensa');
 let selected=null;
 if(structure&&typeof structure==='object'&&!Array.isArray(structure)){
  selected={
   system:contextField(structure.system,60),
   id:contextField(structure.id,220),
   name:contextField(structure.name,220),
   originalName:contextField(structure.originalName,220),
   sourceUrl:contextField(structure.sourceUrl,700)
  };
  if(!selected.system||!selected.id||!selected.name)selected=null;
 }
 return Object.freeze({
  schema:FEEDBACK_SCHEMA,
  category,device,observation:observation.trim(),
  reference:reference.trim(),structure:selected,
  reviewStatus:'pendiente_revision',
  disclaimer:'Observación de usuario: no valida por sí sola la exactitud anatómica.'
 });
}
export function feedbackTitle(report){
 if(report?.schema!==FEEDBACK_SCHEMA)throw new TypeError('Informe no válido');
 const title=report.structure?.name||'Atlas general';
 return ('[Atlas] '+FEEDBACK_CATEGORIES[report.category]+' · '+title).slice(0,140);
}
export function feedbackText(report){
 if(report?.schema!==FEEDBACK_SCHEMA||!Object.hasOwn(FEEDBACK_CATEGORIES,report.category))throw new TypeError('Informe no válido');
 const context=report.structure;
 return [
  'ATLAS · REPORTE DE PRUEBA PÚBLICA',
  '',
  'Área: '+FEEDBACK_CATEGORIES[report.category],
  'Dispositivo: '+FEEDBACK_DEVICES[report.device],
  'Estructura: '+(context?.name||'Sin estructura seleccionada'),
  ...(context?[
   'Sistema: '+context.system,
   'Identificador del modelo: '+context.id,
   'Nombre original: '+context.originalName,
   'Fuente 3D: '+context.sourceUrl
  ]:[]),
  '',
  'Observación:',
  report.observation,
  '',
  'Referencia anatómica o evidencia aportada:',
  report.reference||'No aportada',
  '',
  'Estado: pendiente de revisión bibliográfica y anatómica.',
  'No incluir datos personales, historia clínica ni información sensible.'
 ].join('\n');
}
export function feedbackIssueUrl(report){
 const params=new URLSearchParams({
  title:feedbackTitle(report),
  body:feedbackText(report)
 });
 return PUBLIC_ISSUES_URL+'?'+params.toString();
}
