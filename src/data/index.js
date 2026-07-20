import entreprise from './champs/entreprise.json';
import produit from './champs/produit.json';
import matiere from './champs/matiere.json';
import composition from './champs/composition.json';
import emballage from './champs/emballage.json';
import signature from './champs/signature.json';
import donnees from './champs/donnees.json';
import fabrication from './champs/fabrication.json';
import revendications from './champs/revendications.json';
import administratif from './champs/administratif.json';
import fds from './champs/fds.json';
import docChamps from './champs/document.json';

import { regrouperChamps, trouverManquants, indexerDomaines } from './regles.js';

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
// L'ordre de déclaration fait l'ordre d'affichage du formulaire : on part de
// l'entreprise, on traverse le métier, on finit par la signature et le document.
export const dictionnaires = {
  entreprise, produit, matiere, composition, emballage,
  donnees, fabrication, revendications, administratif, fds,
  signature, document: docChamps
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
const indexDomaines = indexerDomaines(dictionnaires);

// Libellés lisibles des domaines de champs, pour regrouper la saisie.
export const LIBELLES_DOMAINES = {
  entreprise: 'Votre entreprise',
  produit: 'Le produit',
  matiere: 'La matière première',
  composition: 'La composition',
  emballage: "L'emballage",
  signature: 'La signature',
  donnees: 'Les données et analyses',
  fabrication: 'La fabrication',
  revendications: 'Les revendications',
  administratif: 'Les démarches administratives',
  fds: 'La fiche de données de sécurité',
  document: 'Établissement du document'
};

/** Domaine auquel appartient un champ. */
export function domaineDuChamp(idChamp) {
  return indexDomaines[idChamp];
}

/** Identifiants de champs cités par un document, dans l'ordre des sections. */
export function champsDuDocument(idDocument) {
  const doc = documents[idDocument];
  if (!doc) return [];
  return doc.sections.flatMap((section) => section.champs);
}

/** Champs des documents choisis, regroupés par domaine, avec libellés. */
export function champsRegroupes(idsDocuments) {
  return regrouperChamps(dictionnaires, documents, idsDocuments).map((g) => ({
    ...g,
    libelle: LIBELLES_DOMAINES[g.domaine] || g.domaine
  }));
}

/** Champs requis non renseignés, pour une sélection de documents. */
export function champsManquants(idsDocuments, valeurs) {
  return trouverManquants(champs, champsRegroupes(idsDocuments), valeurs);
}
