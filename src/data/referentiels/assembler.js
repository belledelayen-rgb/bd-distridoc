/**
 * Assemblage des référentiels en listes de propositions.
 *
 * Fonctions PURES : elles ne lisent aucun fichier. Le navigateur et le script
 * de vérification hors navigateur les appellent toutes les deux, ce qui garantit
 * que les deux voient exactement les mêmes référentiels.
 *
 * Une proposition porte une VALEUR (ce qui sera écrit dans le champ) et une
 * INDICATION (ce qui aide à choisir la bonne entrée, jamais écrite).
 */

/** Assemble les indications sans répétition, dans l'ordre de rencontre. */
function joindre(valeurs) {
  return [...new Set(valeurs)].join(', ');
}

/** Les 81 entrées de l'annexe III : la valeur est la dénomination déclarée. */
export function assemblerAllergenes(referentiel) {
  return referentiel.entrees.map((e) => {
    const type = referentiel.types[e.type] || e.type;
    const detail = e.precision ? `${type} — ${e.precision}` : type;
    return { valeur: e.nom, indication: `n° ${e.n} · ${detail}` };
  });
}

/**
 * Correspondances entre noms courants et dénominations INCI.
 *
 * @param {object[]} catalogues fichiers d'ingrédients, un par catégorie
 * @param {'inci'|'nom'} propose ce que la proposition doit écrire dans le champ
 *
 * Un même INCI peut porter plusieurs noms courants (« Avocat » et « Huile
 * d'avocat »), et deux noms rares portent deux INCI selon l'usage (« Carotte »,
 * « Dioxyde de titane »). Dans les deux cas les entrées sont REGROUPÉES : une
 * liste de propositions ne peut pas offrir deux fois la même valeur, et
 * l'indication montre alors toutes les correspondances.
 */
export function assemblerIngredients(catalogues, propose) {
  const autre = propose === 'inci' ? 'nom' : 'inci';
  const groupes = new Map();

  for (const catalogue of catalogues) {
    for (const entree of catalogue.entrees) {
      const cle = entree[propose];
      if (!groupes.has(cle)) groupes.set(cle, { equivalents: [], categories: [] });
      const groupe = groupes.get(cle);
      groupe.equivalents.push(entree[autre]);
      groupe.categories.push(catalogue.libelleFr);
    }
  }

  return [...groupes.entries()]
    .map(([valeur, groupe]) => ({
      valeur,
      indication: `${joindre(groupe.equivalents)} · ${joindre(groupe.categories)}`
    }))
    .sort((a, b) => a.valeur.localeCompare(b.valeur, 'fr'));
}

/**
 * Tous les référentiels, prêts à l'emploi.
 * Deux référentiels d'ingrédients sont construits à partir des MÊMES données,
 * selon le sens de saisie : une colonne « Nom INCI » propose l'INCI, une
 * colonne « Nom commun » propose le nom courant.
 */
export function assemblerReferentiels(allergenes, ingredients) {
  return {
    allergenes: { entrees: assemblerAllergenes(allergenes) },
    ingredients_inci: { entrees: assemblerIngredients(ingredients, 'inci') },
    ingredients_nom: { entrees: assemblerIngredients(ingredients, 'nom') }
  };
}
