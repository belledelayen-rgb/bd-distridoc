const TYPES_CONNUS = ['texte', 'texteCourt', 'texteLong', 'nombre', 'date', 'booleen', 'choix', 'tableau', 'fichier'];

/**
 * Contrôle de cohérence de la matrice de documents.
 * Fonction pure : elle ne lit aucun fichier et ne dépend d'aucune saisie utilisateur.
 * @param {Record<string, object>} dictionnaires domaine -> dictionnaire de champs
 * @param {Record<string, object>} catalogues famille -> catalogue de documents
 * @returns {{valide: boolean, erreurs: string[], avertissements: string[], statistiques: object}}
 */
export function validerMatriceAvec(dictionnaires, catalogues) {
  const erreurs = [];
  const avertissements = [];

  // 1. Un identifiant de champ ne doit exister que dans un seul dictionnaire.
  const champs = {};
  const origine = new Map();
  for (const [domaine, dico] of Object.entries(dictionnaires)) {
    for (const [id, def] of Object.entries(dico)) {
      if (origine.has(id)) {
        erreurs.push(`Champ « ${id} » défini deux fois : ${origine.get(id)} et ${domaine}.`);
      } else {
        origine.set(id, domaine);
      }
      champs[id] = def;
    }
  }

  // 2. Chaque définition de champ doit être exploitable.
  for (const [id, def] of Object.entries(champs)) {
    if (!def.libelleFr) erreurs.push(`Champ « ${id} » : libellé français manquant.`);
    if (!def.libelleEn) erreurs.push(`Champ « ${id} » : libellé anglais manquant.`);
    if (!TYPES_CONNUS.includes(def.type)) {
      erreurs.push(`Champ « ${id} » : type « ${def.type} » inconnu.`);
    }
    if (def.type === 'choix' && !(def.options || []).length) {
      erreurs.push(`Champ « ${id} » : type « choix » sans options.`);
    }
    if (def.type === 'tableau' && !(def.colonnes || []).length) {
      erreurs.push(`Champ « ${id} » : type « tableau » sans colonnes.`);
    }
    for (const option of def.options || []) {
      if (!option.valeur) erreurs.push(`Champ « ${id} » : une option n'a pas de valeur.`);
      if (!option.libelleFr || !option.libelleEn) {
        erreurs.push(`Champ « ${id} », option « ${option.valeur} » : libellé bilingue incomplet.`);
      }
    }
    for (const colonne of def.colonnes || []) {
      if (!colonne.id) erreurs.push(`Champ « ${id} » : une colonne n'a pas d'identifiant.`);
      if (!colonne.libelleFr || !colonne.libelleEn) {
        erreurs.push(`Champ « ${id} », colonne « ${colonne.id} » : libellé bilingue incomplet.`);
      }
    }
  }

  // 3. Un identifiant de document ne doit exister que dans un seul catalogue.
  const documents = {};
  const provenance = new Map();
  for (const [fichier, catalogue] of Object.entries(catalogues)) {
    for (const [idDoc, doc] of Object.entries(catalogue)) {
      if (provenance.has(idDoc)) {
        erreurs.push(`Document « ${idDoc} » défini deux fois : ${provenance.get(idDoc)} et ${fichier}.`);
      } else {
        provenance.set(idDoc, fichier);
      }
      // Le fichier porte le nom d'une famille : la famille déclarée doit correspondre.
      if (doc.famille && doc.famille !== fichier) {
        erreurs.push(`Document « ${idDoc} » : famille « ${doc.famille} » alors qu'il est rangé dans ${fichier}.`);
      }
      documents[idDoc] = doc;
    }
  }

  // 4. Chaque document doit être complet et ne citer que des champs existants.
  const cites = new Set();
  for (const [idDoc, doc] of Object.entries(documents)) {
    if (!doc.titreFr || !doc.titreEn) {
      erreurs.push(`Document « ${idDoc} » : titre bilingue incomplet.`);
    }
    if (!doc.famille) erreurs.push(`Document « ${idDoc} » : famille manquante.`);
    if (!(doc.sections || []).length) erreurs.push(`Document « ${idDoc} » : aucune section.`);

    const dansLeDocument = new Set();
    for (const section of doc.sections || []) {
      if (!section.titreFr || !section.titreEn) {
        erreurs.push(`Document « ${idDoc} » : section au titre bilingue incomplet.`);
      }
      for (const idChamp of section.champs || []) {
        if (!champs[idChamp]) {
          erreurs.push(`Document « ${idDoc} » : champ inconnu « ${idChamp} ».`);
        }
        if (dansLeDocument.has(idChamp)) {
          erreurs.push(`Document « ${idDoc} » : champ « ${idChamp} » cité deux fois.`);
        }
        dansLeDocument.add(idChamp);
        cites.add(idChamp);
      }
    }
  }

  // 5. Un champ défini mais jamais cité serait du code mort.
  for (const id of Object.keys(champs)) {
    if (!cites.has(id)) {
      avertissements.push(`Champ « ${id} » défini mais cité par aucun document.`);
    }
  }

  return {
    valide: erreurs.length === 0,
    erreurs,
    avertissements,
    statistiques: {
      champs: Object.keys(champs).length,
      champsCites: cites.size,
      documents: Object.keys(documents).length,
      catalogues: Object.keys(catalogues).length
    }
  };
}

/** Index inverse : identifiant de champ -> domaine qui le définit. */
export function indexerDomaines(dictionnaires) {
  const index = {};
  for (const [domaine, dico] of Object.entries(dictionnaires)) {
    for (const id of Object.keys(dico)) index[id] = domaine;
  }
  return index;
}

/**
 * Union ordonnée des champs exigés par plusieurs documents, regroupés par
 * domaine. Un champ partagé par plusieurs documents n'apparaît qu'une fois :
 * c'est ce qui évite de redemander deux fois le même renseignement.
 */
export function regrouperChamps(dictionnaires, documents, idsDocuments) {
  const domaines = indexerDomaines(dictionnaires);
  const vus = new Set();
  const parDomaine = new Map();

  for (const idDoc of idsDocuments) {
    const doc = documents[idDoc];
    if (!doc) continue;
    for (const section of doc.sections || []) {
      for (const idChamp of section.champs || []) {
        if (vus.has(idChamp)) continue;
        vus.add(idChamp);
        const domaine = domaines[idChamp];
        if (!parDomaine.has(domaine)) parDomaine.set(domaine, []);
        parDomaine.get(domaine).push(idChamp);
      }
    }
  }

  // Ordre d'affichage : celui de la déclaration des dictionnaires.
  return Object.keys(dictionnaires)
    .filter((domaine) => parDomaine.has(domaine))
    .map((domaine) => ({ domaine, champs: parDomaine.get(domaine) }));
}

/** Un renseignement est manquant s'il est requis et vide. */
export function estVide(valeur) {
  if (valeur === undefined || valeur === null || valeur === '') return true;
  if (Array.isArray(valeur) && valeur.length === 0) return true;
  return false;
}

/** Identifiants des champs requis non renseignés. */
export function trouverManquants(champs, groupes, valeurs) {
  const manquants = [];
  for (const groupe of groupes) {
    for (const id of groupe.champs) {
      if (champs[id]?.requis && estVide(valeurs[id])) manquants.push(id);
    }
  }
  return manquants;
}
