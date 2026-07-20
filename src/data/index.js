import communs from './champs/communs.json';
import produit from './champs/produit.json';
import matiere from './champs/matiere.json';
import composition from './champs/composition.json';
import emballage from './champs/emballage.json';
import signature from './champs/signature.json';
import donnees from './champs/donnees.json';
import fabrication from './champs/fabrication.json';
import documents from './documents.json';

// Dictionnaires par domaine. Ajouter ici tout nouveau domaine de champs,
// et la ligne correspondante dans scripts/verifier-matrice.mjs.
export const dictionnaires = { communs, produit, matiere, composition, emballage, signature, donnees, fabrication };

// Dictionnaire fusionné : identifiant de champ -> définition.
export const champs = Object.assign({}, ...Object.values(dictionnaires));

export { documents };

/** Identifiants de champs cités par un document, dans l'ordre des sections. */
export function champsDuDocument(idDocument) {
  const doc = documents[idDocument];
  if (!doc) return [];
  return doc.sections.flatMap((section) => section.champs);
}
