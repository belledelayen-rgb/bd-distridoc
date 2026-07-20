import { propositions } from '../data/index.js';

/**
 * Tableau à lignes répétables. Chaque ligne est rendue comme une carte dont
 * les colonnes sont empilées : un tableau à huit colonnes serait impraticable
 * sur un téléphone.
 *
 * Une colonne peut déclarer un référentiel de suggestions. Le rendu utilise
 * alors une liste de propositions : elle aide à écrire la dénomination exacte
 * sans jamais empêcher de saisir autre chose.
 */
export default function ChampTableau({ id, definition, lignes, saisie }) {
  const colonnes = definition.colonnes || [];
  const listes = colonnes
    .filter((c) => c.suggestions)
    .map((c) => ({ id: `${id}-${c.id}-propositions`, entrees: propositions(c.suggestions) }));

  return (
    <div className="champ champ-tableau">
      <span className="champ-libelle">
        {definition.libelleFr}
        {definition.requis && <span className="requis" title="Renseignement requis">*</span>}
        <span className="champ-libelle-en"> / {definition.libelleEn}</span>
      </span>
      {definition.aide && <p className="champ-aide">{definition.aide}</p>}
      {lignes.length === 0 && (
        <p className="tableau-vide">Aucune ligne pour le moment.</p>
      )}

      {lignes.map((ligne, index) => (
        <div key={index} className="ligne-tableau">
          <div className="ligne-entete">
            <span className="ligne-numero">Ligne {index + 1}</span>
            <button
              type="button"
              className="bouton-discret"
              onClick={() => saisie.supprimerLigne(id, index)}
            >
              Supprimer
            </button>
          </div>
          <div className="grille-colonnes">
          {colonnes.map((colonne) => (
            <label key={colonne.id} className="colonne">
              <span className="colonne-libelle">
                {colonne.libelleFr}
                {colonne.unite && <span className="unite"> ({colonne.unite})</span>}
                <span className="champ-libelle-en"> / {colonne.libelleEn}</span>
              </span>
              <input
                type={colonne.type === 'nombre' ? 'number' : 'text'}
                list={colonne.suggestions ? `${id}-${colonne.id}-propositions` : undefined}
                value={ligne[colonne.id] ?? ''}
                onChange={(e) => saisie.modifierLigne(id, index, colonne.id, e.target.value)}
              />
            </label>
          ))}
          </div>
        </div>
      ))}

      <button
        type="button"
        className="bouton-secondaire"
        onClick={() => saisie.ajouterLigne(id, colonnes)}
      >
        Ajouter une ligne
      </button>

      {lignes.length > 0 && listes.map((liste) => (
        <datalist key={liste.id} id={liste.id}>
          {liste.entrees.map((e) => (
            <option key={e.valeur} value={e.valeur}>{e.indication}</option>
          ))}
        </datalist>
      ))}
    </div>
  );
}
