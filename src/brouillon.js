const FORMAT = 'bd-distridoc-brouillon';
const VERSION = 1;

/**
 * Télécharge la saisie sous forme de fichier, sur l'appareil de l'utilisateur.
 * Aucune donnée ne transite par un serveur : c'est un téléchargement local.
 */
export function telechargerBrouillon(documentsChoisis, valeurs) {
  const contenu = {
    format: FORMAT,
    version: VERSION,
    enregistreLe: new Date().toISOString(),
    documentsChoisis,
    valeurs
  };
  const blob = new Blob([JSON.stringify(contenu, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement('a');
  const horodatage = new Date().toISOString().slice(0, 10);
  lien.href = url;
  lien.download = `brouillon-bd-distridoc-${horodatage}.json`;
  lien.click();
  URL.revokeObjectURL(url);
}

/**
 * Relit un fichier de brouillon choisi par l'utilisateur.
 * @returns {Promise<{documentsChoisis: string[], valeurs: object}>}
 */
export async function lireBrouillon(fichier) {
  const texte = await fichier.text();

  let contenu;
  try {
    contenu = JSON.parse(texte);
  } catch {
    throw new Error("Ce fichier n'est pas un brouillon lisible.");
  }

  if (contenu?.format !== FORMAT) {
    throw new Error("Ce fichier n'est pas un brouillon BD-DistriDoc.");
  }
  if (contenu.version > VERSION) {
    throw new Error(
      'Ce brouillon a été enregistré par une version plus récente de l\'outil.'
    );
  }
  return {
    documentsChoisis: Array.isArray(contenu.documentsChoisis) ? contenu.documentsChoisis : [],
    valeurs: contenu.valeurs && typeof contenu.valeurs === 'object' ? contenu.valeurs : {}
  };
}
