/**
 * Construction de la définition d'un document PDF.
 *
 * Fonction pure : elle ne dépend d'aucune bibliothèque et ne rend rien. Elle
 * traduit une entrée de la matrice et les valeurs saisies en une structure
 * que pdfmake sait imprimer. Cela la rend vérifiable hors navigateur.
 *
 * Principes respectés :
 * - seuls les renseignements EFFECTIVEMENT saisis figurent au document ;
 * - les libellés sont bilingues, mais les VALEURS ne sont jamais traduites :
 *   l'outil met en forme, il n'invente ni ne réécrit rien ;
 * - chaque bloc est insécable, l'en-tête et le pied sont répétés.
 */

const MENTION_PIED =
  "Document généré automatiquement à partir des informations saisies par l'utilisateur, "
  + "qui en demeure seul responsable. Aucune évaluation de la sécurité n'est réalisée.";

/** Une valeur est absente si elle est vide, ou si un tableau n'a aucune ligne utile. */
export function estRenseigne(valeur) {
  if (valeur === undefined || valeur === null || valeur === '') return false;
  if (Array.isArray(valeur)) {
    return valeur.some((ligne) =>
      Object.values(ligne || {}).some((c) => c !== undefined && c !== null && c !== '')
    );
  }
  return true;
}

/**
 * Valeur telle qu'elle doit paraître au document.
 * Un choix est rendu par son libellé lisible et non par sa valeur technique.
 * Une date ISO est rendue au format courant. Aucune autre transformation :
 * le texte saisi par l'utilisateur n'est jamais réécrit ni traduit.
 */
export function valeurAffichable(definition, valeur) {
  if (definition.type === 'choix') {
    const option = (definition.options || []).find((o) => o.valeur === valeur);
    return option ? `${option.libelleFr} / ${option.libelleEn}` : String(valeur);
  }
  if (definition.type === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(String(valeur))) {
    const [a, m, j] = String(valeur).split('-');
    return `${j}/${m}/${a}`;
  }
  return String(valeur);
}

/** Libellé d'un champ, avec son unité s'il en a une. */
function libelle(definition) {
  const unite = definition.unite ? ` (${definition.unite})` : '';
  return `${definition.libelleFr}${unite}`;
}

/** Rendu d'un champ simple : libellé bilingue puis valeur. */
function blocChamp(definition, valeur) {
  return {
    unbreakable: true,
    margin: [0, 0, 0, 8],
    stack: [
      { text: libelle(definition), style: 'libelle' },
      { text: definition.libelleEn, style: 'libelleEn' },
      { text: valeurAffichable(definition, valeur), style: 'valeur' }
    ]
  };
}

/** Rendu d'un tableau : en-têtes bilingues, colonnes vides retirées. */
function blocTableau(definition, lignes) {
  const colonnes = (definition.colonnes || []).filter((colonne) =>
    lignes.some((l) => l?.[colonne.id] !== undefined && l[colonne.id] !== '')
  );
  if (colonnes.length === 0) return null;

  const entetes = colonnes.map((colonne) => ({
    style: 'enteteTableau',
    stack: [
      { text: colonne.libelleFr + (colonne.unite ? ` (${colonne.unite})` : '') },
      { text: colonne.libelleEn, style: 'enteteTableauEn' }
    ]
  }));

  const corps = lignes
    .filter((l) => Object.values(l || {}).some((c) => c !== undefined && c !== ''))
    .map((ligne) =>
      colonnes.map((colonne) => ({
        text: String(ligne[colonne.id] ?? ''),
        style: 'celluleTableau'
      }))
    );

  return {
    unbreakable: true,
    margin: [0, 0, 0, 10],
    stack: [
      { text: libelle(definition), style: 'libelle' },
      { text: definition.libelleEn, style: 'libelleEn' },
      {
        margin: [0, 4, 0, 0],
        table: {
          headerRows: 1,
          widths: colonnes.map(() => '*'),
          body: [entetes, ...corps]
        },
        layout: 'lightHorizontalLines'
      }
    ]
  };
}

/** Corps du document : sections, puis champs renseignés de chaque section. */
function construireCorps(document, champs, valeurs) {
  const corps = [];

  for (const section of document.sections || []) {
    const blocs = [];
    for (const idChamp of section.champs || []) {
      const definition = champs[idChamp];
      const valeur = valeurs[idChamp];
      if (!definition || !estRenseigne(valeur)) continue;
      if (definition.type === 'fichier') continue; // le logo va en en-tête
      const bloc = definition.type === 'tableau'
        ? blocTableau(definition, valeur)
        : blocChamp(definition, valeur);
      if (bloc) blocs.push(bloc);
    }

    // Une section sans aucun renseignement n'est pas imprimée.
    if (blocs.length === 0) continue;

    // Le titre de section reste solidaire de son premier bloc : sans cela, un
    // titre peut se retrouver seul en bas de page, son contenu passant à la
    // suivante. Les blocs suivants restent libres de couler d'une page à l'autre.
    const [premier, ...suivants] = blocs;
    corps.push({
      unbreakable: true,
      stack: [
        { text: section.titreFr, style: 'section' },
        { text: section.titreEn, style: 'sectionEn' },
        premier
      ]
    });
    if (suivants.length > 0) {
      corps.push({ stack: suivants, margin: [0, 0, 0, 6] });
    }
  }

  return corps;
}

/**
 * @param {object} document entrée de la matrice
 * @param {object} champs dictionnaire fusionné
 * @param {object} valeurs saisie de l'utilisateur
 * @param {{logo?: string}} options
 */
export function construireDefinition(document, champs, valeurs, options = {}) {
  const corps = construireCorps(document, champs, valeurs);

  return {
    pageSize: 'A4',
    pageMargins: [40, options.logo ? 96 : 76, 40, 56],
    info: { title: document.titreFr },

    header: () => ({
      margin: [40, 24, 40, 0],
      columns: [
        {
          width: '*',
          stack: [
            { text: document.titreFr, style: 'titre' },
            { text: document.titreEn, style: 'titreEn' }
          ]
        },
        options.logo
          ? { width: 90, image: options.logo, fit: [90, 45], alignment: 'right' }
          : { width: 0, text: '' }
      ]
    }),

    footer: (page, total) => ({
      margin: [40, 8, 40, 0],
      columns: [
        { width: '*', text: MENTION_PIED, style: 'pied' },
        { width: 70, text: `page ${page}/${total}`, style: 'pied', alignment: 'right' }
      ]
    }),

    content: corps.length > 0
      ? corps
      : [{ text: 'Aucun renseignement saisi pour ce document.', style: 'valeur' }],

    defaultStyle: { font: 'Roboto', fontSize: 10, lineHeight: 1.25 },

    styles: {
      titre: { fontSize: 15, bold: true },
      titreEn: { fontSize: 9, italics: true, color: '#52606d' },
      section: { fontSize: 11, bold: true, color: '#4a6b52', margin: [0, 10, 0, 0] },
      sectionEn: { fontSize: 8, italics: true, color: '#52606d', margin: [0, 0, 0, 6] },
      libelle: { fontSize: 9, bold: true },
      libelleEn: { fontSize: 8, italics: true, color: '#52606d' },
      valeur: { fontSize: 10, margin: [0, 1, 0, 0] },
      enteteTableau: { fontSize: 8, bold: true, margin: [0, 3, 0, 3] },
      enteteTableauEn: { fontSize: 7, italics: true, color: '#52606d' },
      celluleTableau: { fontSize: 9, margin: [0, 3, 0, 3] },
      pied: { fontSize: 6.5, color: '#52606d' }
    }
  };
}
