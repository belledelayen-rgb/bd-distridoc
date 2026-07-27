/**
 * Construction de la structure d'un document Word.
 *
 * Fonction pure, sur le modèle de src/pdf/definition.js : elle ne dépend
 * d'aucune bibliothèque et ne rend rien. Elle traduit une entrée de la matrice
 * et les valeurs saisies en une structure neutre, que src/word/generer-word.js
 * transforme ensuite en fichier .docx. Cela la rend vérifiable hors navigateur.
 *
 * Les règles de contenu sont RIGOUREUSEMENT CELLES DU PDF, et les fonctions
 * qui les portent sont importées plutôt que réécrites :
 * - seuls les renseignements effectivement saisis figurent au document ;
 * - une section sans aucun renseignement n'est pas imprimée ;
 * - une colonne de tableau entièrement vide est retirée ;
 * - les libellés sont bilingues, les valeurs ne sont jamais traduites.
 */

import {
  estRenseigne,
  valeurAffichable,
  libelleTexte,
  MENTION_PIED
} from '../pdf/definition.js';

/** Tableau de données : en-têtes bilingues, colonnes entièrement vides retirées. */
function structureTableau(definition, lignes) {
  const colonnes = (definition.colonnes || []).filter((colonne) =>
    lignes.some((l) => l?.[colonne.id] !== undefined && l[colonne.id] !== '')
  );
  if (colonnes.length === 0) return null;

  const utiles = lignes.filter(
    (l) => Object.values(l || {}).some((c) => c !== undefined && c !== '')
  );

  return {
    ...libelleTexte(definition),
    colonnes: colonnes.map((colonne) => ({
      fr: colonne.libelleFr + (colonne.unite ? ` (${colonne.unite})` : ''),
      en: colonne.libelleEn
    })),
    lignes: utiles.map((ligne) =>
      colonnes.map((colonne) => String(ligne[colonne.id] ?? ''))
    )
  };
}

/** Contenu d'une section : les champs simples d'un côté, les tableaux de l'autre. */
function structureSection(section, champs, valeurs) {
  const fiche = [];
  const tableaux = [];

  for (const idChamp of section.champs || []) {
    const definition = champs[idChamp];
    const valeur = valeurs[idChamp];
    if (!definition || !estRenseigne(valeur)) continue;
    if (definition.type === 'fichier') continue; // le logo ne va pas dans le corps

    if (definition.type === 'tableau') {
      const tableau = structureTableau(definition, valeur);
      if (tableau) tableaux.push(tableau);
    } else {
      fiche.push({
        ...libelleTexte(definition),
        valeur: valeurAffichable(definition, valeur)
      });
    }
  }

  if (fiche.length === 0 && tableaux.length === 0) return null;
  return { titreFr: section.titreFr, titreEn: section.titreEn, fiche, tableaux };
}

/**
 * Structure complète d'un document.
 *
 * @param {object} document entrée de la matrice
 * @param {object} champs dictionnaire fusionné
 * @param {object} valeurs saisie de l'utilisateur
 * @returns {{titreFr: string, titreEn: string, sections: object[], mention: string}}
 */
export function construireStructure(document, champs, valeurs) {
  const sections = [];

  for (const section of document.sections || []) {
    const contenu = structureSection(section, champs, valeurs);
    if (contenu) sections.push(contenu);
  }

  return {
    titreFr: document.titreFr,
    titreEn: document.titreEn,
    sections,
    mention: MENTION_PIED
  };
}
