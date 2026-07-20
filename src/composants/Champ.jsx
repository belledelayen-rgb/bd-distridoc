import ChampTableau from './ChampTableau.jsx';

/** Rendu d'un champ selon son type déclaré dans la matrice. */
export default function Champ({ id, definition, valeur, saisie }) {
  if (definition.type === 'tableau') {
    return (
      <ChampTableau
        id={id}
        definition={definition}
        lignes={Array.isArray(valeur) ? valeur : []}
        saisie={saisie}
      />
    );
  }

  const commun = {
    id,
    value: valeur ?? '',
    onChange: (e) => saisie.definir(id, e.target.value)
  };

  let controle;
  switch (definition.type) {
    case 'texteLong':
      controle = <textarea rows={4} {...commun} />;
      break;
    case 'nombre':
      controle = <input type="number" step="any" {...commun} />;
      break;
    case 'date':
      controle = <input type="date" {...commun} />;
      break;
    case 'booleen':
      controle = (
        <input
          type="checkbox"
          id={id}
          checked={Boolean(valeur)}
          onChange={(e) => saisie.definir(id, e.target.checked)}
        />
      );
      break;
    case 'choix':
      controle = (
        <select {...commun}>
          <option value="">— Choisir —</option>
          {(definition.options || []).map((o) => (
            <option key={o.valeur} value={o.valeur}>{o.libelleFr}</option>
          ))}
        </select>
      );
      break;
    case 'fichier':
      controle = (
        <input
          type="file"
          id={id}
          accept="image/png,image/jpeg"
          onChange={(e) => {
            const fichier = e.target.files?.[0];
            if (!fichier) return saisie.definir(id, '');
            const lecteur = new FileReader();
            lecteur.onload = () => saisie.definir(id, lecteur.result);
            lecteur.readAsDataURL(fichier);
          }}
        />
      );
      break;
    default:
      controle = <input type="text" {...commun} />;
  }

  return (
    <div className="champ">
      <label htmlFor={id} className="champ-libelle">
        {definition.libelleFr}
        {definition.unite && <span className="unite"> ({definition.unite})</span>}
        {definition.requis && <span className="requis" title="Renseignement requis">*</span>}
      </label>
      <span className="champ-libelle-en">{definition.libelleEn}</span>
      {definition.aide && <p className="champ-aide">{definition.aide}</p>}
      {controle}
    </div>
  );
}
