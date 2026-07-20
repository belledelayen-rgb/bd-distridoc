import { champs, champsRegroupes, champsManquants } from '../data/index.js';
import Champ from './Champ.jsx';

/** Formulaire construit à partir des documents choisis. */
export default function Formulaire({ documentsChoisis, saisie }) {
  const groupes = champsRegroupes(documentsChoisis);
  const manquants = champsManquants(documentsChoisis, saisie.valeurs);
  const total = groupes.reduce((n, g) => n + g.champs.length, 0);

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
    </section>
  );
}
