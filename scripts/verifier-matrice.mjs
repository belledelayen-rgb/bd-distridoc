// Contrôle de cohérence de la matrice, exécutable hors navigateur.
// Usage : node scripts/verifier-matrice.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validerMatriceAvec } from '../src/data/regles.js';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (chemin) => JSON.parse(readFileSync(join(racine, chemin), 'utf8'));

const DOMAINES = ['communs', 'produit', 'matiere', 'composition', 'emballage', 'signature'];
const dictionnaires = Object.fromEntries(
  DOMAINES.map((d) => [d, lire(`src/data/champs/${d}.json`)])
);
const documents = lire('src/data/documents.json');

const bilan = validerMatriceAvec(dictionnaires, documents);

console.log('Champs definis  :', bilan.statistiques.champs);
console.log('Champs cites    :', bilan.statistiques.champsCites);
console.log('Documents       :', bilan.statistiques.documents);

if (bilan.avertissements.length) {
  console.log('\nAvertissements :');
  for (const a of bilan.avertissements) console.log('  -', a);
}
if (bilan.erreurs.length) {
  console.log('\nErreurs :');
  for (const e of bilan.erreurs) console.log('  -', e);
  process.exit(1);
}
console.log('\nMatrice coherente.');
