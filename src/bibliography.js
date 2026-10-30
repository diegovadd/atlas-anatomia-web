/** Bibliografía de referencia de Atlas. La inclusión de una obra no acredita por sí sola una ficha. */
export const PRIMARY_BIBLIOGRAPHY = Object.freeze([
  {
    id: 'moore9',
    short: 'Moore (9.ª ed.)',
    display: 'Moore. Anatomía con orientación clínica, 9.ª edición',
    authors: 'Dalley AF II, Agur AMR',
    year: 2023,
    publisher: 'Wolters Kluwer',
    isbn: '9788418892745',
    url: 'https://www.lww.co.uk/9788418892745/moore-anatomia-con-orientacion-clinica/'
  },
  {
    id: 'rouviere11',
    short: 'Rouvière y Delmas (11.ª ed.)',
    display: 'Anatomía humana: descriptiva, topográfica y funcional, 11.ª edición (4 tomos)',
    authors: 'Rouvière H, Delmas A, Delmas V',
    year: 2005,
    publisher: 'Masson / Elsevier',
    isbn: '9788445813133',
    url: 'https://tienda.elsevier.es/anatomia-humana-descriptiva-topografica-y-funcional-tomo-1-cabeza-y-cuello-9788445813133.html',
    note: 'URL e ISBN corresponden al tomo 1; la obra comprende 4 tomos.'
  }
]);
export const REVIEW_STATUSES = Object.freeze({
  PENDING: 'pendiente_cotejo',
  REVIEWED: 'revisado_con_libros'
});
