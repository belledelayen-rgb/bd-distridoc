import { construireDefinition } from './definition.js';
import { construireDossier, titreDossier } from './dossier.js';
import { assemblerDossier } from './pieces-jointes.js';

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

/** Enregistre sur l'appareil un PDF déjà constitué en mémoire. */
function telechargerOctets(octets, nom) {
  const url = URL.createObjectURL(new Blob([octets], { type: 'application/pdf' }));
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nom;
  lien.click();
  URL.revokeObjectURL(url);
}

/**
 * Construit puis télécharge un dossier réunissant plusieurs documents.
 *
 * SANS PIÈCE JOINTE, le chemin reste exactement celui d'avant : pdfmake écrit
 * le fichier lui-même et pdf-lib n'est pas même chargée. Le détour par pdf-lib
 * n'a lieu que lorsqu'une pièce doit réellement être insérée.
 */
export async function telechargerDossier(idsDocuments, documents, champs, valeurs, options = {}) {
  const pieces = options.pieces || [];
  const definition = construireDossier(idsDocuments, documents, champs, valeurs, options);
  const pdfMake = await chargerPdfMake();
  const nom = nomFichier(titreDossier(valeurs));

  if (pieces.length === 0) {
    pdfMake.createPdf(definition).download(nom);
    return;
  }

  const octets = await pdfMake.createPdf(definition).getBuffer();
  telechargerOctets(await assemblerDossier(octets, pieces), nom);
}
