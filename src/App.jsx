export default function App() {
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
        <h2>Etat</h2>
        <p>
          Squelette initial deploye. Le formulaire et les gabarits de documents
          arrivent dans les lots suivants.
        </p>
      </section>
    </main>
  );
}
