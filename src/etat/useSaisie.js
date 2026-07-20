import { useState, useCallback } from 'react';

/**
 * État de saisie. Tout est conservé en mémoire vive : rien n'est envoyé à un
 * serveur, rien n'est écrit dans le navigateur. La fermeture de l'onglet efface
 * l'ensemble.
 */
export function useSaisie() {
  const [valeurs, setValeurs] = useState({});

  const definir = useCallback((idChamp, valeur) => {
    setValeurs((v) => ({ ...v, [idChamp]: valeur }));
  }, []);

  const ajouterLigne = useCallback((idChamp, colonnes) => {
    const vide = Object.fromEntries(colonnes.map((c) => [c.id, '']));
    setValeurs((v) => ({ ...v, [idChamp]: [...(v[idChamp] || []), vide] }));
  }, []);

  const modifierLigne = useCallback((idChamp, index, idColonne, valeur) => {
    setValeurs((v) => {
      const lignes = [...(v[idChamp] || [])];
      lignes[index] = { ...lignes[index], [idColonne]: valeur };
      return { ...v, [idChamp]: lignes };
    });
  }, []);

  const supprimerLigne = useCallback((idChamp, index) => {
    setValeurs((v) => {
      const lignes = (v[idChamp] || []).filter((_, i) => i !== index);
      return { ...v, [idChamp]: lignes };
    });
  }, []);

  const remplacerTout = useCallback((nouvelles) => setValeurs(nouvelles || {}), []);

  const toutEffacer = useCallback(() => setValeurs({}), []);

  return {
    valeurs, definir, ajouterLigne, modifierLigne,
    supprimerLigne, remplacerTout, toutEffacer
  };
}
