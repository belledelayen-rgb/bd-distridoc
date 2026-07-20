import { dictionnaires, documents } from './index.js';
import { validerMatriceAvec } from './regles.js';

/** Contrôle de cohérence de la matrice embarquée. */
export function validerMatrice() {
  return validerMatriceAvec(dictionnaires, documents);
}
