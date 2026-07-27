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
 * - une section n'est jamais coupée entre deux pages ;
 * - l'en-tête et le pied sont répétés, la numérotation est « page x/y ».
 */

export const COULEURS = {
  encre: '#2b2a28',
  discret: '#6b665e',
  vert: '#2e6b4f',
  vertClair: '#e6efe8',
  ambre: '#c8763c',
  ambreClair: '#faf1e8',
  filet: '#d9d2c5'
};

export const MENTION_PIED =
  "Généré automatiquement à partir des seules informations saisies par l'utilisateur, "
  + "qui en demeure responsable. Aucune évaluation de la sécurité n'est réalisée.";

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

/**
 * Libellé bilingue en TEXTE PUR, avec l'unité s'il y en a une.
 * Source de vérité unique : le PDF et le Word s'en servent tous les deux, afin
 * qu'un même champ ne porte jamais deux libellés selon le format demandé.
 */
export function libelleTexte(definition) {
  const unite = definition.unite ? ` (${definition.unite})` : '';
  return { fr: definition.libelleFr + unite, en: definition.libelleEn };
}

/** Libellé bilingue sur une seule ligne, mis en forme pour le PDF. */
export function libelleBilingue(definition) {
  const { fr, en } = libelleTexte(definition);
  return [
    { text: fr, bold: true },
    { text: ` / ${en}`, italics: true, color: COULEURS.discret }
  ];
}

/** Disposition compacte : filets horizontaux fins, aucune bordure verticale. */
const DISPOSITION_FICHE = {
  hLineWidth: (i, noeud) => (i === 0 || i === noeud.table.body.length ? 0 : 0.4),
  vLineWidth: () => 0,
  hLineColor: () => COULEURS.filet,
  paddingLeft: () => 0,
  paddingRight: () => 4,
  paddingTop: () => 3,
  paddingBottom: () => 3
};

/** Disposition d'un tableau de données : en-tête ambré, lignes alternées. */
const DISPOSITION_TABLEAU = {
  hLineWidth: (i) => (i <= 1 ? 0.6 : 0.3),
  vLineWidth: () => 0,
  hLineColor: (i) => (i <= 1 ? COULEURS.ambre : COULEURS.filet),
  fillColor: (i) => (i === 0 ? COULEURS.ambreClair : null),
  paddingLeft: () => 4,
  paddingRight: () => 4,
  paddingTop: () => 2.5,
  paddingBottom: () => 2.5
};

/** Tableau de données : en-têtes bilingues, colonnes entièrement vides retirées. */
function blocTableau(definition, lignes) {
  const colonnes = (definition.colonnes || []).filter((colonne) =>
    lignes.some((l) => l?.[colonne.id] !== undefined && l[colonne.id] !== '')
  );
  if (colonnes.length === 0) return null;

  const entetes = colonnes.map((colonne) => ({
    style: 'enteteTableau',
    text: [
      { text: colonne.libelleFr + (colonne.unite ? ` (${colonne.unite})` : '') },
      { text: ` / ${colonne.libelleEn}`, italics: true, color: COULEURS.discret }
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
    margin: [0, 4, 0, 6],
    stack: [
      { text: libelleBilingue(definition), style: 'libelle', margin: [0, 0, 0, 3] },
      {
        table: { headerRows: 1, widths: colonnes.map(() => '*'), body: [entetes, ...corps] },
        layout: DISPOSITION_TABLEAU
      }
    ]
  };
}

/**
 * Corps d'une section : les champs simples sont réunis dans une fiche à deux
 * colonnes, bien plus compacte qu'un empilement. Les tableaux, qui ont besoin
 * de toute la largeur, sont placés à la suite.
 */
function contenuSection(section, champs, valeurs) {
  const lignesFiche = [];
  const tableaux = [];

  for (const idChamp of section.champs || []) {
    const definition = champs[idChamp];
    const valeur = valeurs[idChamp];
    if (!definition || !estRenseigne(valeur)) continue;
    if (definition.type === 'fichier') continue; // le logo va en en-tête

    if (definition.type === 'tableau') {
      const bloc = blocTableau(definition, valeur);
      if (bloc) tableaux.push(bloc);
    } else {
      lignesFiche.push([
        { text: libelleBilingue(definition), style: 'libelle' },
        { text: valeurAffichable(definition, valeur), style: 'valeur' }
      ]);
    }
  }

  const contenu = [];
  if (lignesFiche.length > 0) {
    contenu.push({
      margin: [0, 2, 0, 4],
      table: { widths: [165, '*'], body: lignesFiche },
      layout: DISPOSITION_FICHE
    });
  }
  contenu.push(...tableaux);
  return contenu;
}

/** Bandeau de titre de section. */
function bandeauSection(section) {
  return {
    margin: [0, 0, 0, 0],
    table: {
      widths: ['*'],
      body: [[{
        border: [false, false, false, false],
        fillColor: COULEURS.vertClair,
        margin: [6, 3, 6, 3],
        text: [
          { text: section.titreFr, bold: true, fontSize: 9.5, color: COULEURS.vert },
          { text: `  ${section.titreEn}`, italics: true, fontSize: 7.5, color: COULEURS.discret }
        ]
      }]]
    },
    layout: 'noBorders'
  };
}

/**
 * Corps d'un document : la suite de ses sections renseignées.
 * Exporté pour que le dossier fusionné réutilise exactement la même mise en
 * page que le document produit seul.
 */
export function construireCorps(document, champs, valeurs) {
  const corps = [];

  for (const section of document.sections || []) {
    const contenu = contenuSection(section, champs, valeurs);
    if (contenu.length === 0) continue; // section sans renseignement : non imprimée

    // La section entière est insécable : elle ne sera jamais coupée entre
    // deux pages. Si elle excède une page complète, pdfmake la reporte.
    corps.push({
      unbreakable: true,
      margin: [0, 0, 0, 9],
      stack: [bandeauSection(section), ...contenu]
    });
  }

  return corps;
}

/** Style de base et jeu de styles, communs au document seul et au dossier. */
export const STYLE_DEFAUT = {
  font: 'Roboto', fontSize: 9, lineHeight: 1.15, color: COULEURS.encre
};

export const STYLES = {
  titre: { fontSize: 14, bold: true, color: COULEURS.vert },
  titreEn: { fontSize: 8, italics: true, color: COULEURS.discret },
  libelle: { fontSize: 8 },
  valeur: { fontSize: 9 },
  enteteTableau: { fontSize: 7.5, bold: true, color: COULEURS.encre },
  celluleTableau: { fontSize: 8.5 },
  pied: { fontSize: 6, color: COULEURS.discret }
};

/** Pied de page répété : mention unique à gauche, numérotation à droite. */
export function piedDePage(page, total) {
  return {
    margin: [38, 4, 38, 0],
    columns: [
      { width: '*', text: MENTION_PIED, style: 'pied' },
      { width: 46, text: `page ${page}/${total}`, style: 'pied', alignment: 'right' }
    ]
  };
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
    pageMargins: [38, 62, 38, 38],
    info: { title: document.titreFr },

    header: () => ({
      margin: [38, 20, 38, 0],
      columns: [
        {
          width: '*',
          stack: [
            { text: document.titreFr, style: 'titre' },
            { text: document.titreEn, style: 'titreEn' }
          ]
        },
        options.logo
          ? { width: 74, image: options.logo, fit: [74, 34], alignment: 'right' }
          : { width: 0, text: '' }
      ]
    }),

    footer: piedDePage,

    content: corps.length > 0
      ? corps
      : [{ text: 'Aucun renseignement saisi pour ce document.', style: 'valeur' }],

    defaultStyle: STYLE_DEFAUT,
    styles: STYLES
  };
}
