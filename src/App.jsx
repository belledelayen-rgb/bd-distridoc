import { useState, useRef } from 'react';
import { useSaisie } from './etat/useSaisie.js';
import { telechargerBrouillon, lireBrouillon } from './brouillon.js';
import { documents } from './data/index.js';
import ChoixDocuments from './composants/ChoixDocuments.jsx';
import Formulaire from './composants/Formulaire.jsx';

const ETAPES = [
  { cle: 'choix', libelle: 'Choisir les documents' },
  { cle: 'saisie', libelle: 'Renseigner' }
];

export default function App() {
  const [documentsChoisis, setDocumentsChoisis] = useState([]);
  const [etape, setEtape] = useState('choix');
  const [message, setMessage] = useState(null);
  // Les pièces jointes vivent HORS de la saisie : le brouillon sérialise
  // « valeurs » en entier, et un PDF de plusieurs mégaoctets y deviendrait un
  // fichier JSON illisible et démesuré.
  const [piecesJointes, setPiecesJointes] = useState([]);
  const champFichier = useRef(null);
  const saisie = useSaisie();

  const basculer = (id) => {
    setDocumentsChoisis((liste) =>
      liste.includes(id) ? liste.filter((x) => x !== id) : [...liste, id]
    );
  };

  const ajouterPiece = (piece) => setPiecesJointes((liste) => [...liste, piece]);

  const retirerPiece = (id) => {
    setPiecesJointes((liste) => liste.filter((piece) => piece.id !== id));
  };

  const allerA = (cle) => {
    setEtape(cle);
    window.scrollTo({ top: 0 });
  };

  const importer = async (evenement) => {
    const fichier = evenement.target.files?.[0];
    if (!fichier) return;
    try {
      const { documentsChoisis: docs, valeurs } = await lireBrouillon(fichier);
      setDocumentsChoisis(docs);
      saisie.remplacerTout(valeurs);
      setMessage({
        type: 'ok',
        texte: piecesJointes.length > 0
          ? 'Brouillon repris. Vos pièces jointes ont été conservées.'
          : 'Brouillon repris. Les pièces jointes ne sont pas enregistrées dans un brouillon : redéposez-les si besoin.'
      });
      allerA(docs.length > 0 ? 'saisie' : 'choix');
    } catch (erreur) {
      setMessage({ type: 'erreur', texte: erreur.message });
    }
    evenement.target.value = '';
  };

  const recommencer = () => {
    if (!window.confirm('Effacer toute la saisie en cours ?')) return;
    setDocumentsChoisis([]);
    saisie.toutEffacer();
    setPiecesJointes([]);
    setMessage(null);
    allerA('choix');
  };

  return (
    <main className="page">
      <header className="entete">
        <h1>BD-DistriDoc</h1>
        <p className="baseline">
          Générateur de documents professionnels au format PDF, pour les
          produits cosmétiques.
        </p>
      </header>

      <nav className="fil-etapes" aria-label="Étapes">
        {ETAPES.map((e, index) => {
          const actuelle = e.cle === etape;
          const accessible = e.cle === 'choix' || documentsChoisis.length > 0;
          return (
            <button
              key={e.cle}
              type="button"
              className={actuelle ? 'etape actuelle' : 'etape'}
              disabled={!accessible}
              aria-current={actuelle ? 'step' : undefined}
              onClick={() => allerA(e.cle)}
            >
              <span className="etape-numero">{index + 1}</span>
              {e.libelle}
            </button>
          );
        })}
      </nav>

      {message && (
        <p className={message.type === 'ok' ? 'message-ok' : 'message-erreur'}>
          {message.texte}
        </p>
      )}

      {etape === 'choix' && (
        <>
          <section className="bloc">
            <h2>Principe</h2>
            <p>
              Les documents proposés ici concernent les{' '}
              <strong>produits cosmétiques</strong>. Les catégories détergents
              et bougies sont prévues, elles ne sont pas encore disponibles.
            </p>
            <p>
              L&apos;outil met en forme les informations que vous saisissez. Il n&apos;invente
              rien, ne suppose rien et ne complète aucune donnée manquante. Il ne
              réalise aucune évaluation de la sécurité et ne produit aucun rapport
              sur la sécurité du produit cosmétique.
            </p>
            <p>
              <strong>Aucune donnée n&apos;est conservée.</strong> Tout reste dans votre
              navigateur et disparaît à la fermeture de la page. Rien n&apos;est envoyé
              à un serveur. Si vous souhaitez reprendre votre saisie plus tard,
              enregistrez un brouillon sur votre appareil.
            </p>
          </section>

          <ChoixDocuments
            choisis={documentsChoisis}
            basculer={basculer}
            toutDecocher={() => setDocumentsChoisis([])}
            continuer={() => allerA('saisie')}
          />

          <section className="bloc">
            <h2>Reprendre un brouillon</h2>
            <p className="note">
              Si vous avez déjà enregistré un brouillon sur votre appareil, vous
              pouvez repartir de là où vous en étiez.
            </p>
            <button
              type="button"
              className="bouton-secondaire"
              onClick={() => champFichier.current?.click()}
            >
              Choisir un fichier de brouillon
            </button>
          </section>
        </>
      )}

      {etape === 'saisie' && (
        <>
          <section className="bloc bloc-rappel">
            <button type="button" className="retour" onClick={() => allerA('choix')}>
              Modifier la sélection
            </button>
            <p className="rappel-liste">
              {documentsChoisis.map((id) => documents[id].titreFr).join(' · ')}
            </p>
          </section>

          <Formulaire
            documentsChoisis={documentsChoisis}
            saisie={saisie}
            pieces={piecesJointes}
            ajouterPiece={ajouterPiece}
            retirerPiece={retirerPiece}
          />

          <section className="bloc">
            <h2>Brouillon</h2>
            <p className="note">
              Le brouillon est un fichier enregistré sur votre appareil. Il ne passe
              par aucun serveur. Il retient vos renseignements, mais pas vos
              pièces jointes : celles-ci seront à redéposer.
            </p>
            <div className="barre-boutons">
              <button
                type="button"
                className="bouton-secondaire"
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
              <button type="button" className="bouton-discret" onClick={recommencer}>
                Tout effacer
              </button>
            </div>
          </section>
        </>
      )}

      <input
        ref={champFichier}
        type="file"
        accept="application/json,.json"
        onChange={importer}
        hidden
      />
    </main>
  );
}
