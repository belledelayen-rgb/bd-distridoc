import { documents } from './data/index.js';

const FAMILLES = [
  ['produit', 'Produit'],
  ['composition', 'Composition et matières'],
  ['donnees', 'Données'],
  ['fabrication', 'Fabrication'],
  ['revendications', 'Revendications'],
  ['administratif', 'Administratif'],
  ['assemblage', 'Assemblage']
];

export default function App() {
  const parFamille = FAMILLES.map(([cle, libelle]) => [
    libelle,
    Object.entries(documents).filter(([, doc]) => doc.famille === cle)
  ]).filter(([, liste]) => liste.length > 0);

  const total = Object.keys(documents).length;

  return (
    <main className="page">
      <header className="entete">
        <h1>BD-DistriDoc</h1>
        <p className="baseline">
          Generateur de documents professionnels au format PDF.
        </p>
      </header>

      <section className="bloc">
        <h2>Principe</h2>
        <p>
          L&apos;outil met en forme les informations que vous saisissez. Il n&apos;invente
          rien, ne suppose rien et ne complete aucune donnee manquante. Il ne
          realise aucune evaluation de la securite et ne produit aucun rapport
          sur la securite du produit cosmetique.
        </p>
        <p>
          Aucune donnee n&apos;est conservee : tout reste dans votre navigateur et
          disparait a la fermeture de la page.
        </p>
      </section>

      <section className="bloc">
        <h2>Documents disponibles</h2>
        <p className="note compteur">{total} documents repartis en {parFamille.length} familles.</p>
        {parFamille.map(([libelle, liste]) => (
          <div key={libelle} className="famille">
            <h3>{libelle}</h3>
            <ul className="liste-documents">
              {liste.map(([id, doc]) => (
                <li key={id}>
                  <span className="doc-titre">{doc.titreFr}</span>
                  <span className="doc-en">{doc.titreEn}</span>
                  <span className="doc-meta">{doc.sections.length} sections</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <p className="note">
          Le formulaire de saisie arrive au lot suivant.
        </p>
      </section>
    </main>
  );
}
