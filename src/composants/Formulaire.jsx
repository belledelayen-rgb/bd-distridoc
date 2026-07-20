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
  const requis = groupes.reduce(
    (n, g) => n + g.champs.filter((id) => champs[id].requis).length, 0
  );
  const faits = requis - manquants.length;
  const avancement = requis === 0 ? 100 : Math.round((faits / requis) * 100);

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
