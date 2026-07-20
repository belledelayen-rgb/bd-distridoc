import { useState } from 'react';
import { champs, documents, champsRegroupes, champsManquants } from '../data/index.js';
import { telechargerDocument } from '../pdf/generer.js';
import Champ from './Champ.jsx';

/** Formulaire construit à partir des documents choisis. */
export default function Formulaire({ documentsChoisis, saisie }) {
  const [enCours, setEnCours] = useState(null);
  const groupes = champsRegroupes(documentsChoisis);
  const manquants = champsManquants(documentsChoisis, saisie.valeurs);
  const total = groupes.reduce((n, g) => n + g.champs.length, 0);

  const produire = async (idDoc) => {
    setEnCours(idDoc);
    try {
      await telechargerDocument(documents[idDoc], champs, saisie.valeurs, {
        logo: saisie.valeurs.demandeur_logo || undefined
      });
    } finally {
      setEnCours(null);
    }
  };

  return (
    <section className="bloc">
      <h2>Renseignements</h2>
      <p className="note">
        {total} renseignements pour {documentsChoisis.length} document
        {documentsChoisis.length > 1 ? 's' : ''}.
        {manquants.length > 0 && (
          <> {manquants.length} requis {manquants.length > 1 ? 'restent' : 'reste'} à compléter.</>
        )}
        {manquants.length === 0 && total > 0 && <> Tous les requis sont renseignés.</>}
      </p>

      {groupes.map((groupe) => (
        <div key={groupe.domaine} className="groupe">
          <h3>{groupe.libelle}</h3>
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
      ))}

      <div className="production">
        <h3>Produire les documents</h3>
        <p className="note">
          Chaque document reprend uniquement les renseignements que vous avez
          saisis. Les rubriques laissées vides ne sont pas imprimées.
        </p>
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
