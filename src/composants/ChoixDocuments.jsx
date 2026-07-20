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

/** Sélection des documents à produire. */
export default function ChoixDocuments({ choisis, basculer, toutDecocher }) {
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
          {Object.entries(docs).map(([id, doc]) => (
            <label key={id} className="case-document">
              <input
                type="checkbox"
                checked={choisis.includes(id)}
                onChange={() => basculer(id)}
              />
              <span>
                <span className="doc-titre">{doc.titreFr}</span>
                <span className="doc-en">{doc.titreEn}</span>
              </span>
            </label>
          ))}
        </div>
      ))}

      {choisis.length > 0 && (
        <button type="button" className="bouton-discret" onClick={toutDecocher}>
          Tout décocher
        </button>
      )}
    </section>
  );
}
