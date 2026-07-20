import { construireDefinition } from './definition.js';

let pdfMakePromesse = null;

/**
 * pdfmake embarque ses polices : environ 300 ko. Il n'est chargé qu'au moment
 * où un document est demandé, pour ne pas alourdir la page d'accueil.
 */
function chargerPdfMake() {
  if (!pdfMakePromesse) {
    pdfMakePromesse = (async () => {
      const module = await import('pdfmake/build/pdfmake');
      const polices = await import('pdfmake/build/vfs_fonts');
      const pdfMake = module.default || module;
      const vfs = polices.default?.pdfMake?.vfs || polices.default?.vfs || polices.vfs;
      if (vfs) pdfMake.vfs = vfs;
      return pdfMake;
    })();
  }
  return pdfMakePromesse;
}

/** Nom de fichier lisible, sans accent ni caractère problématique. */
export function nomFichier(titre, date = new Date()) {
  const base = titre
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${base}-${date.toISOString().slice(0, 10)}.pdf`;
}

/** Construit puis télécharge le PDF d'un document. */
export async function telechargerDocument(document, champs, valeurs, options = {}) {
  const definition = construireDefinition(document, champs, valeurs, options);
  const pdfMake = await chargerPdfMake();
  pdfMake.createPdf(definition).download(nomFichier(document.titreFr));
}
