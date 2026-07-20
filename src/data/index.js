import communs from './champs/communs.json';
import produit from './champs/produit.json';
import matiere from './champs/matiere.json';
import documents from './documents.json';

// Dictionnaires par domaine. Ajouter ici tout nouveau domaine de champs.
export const dictionnaires = { communs, produit, matiere };

// Dictionnaire fusionné : identifiant de champ -> définition.
export const champs = Object.assign({}, communs, produit, matiere);

export { documents };

/** Identifiants de champs cités par un document, dans l'ordre des sections. */
export function champsDuDocument(idDocument) {
  const doc = documents[idDocument];
  if (!doc) return [];
  return doc.sections.flatMap((section) => section.champs);
}
