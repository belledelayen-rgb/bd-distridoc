import { useState, useRef } from 'react';
import { useSaisie } from './etat/useSaisie.js';
import { telechargerBrouillon, lireBrouillon } from './brouillon.js';
import ChoixDocuments from './composants/ChoixDocuments.jsx';
import Formulaire from './composants/Formulaire.jsx';

export default function App() {
  const [documentsChoisis, setDocumentsChoisis] = useState([]);
  const [message, setMessage] = useState(null);
  const champFichier = useRef(null);
  const saisie = useSaisie();

  const basculer = (id) => {
    setDocumentsChoisis((liste) =>
      liste.includes(id) ? liste.filter((x) => x !== id) : [...liste, id]
    );
  };

  const importer = async (evenement) => {
    const fichier = evenement.target.files?.[0];
    if (!fichier) return;
    try {
      const { documentsChoisis: docs, valeurs } = await lireBrouillon(fichier);
      setDocumentsChoisis(docs);
      saisie.remplacerTout(valeurs);
      setMessage({ type: 'ok', texte: 'Brouillon repris.' });
    } catch (erreur) {
      setMessage({ type: 'erreur', texte: erreur.message });
    }
    evenement.target.value = '';
  };

  const recommencer = () => {
    if (!window.confirm('Effacer toute la saisie en cours ?')) return;
    setDocumentsChoisis([]);
    saisie.toutEffacer();
    setMessage(null);
  };

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
          <strong>Aucune donnee n&apos;est conservee.</strong> Tout reste dans votre
          navigateur et disparait a la fermeture de la page. Rien n&apos;est envoye
          a un serveur. Si vous souhaitez reprendre votre saisie plus tard,
          enregistrez un brouillon sur votre appareil.
        </p>
      </section>

      <ChoixDocuments
        choisis={documentsChoisis}
        basculer={basculer}
        toutDecocher={() => setDocumentsChoisis([])}
      />

      {documentsChoisis.length > 0 && (
        <Formulaire documentsChoisis={documentsChoisis} saisie={saisie} />
      )}

      <section className="bloc">
        <h2>Brouillon</h2>
        <p className="note">
          Le brouillon est un fichier enregistre sur votre appareil. Il ne passe
          par aucun serveur.
        </p>
        {message && (
          <p className={message.type === 'ok' ? 'message-ok' : 'message-erreur'}>
            {message.texte}
          </p>
        )}
        <div className="barre-boutons">
          <button
            type="button"
            className="bouton-secondaire"
            disabled={documentsChoisis.length === 0}
            onClick={() => telechargerBrouillon(documentsChoisis, saisie.valeurs)}
          >
            Enregistrer mon brouillon
          </button>
          <button
            type="button"
            className="bouton-secondaire"
            onClick={() => champFichier.current?.click()}
          >
            Reprendre un brouillon
          </button>
          <input
            ref={champFichier}
            type="file"
            accept="application/json,.json"
            onChange={importer}
            hidden
          />
          <button type="button" className="bouton-discret" onClick={recommencer}>
            Tout effacer
          </button>
        </div>
      </section>
    </main>
  );
}
