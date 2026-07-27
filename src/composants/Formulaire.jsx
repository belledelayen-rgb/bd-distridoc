import { useState } from 'react';
import { champs, documents, champsRegroupes, champsManquants } from '../data/index.js';
import { telechargerDocument, telechargerDossier } from '../pdf/generer.js';
import { telechargerWord } from '../word/generer-word.js';
import Champ from './Champ.jsx';
import PiecesJointes from './PiecesJointes.jsx';

/** Repère interne du bouton « dossier », distinct de tout identifiant de document. */
const DOSSIER = '__dossier__';

/** Formulaire construit à partir des documents choisis. */
export default function Formulaire({
  documentsChoisis, saisie, pieces = [], ajouterPiece, retirerPiece
}) {
  const [enCours, setEnCours] = useState(null);
  // Le PDF reste le format par défaut : mise en page définitive, dossier fusionné,
  // pièces jointes. Le Word répond au seul besoin de retoucher un document.
  const [format, setFormat] = useState('pdf');
  const groupes = champsRegroupes(documentsChoisis);
  const manquants = champsManquants(documentsChoisis, saisie.valeurs);
  const total = groupes.reduce((n, g) => n + g.champs.length, 0);
  const requis = groupes.reduce(
    (n, g) => n + g.champs.filter((id) => champs[id].requis).length, 0
  );
  const faits = requis - manquants.length;
  const avancement = requis === 0 ? 100 : Math.round((faits / requis) * 100);

  // Le dossier n'a de sens qu'à partir de deux pièces à réunir : plusieurs
  // documents, ou bien un seul document accompagné d'au moins une pièce jointe.
  const dossierPossible = documentsChoisis.length + pieces.length > 1;
  const nbDocuments = documentsChoisis.length;
  const resume = [
    `${nbDocuments} ${nbDocuments > 1 ? 'documents' : 'document'}`,
    pieces.length > 0
      ? `${pieces.length} ${pieces.length > 1 ? 'pièces jointes' : 'pièce jointe'}`
      : null
  ].filter(Boolean).join(' et ');

  const produire = async (idDoc) => {
    setEnCours(idDoc);
    const options = { logo: saisie.valeurs.demandeur_logo || undefined };
    try {
      if (format === 'word') {
        await telechargerWord(documents[idDoc], champs, saisie.valeurs, options);
      } else {
        await telechargerDocument(documents[idDoc], champs, saisie.valeurs, options);
      }
    } finally {
      setEnCours(null);
    }
  };

  const produireDossier = async () => {
    setEnCours(DOSSIER);
    try {
      await telechargerDossier(documentsChoisis, documents, champs, saisie.valeurs, {
        logo: saisie.valeurs.demandeur_logo || undefined,
        pieces
      });
    } finally {
      setEnCours(null);
    }
  };

  return (
    <section className="bloc">
      <h2>Renseignements</h2>

      <div className="avancement">
        <div className="avancement-barre">
          <div className="avancement-fait" style={{ width: `${avancement}%` }} />
        </div>
        <p className="avancement-texte">
          {manquants.length === 0
            ? `Les ${requis} renseignements requis sont complétés.`
            : `${faits} sur ${requis} renseignements requis`}
        </p>
      </div>

      <p className="note">
        {total} renseignements en tout, dont {requis} requis. Vous pouvez ne
        remplir que ce que vous connaissez : les rubriques laissées vides ne
        sont pas imprimées.
      </p>

      {groupes.map((groupe) => (
        <div key={groupe.domaine} className="groupe">
          <h3>{groupe.libelle}</h3>
          <div className="grille-champs">
            {groupe.champs.map((id) => (
              <Champ
                key={id}
                id={id}
                definition={champs[id]}
                valeur={saisie.valeurs[id]}
                saisie={saisie}
              />
            ))}
          </div>
        </div>
      ))}

      <div className="production">
        <h3>Produire les documents</h3>
        <p className="note">
          Chaque document reprend uniquement les renseignements que vous avez
          saisis. Les rubriques laissées vides ne sont pas imprimées.
        </p>

        <PiecesJointes
          pieces={pieces}
          ajouter={ajouterPiece}
          retirer={retirerPiece}
        />

        {dossierPossible && (
          <div className="production-dossier">
            <button
              type="button"
              className="bouton-principal"
              disabled={enCours !== null}
              onClick={produireDossier}
            >
              {enCours === DOSSIER
                ? 'Préparation du dossier…'
                : `Télécharger le dossier complet (${resume})`}
            </button>
            <p className="note">
              Un seul fichier PDF réunissant {resume}, avec un sommaire qui
              indique la page de chacun.
            </p>
          </div>
        )}

        <div className="choix-format">
          <p className="note">
            {dossierPossible
              ? 'Ou téléchargez les documents un par un, au format de votre choix :'
              : 'Téléchargez votre document, au format de votre choix :'}
          </p>
          <div className="barre-format">
            <button
              type="button"
              className={format === 'pdf' ? 'format-actif' : 'format-inactif'}
              aria-pressed={format === 'pdf'}
              disabled={enCours !== null}
              onClick={() => setFormat('pdf')}
            >
              PDF
            </button>
            <button
              type="button"
              className={format === 'word' ? 'format-actif' : 'format-inactif'}
              aria-pressed={format === 'word'}
              disabled={enCours !== null}
              onClick={() => setFormat('word')}
            >
              Word
            </button>
          </div>
          <p className="note">
            {format === 'pdf'
              ? 'Le PDF fige la mise en page. C’est le format à joindre à un dossier.'
              : 'Le Word (.docx) s’ouvre dans un traitement de texte et se modifie librement, si vous devez retoucher une mention sans tout ressaisir.'}
          </p>
        </div>
        <div className="barre-boutons">
          {documentsChoisis.map((idDoc) => (
            <button
              key={idDoc}
              type="button"
              className="bouton-secondaire"
              disabled={enCours !== null}
              onClick={() => produire(idDoc)}
            >
              {enCours === idDoc ? 'Préparation…' : documents[idDoc].titreFr}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
