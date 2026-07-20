/**
 * Tableau à lignes répétables. Chaque ligne est rendue comme une carte dont
 * les colonnes sont empilées : un tableau à huit colonnes serait impraticable
 * sur un téléphone.
 */
export default function ChampTableau({ id, definition, lignes, saisie }) {
  const colonnes = definition.colonnes || [];

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
    </div>
  );
}
