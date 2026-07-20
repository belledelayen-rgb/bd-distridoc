import { documents } from './data/index.js';

const FAMILLES = {
  produit: 'Produit',
  composition: 'Composition et matières',
  donnees: 'Données',
  fabrication: 'Fabrication',
  revendications: 'Revendications',
  administratif: 'Administratif',
  assemblage: 'Assemblage'
};

export default function App() {
  const liste = Object.entries(documents);

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
        <ul className="liste-documents">
          {liste.map(([id, doc]) => (
            <li key={id}>
              <span className="doc-titre">{doc.titreFr}</span>
              <span className="doc-meta">
                {FAMILLES[doc.famille] || doc.famille} · {doc.sections.length} sections
              </span>
              <span className="doc-en">{doc.titreEn}</span>
            </li>
          ))}
        </ul>
        <p className="note">
          Le formulaire de saisie arrive au lot suivant. D&apos;autres documents
          viendront completer ce catalogue.
        </p>
      </section>
    </main>
  );
}
