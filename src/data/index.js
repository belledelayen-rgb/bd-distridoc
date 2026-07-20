import communs from './champs/communs.json';
import produit from './champs/produit.json';
import matiere from './champs/matiere.json';
import composition from './champs/composition.json';
import emballage from './champs/emballage.json';
import signature from './champs/signature.json';
import donnees from './champs/donnees.json';
import fabrication from './champs/fabrication.json';
import revendications from './champs/revendications.json';
import administratif from './champs/administratif.json';

import docProduit from './documents/produit.json';
import docComposition from './documents/composition.json';
import docDonnees from './documents/donnees.json';
import docFabrication from './documents/fabrication.json';
import docRevendications from './documents/revendications.json';
import docAdministratif from './documents/administratif.json';
import docAssemblage from './documents/assemblage.json';

// Dictionnaires de champs, par domaine.
// Ajouter ici tout nouveau domaine, et la ligne correspondante dans
// scripts/verifier-matrice.mjs.
export const dictionnaires = {
  communs, produit, matiere, composition, emballage,
  signature, donnees, fabrication, revendications, administratif
};

// Catalogues de documents, par famille. Le nom de la clé fait foi :
// un document doit déclarer la famille du catalogue qui le contient.
export const catalogues = {
  produit: docProduit,
  composition: docComposition,
  donnees: docDonnees,
  fabrication: docFabrication,
  revendications: docRevendications,
  administratif: docAdministratif,
  assemblage: docAssemblage
};

// Vues fusionnées.
export const champs = Object.assign({}, ...Object.values(dictionnaires));
export const documents = Object.assign({}, ...Object.values(catalogues));

/** Identifiants de champs cités par un document, dans l'ordre des sections. */
export function champsDuDocument(idDocument) {
  const doc = documents[idDocument];
  if (!doc) return [];
  return doc.sections.flatMap((section) => section.champs);
}
