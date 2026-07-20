import { catalogues } from '../data/index.js';

const LIBELLES_FAMILLES = {
  produit: 'Produit',
  composition: 'Composition et matières',
  donnees: 'Données',
  fabrication: 'Fabrication',
  revendications: 'Revendications',
  administratif: 'Administratif',
  assemblage: 'Assemblage'
};

/** Sélection des documents à produire. Repliable une fois le choix fait. */
export default function ChoixDocuments({ choisis, basculer, toutDecocher, ouvert, basculerOuvert }) {
  if (!ouvert) {
    return (
      <section className="bloc bloc-replie">
        <button type="button" className="resume-choix" onClick={basculerOuvert}>
          <span>
            <strong>{choisis.length}</strong> document{choisis.length > 1 ? 's' : ''} choisi
            {choisis.length > 1 ? 's' : ''}
          </span>
          <span className="lien-modifier">Modifier la sélection</span>
        </button>
      </section>
    );
  }

  return (
    <section className="bloc">
      <h2>Choisir les documents</h2>
      <p className="note">
        Cochez tout ce dont vous avez besoin. Les renseignements communs à
        plusieurs documents ne vous seront demandés qu&apos;une seule fois.
      </p>

      {Object.entries(catalogues).map(([famille, docs]) => (
        <div key={famille} className="famille">
          <h3>{LIBELLES_FAMILLES[famille] || famille}</h3>
          <div className="grille-documents">
          {Object.entries(docs).map(([id, doc]) => (
            <label
              key={id}
              className={choisis.includes(id) ? 'case-document coche' : 'case-document'}
            >
              <input
                type="checkbox"
                checked={choisis.includes(id)}
                onChange={() => basculer(id)}
              />
              <span className="doc-titre">
                {doc.titreFr}
                <span className="doc-en"> / {doc.titreEn}</span>
              </span>
            </label>
          ))}
          </div>
        </div>
      ))}

      {choisis.length > 0 && (
        <div className="barre-boutons">
          <button type="button" className="bouton-secondaire" onClick={basculerOuvert}>
            Passer aux renseignements
          </button>
          <button type="button" className="bouton-discret" onClick={toutDecocher}>
            Tout décocher
          </button>
        </div>
      )}
    </section>
  );
}
