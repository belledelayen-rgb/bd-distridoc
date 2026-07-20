import { useRef, useState } from 'react';
import {
  lirePieceJointe, formaterTaille, NOMBRE_MAX, TAILLE_MAX_FICHIER
} from '../pdf/pieces-jointes.js';

/**
 * Dépôt des pièces jointes tierces : des PDF que l'utilisatrice possède déjà et
 * qui doivent accompagner ses documents à la fin du dossier.
 */
export default function PiecesJointes({ pieces, ajouter, retirer }) {
  const champ = useRef(null);
  const [erreur, setErreur] = useState(null);
  const [enLecture, setEnLecture] = useState(false);

  const deposer = async (evenement) => {
    const fichier = evenement.target.files?.[0];
    evenement.target.value = '';
    if (!fichier) return;

    setErreur(null);
    setEnLecture(true);
    try {
      ajouter(await lirePieceJointe(fichier, pieces));
    } catch (probleme) {
      setErreur(probleme.message);
    } finally {
      setEnLecture(false);
    }
  };

  const total = pieces.reduce((n, p) => n + p.pages, 0);

  return (
    <div className="pieces-jointes">
      <h4>Pièces jointes</h4>
      <p className="note">
        Vous pouvez joindre vos propres PDF — certificats d&apos;analyse, fiches
        fournisseur, attestations. Ils sont reproduits tels quels à la fin du
        dossier, chacun précédé d&apos;une page qui l&apos;annonce, et le sommaire
        indique la page où il commence.
      </p>

      {pieces.length > 0 && (
        <ul className="liste-pieces">
          {pieces.map((piece, index) => (
            <li key={piece.id}>
              <span className="piece-rang">{index + 1}</span>
              <span className="piece-nom">
                {piece.nom}
                <span className="piece-detail">
                  {piece.pages > 1 ? ` ${piece.pages} pages` : ' 1 page'}
                  {' · '}{formaterTaille(piece.taille)}
                </span>
              </span>
              <button
                type="button"
                className="bouton-discret"
                onClick={() => retirer(piece.id)}
              >
                Retirer
              </button>
            </li>
          ))}
        </ul>
      )}

      {erreur && <p className="message-erreur">{erreur}</p>}

      <button
        type="button"
        className="bouton-secondaire"
        disabled={enLecture || pieces.length >= NOMBRE_MAX}
        onClick={() => champ.current?.click()}
      >
        {enLecture ? 'Lecture du fichier…' : 'Joindre un PDF'}
      </button>

      <p className="note">
        {pieces.length === 0
          ? `Jusqu'à ${NOMBRE_MAX} pièces, ${formaterTaille(TAILLE_MAX_FICHIER)} au maximum chacune.`
          : `${pieces.length} ${pieces.length > 1 ? 'pièces jointes' : 'pièce jointe'}, ${total} ${total > 1 ? 'pages' : 'page'} au total.`}
        {' '}Vos fichiers restent dans votre navigateur : ils ne sont jamais
        transmis, et ne sont pas enregistrés dans le brouillon.
      </p>

      <input
        ref={champ}
        type="file"
        accept="application/pdf,.pdf"
        onChange={deposer}
        hidden
      />
    </div>
  );
}
