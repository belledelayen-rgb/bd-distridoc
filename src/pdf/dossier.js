/**
 * Construction d'un DOSSIER : plusieurs documents réunis dans un seul PDF.
 *
 * Fonction pure, comme definition.js : elle ne dépend d'aucune bibliothèque et
 * ne rend rien, ce qui la rend vérifiable hors navigateur.
 *
 * Le corps de chaque document est produit par construireCorps(), exactement
 * celui du document produit seul : un document n'a pas deux mises en page
 * selon qu'il est téléchargé isolément ou dans un dossier.
 *
 * Le sommaire est établi par pdfmake à partir des titres marqués tocItem. Les
 * numéros de page sont donc les numéros RÉELS, calculés après mise en page.
 */

import {
  COULEURS, STYLE_DEFAUT, STYLES, construireCorps, piedDePage
} from './definition.js';

/** Ouvre le dossier : c'est sa couverture, elle passe avant le sommaire. */
const COUVERTURE = 'page_garde_dossier';

/** Ferme le dossier : elle renvoie aux documents qui précèdent. */
const CLOTURE = 'matrice_conformite';

/**
 * Ordre de parution dans le dossier.
 *
 * La page de garde ouvre, la matrice de conformité ferme, le reste conserve
 * l'ordre du catalogue. Ces deux pièces appartiennent à la même famille
 * « assemblage » : sans ce traitement, elles se suivraient à la fin, ce qui
 * placerait la couverture au milieu du dossier.
 */
export function ordonnerDossier(idsDocuments, documents) {
  const connus = idsDocuments.filter((id) => documents[id]);
  const ordreCatalogue = Object.keys(documents);
  const rang = (id) => ordreCatalogue.indexOf(id);

  const couverture = connus.filter((id) => id === COUVERTURE);
  const cloture = connus.filter((id) => id === CLOTURE);
  const corps = connus
    .filter((id) => id !== COUVERTURE && id !== CLOTURE)
    .sort((a, b) => rang(a) - rang(b));

  return { couverture: couverture[0] || null, corps, cloture: cloture[0] || null };
}

/**
 * Titre porté par l'en-tête de toutes les pages du dossier.
 * On prend le titre du dossier s'il a été saisi, à défaut le nom du produit.
 * Rien n'est inventé : sans l'un ni l'autre, un intitulé neutre est utilisé.
 */
export function titreDossier(valeurs) {
  const titre = (valeurs.dossier_titre || '').trim();
  if (titre) return titre;
  const produit = (valeurs.produit_nom || '').trim();
  if (produit) return `Dossier — ${produit}`;
  return 'Dossier';
}

/** Titre d'un document au fil du dossier, repris tel quel par le sommaire. */
function titreDeDocument(document, premier) {
  return {
    tocItem: true,
    pageBreak: premier ? undefined : 'before',
    margin: [0, 0, 0, 10],
    text: [
      { text: document.titreFr, style: 'titre' },
      { text: `  ${document.titreEn}`, style: 'titreEn' }
    ]
  };
}

/** Le sommaire lui-même : un titre, puis la table dressée par pdfmake. */
function blocSommaire(premier) {
  return [
    {
      pageBreak: premier ? undefined : 'before',
      margin: [0, 0, 0, 10],
      text: [
        { text: 'Sommaire', style: 'titre' },
        { text: '  Contents', style: 'titreEn' }
      ]
    },
    {
      toc: {
        textStyle: { fontSize: 9.5 },
        numberStyle: { bold: true, color: COULEURS.vert }
      }
    }
  ];
}

/**
 * @param {string[]} idsDocuments documents choisis
 * @param {object} documents catalogue fusionné
 * @param {object} champs dictionnaire fusionné
 * @param {object} valeurs saisie de l'utilisateur
 * @param {{logo?: string}} options
 */
export function construireDossier(idsDocuments, documents, champs, valeurs, options = {}) {
  const { couverture, corps, cloture } = ordonnerDossier(idsDocuments, documents);
  const titre = titreDossier(valeurs);
  const contenu = [];

  // La couverture ouvre le dossier, sans être annoncée au sommaire :
  // un sommaire ne se renvoie pas à la page qui le précède.
  if (couverture) {
    contenu.push(...construireCorps(documents[couverture], champs, valeurs));
  }

  contenu.push(...blocSommaire(contenu.length === 0));

  for (const id of [...corps, ...(cloture ? [cloture] : [])]) {
    contenu.push(titreDeDocument(documents[id], false));
    const sections = construireCorps(documents[id], champs, valeurs);
    contenu.push(...(sections.length > 0
      ? sections
      : [{ text: 'Aucun renseignement saisi pour ce document.', style: 'valeur' }]));
  }

  return {
    pageSize: 'A4',
    pageMargins: [38, 62, 38, 38],
    info: { title: titre },

    // L'en-tête porte le titre du DOSSIER et non celui du document courant :
    // pdfmake ne sait pas, au moment de dessiner une en-tête, quel document
    // occupe la page. Chaque document est identifié par son titre en tête,
    // et le sommaire donne la page où il commence.
    header: () => ({
      margin: [38, 20, 38, 0],
      columns: [
        { width: '*', text: titre, style: 'titre' },
        options.logo
          ? { width: 74, image: options.logo, fit: [74, 34], alignment: 'right' }
          : { width: 0, text: '' }
      ]
    }),

    footer: piedDePage,
    content: contenu,
    defaultStyle: STYLE_DEFAUT,
    styles: STYLES
  };
}
