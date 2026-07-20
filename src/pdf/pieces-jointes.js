/**
 * Pièces jointes tierces : des PDF que l'utilisatrice possède déjà (certificats
 * d'analyse, fiches fournisseur, attestations) et qui accompagnent ses documents
 * à la fin du dossier.
 *
 * RIEN N'EST CONSERVÉ NI TRANSMIS. Les fichiers sont lus en mémoire vive et
 * disparaissent à la fermeture de l'onglet, comme le reste de la saisie. Ils
 * n'entrent pas non plus dans le brouillon, qui resterait sinon un fichier
 * JSON de plusieurs mégaoctets.
 *
 * pdf-lib n'est chargée QUE depuis ce fichier, et par import dynamique : elle
 * pèse plusieurs centaines de kilo-octets et ne sert qu'à celles qui joignent
 * réellement une pièce. Le chargement initial de l'application n'en pâtit pas.
 */

import { positionsDesPiecesJointes } from './dossier.js';

const MEGAOCTET = 1024 * 1024;

/** Au-delà, la génération risque d'échouer faute de mémoire, surtout sur mobile. */
export const TAILLE_MAX_FICHIER = 15 * MEGAOCTET;
export const TAILLE_MAX_TOTALE = 30 * MEGAOCTET;
export const NOMBRE_MAX = 10;

/** Taille lisible, en français : « 2,4 Mo », « 812 ko ». */
export function formaterTaille(octets) {
  if (octets >= MEGAOCTET) {
    return `${(octets / MEGAOCTET).toFixed(1).replace('.', ',')} Mo`;
  }
  return `${Math.max(1, Math.round(octets / 1024))} ko`;
}

/** Intitulé porté par la page de garde : le nom du fichier, sans son extension. */
export function nomLisible(nomFichier) {
  const base = String(nomFichier || '').replace(/\.pdf$/i, '').trim();
  return base || 'Pièce jointe';
}

/**
 * Contrôles menés AVANT de lire le fichier, donc sans rien charger en mémoire.
 * Fonction pure : elle retourne un message en français, ou null si tout va bien.
 */
export function refusAvantLecture(fichier, dejaPresentes = []) {
  if (!fichier) return null;

  const estPdf = fichier.type === 'application/pdf'
    || /\.pdf$/i.test(fichier.name || '');
  if (!estPdf) {
    return `« ${fichier.name} » n'est pas un PDF. Seuls les fichiers PDF peuvent être joints au dossier.`;
  }

  if (dejaPresentes.length >= NOMBRE_MAX) {
    return `Vous avez déjà joint ${NOMBRE_MAX} pièces, c'est le maximum.`;
  }

  if (fichier.size > TAILLE_MAX_FICHIER) {
    return `« ${fichier.name} » pèse ${formaterTaille(fichier.size)}, au-delà de la limite de ${formaterTaille(TAILLE_MAX_FICHIER)} par pièce. Un fichier trop lourd empêcherait la production du dossier, en particulier sur téléphone.`;
  }

  const totalDeja = dejaPresentes.reduce((n, p) => n + (p.taille || 0), 0);
  if (totalDeja + fichier.size > TAILLE_MAX_TOTALE) {
    return `L'ensemble des pièces jointes dépasserait ${formaterTaille(TAILLE_MAX_TOTALE)}. Retirez une pièce avant d'en ajouter une autre.`;
  }

  return null;
}

/** pdf-lib n'est téléchargée qu'une fois, à la première pièce déposée. */
let pdfLibPromesse = null;
function chargerPdfLib() {
  if (!pdfLibPromesse) pdfLibPromesse = import('pdf-lib');
  return pdfLibPromesse;
}

/** Repère interne d'une pièce, pour pouvoir la retirer de la liste. */
let compteur = 0;
function nouvelIdentifiant() {
  compteur += 1;
  return `piece-${compteur}`;
}

/**
 * Lit un fichier déposé et en compte les pages.
 *
 * Le nombre de pages est indispensable : c'est lui qui permet de réserver, dans
 * le dossier, exactement la place que la pièce occupera, et donc d'obtenir un
 * sommaire dont les numéros sont justes.
 *
 * @param {File} fichier
 * @param {Array} dejaPresentes pièces déjà jointes
 * @returns {Promise<{id: string, nom: string, nomFichier: string, pages: number, taille: number, octets: Uint8Array}>}
 */
export async function lirePieceJointe(fichier, dejaPresentes = []) {
  const refus = refusAvantLecture(fichier, dejaPresentes);
  if (refus) throw new Error(refus);

  const octets = new Uint8Array(await fichier.arrayBuffer());
  const { PDFDocument, EncryptedPDFError } = await chargerPdfLib();

  let lu;
  try {
    lu = await PDFDocument.load(octets);
  } catch (erreur) {
    const chiffre = (EncryptedPDFError && erreur instanceof EncryptedPDFError)
      || /encrypt/i.test(String(erreur && erreur.message));
    if (chiffre) {
      throw new Error(`« ${fichier.name} » est protégé par un mot de passe. Retirez la protection, puis déposez-le de nouveau.`);
    }
    throw new Error(`« ${fichier.name} » n'a pas pu être lu. Le fichier est peut-être abîmé, ou ce n'est pas un véritable PDF.`);
  }

  const pages = lu.getPageCount();
  if (pages === 0) {
    throw new Error(`« ${fichier.name} » ne contient aucune page.`);
  }

  return {
    id: nouvelIdentifiant(),
    nom: nomLisible(fichier.name),
    nomFichier: fichier.name,
    pages,
    taille: fichier.size,
    octets
  };
}

/**
 * Remplace, dans le dossier produit par pdfmake, les pages blanches réservées
 * par les vraies pages des pièces jointes.
 *
 * Le total de pages est donc INCHANGÉ, et les numéros que le sommaire annonce
 * restent exacts. C'est tout l'intérêt d'avoir réservé la place à l'avance :
 * insérer des pages après coup décalerait toutes les pièces suivantes.
 *
 * On procède de la DERNIÈRE pièce vers la PREMIÈRE, pour que les positions des
 * pièces non encore traitées restent valables pendant l'opération.
 *
 * @param {Uint8Array} octetsDossier PDF produit par pdfmake
 * @param {Array} pieces pièces jointes, dans l'ordre du dossier
 * @returns {Promise<Uint8Array>}
 */
export async function assemblerDossier(octetsDossier, pieces) {
  if (!pieces || pieces.length === 0) return octetsDossier;

  const { PDFDocument } = await chargerPdfLib();
  const dossier = await PDFDocument.load(octetsDossier);
  const positions = positionsDesPiecesJointes(dossier.getPageCount(), pieces);

  for (let rang = positions.length - 1; rang >= 0; rang -= 1) {
    const position = positions[rang];

    // Les blancs réservés cèdent la place aux pages réelles.
    for (let n = 0; n < position.pages; n += 1) {
      dossier.removePage(position.premierBlanc);
    }

    // La copie travaille sur un exemplaire des octets : la pièce d'origine
    // reste intacte et peut resservir si le dossier est produit deux fois.
    const source = await PDFDocument.load(pieces[rang].octets.slice());
    const copiees = await dossier.copyPages(source, source.getPageIndices());

    let ou = position.premierBlanc;
    for (const page of copiees) {
      dossier.insertPage(ou, page);
      ou += 1;
    }
  }

  return dossier.save();
}
