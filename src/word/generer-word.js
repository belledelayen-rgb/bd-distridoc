/**
 * Production d'un document Word (.docx) modifiable.
 *
 * Raison d'être : le PDF fige la mise en page ; certaines utilisatrices ont
 * besoin de retoucher une seule mention sans tout ressaisir. Le Word répond à
 * ce besoin. Le PDF reste le format de référence et n'est pas modifié.
 *
 * La bibliothèque « docx » pèse environ 214 ko compressés. Elle est donc
 * chargée À LA DEMANDE, au premier clic seulement, exactement comme pdfmake et
 * pdf-lib : la page d'accueil n'en supporte pas le poids.
 *
 * ⚠️ Le paramètre qui porte une entrée de la matrice ne s'appelle jamais
 * « document » dans ce fichier : ce nom désigne le document du navigateur, dont
 * nous avons besoin pour déclencher le téléchargement.
 */

import { construireStructure } from './structure.js';
import { COULEURS } from '../pdf/definition.js';
import { nomFichier } from '../pdf/generer.js';

/** docx attend des couleurs sans dièse. */
const teinte = (couleur) => couleur.replace('#', '');

let docxPromesse = null;

function chargerDocx() {
  if (!docxPromesse) docxPromesse = import('docx');
  return docxPromesse;
}

/** Filet horizontal fin, sans aucune bordure verticale : disposition du PDF. */
function bordures(D, epaisseur, couleur) {
  const filet = { style: D.BorderStyle.SINGLE, size: epaisseur, color: teinte(couleur) };
  const neant = { style: D.BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  return { top: filet, bottom: filet, left: neant, right: neant };
}

/** Libellé bilingue : français en gras, anglais en italique discret. */
function libelle(D, fr, en, taille) {
  return [
    new D.TextRun({ text: fr, bold: true, size: taille }),
    new D.TextRun({ text: ` / ${en}`, italics: true, size: taille, color: teinte(COULEURS.discret) })
  ];
}

/** Bandeau de titre de section, sur fond vert clair. */
function bandeauSection(D, section) {
  return new D.Paragraph({
    spacing: { before: 200, after: 80 },
    shading: { type: D.ShadingType.CLEAR, fill: teinte(COULEURS.vertClair) },
    children: [
      new D.TextRun({ text: section.titreFr, bold: true, size: 19, color: teinte(COULEURS.vert) }),
      new D.TextRun({ text: `  ${section.titreEn}`, italics: true, size: 15, color: teinte(COULEURS.discret) })
    ]
  });
}

/** Fiche à deux colonnes : libellé à gauche, valeur saisie à droite. */
function tableauFiche(D, lignes) {
  return new D.Table({
    width: { size: 100, type: D.WidthType.PERCENTAGE },
    columnWidths: [3500, 6500],
    borders: bordures(D, 2, COULEURS.filet),
    rows: lignes.map((ligne) => new D.TableRow({
      children: [
        new D.TableCell({
          width: { size: 35, type: D.WidthType.PERCENTAGE },
          borders: bordures(D, 2, COULEURS.filet),
          children: [new D.Paragraph({ children: libelle(D, ligne.fr, ligne.en, 16) })]
        }),
        new D.TableCell({
          width: { size: 65, type: D.WidthType.PERCENTAGE },
          borders: bordures(D, 2, COULEURS.filet),
          children: [new D.Paragraph({
            children: [new D.TextRun({ text: ligne.valeur, size: 18 })]
          })]
        })
      ]
    }))
  });
}

/** Tableau de données : en-tête ambré sur fond crème, lignes filetées. */
function tableauDonnees(D, tableau) {
  const entete = new D.TableRow({
    tableHeader: true,
    children: tableau.colonnes.map((colonne) => new D.TableCell({
      shading: { type: D.ShadingType.CLEAR, fill: teinte(COULEURS.ambreClair) },
      borders: bordures(D, 4, COULEURS.ambre),
      children: [new D.Paragraph({ children: libelle(D, colonne.fr, colonne.en, 15) })]
    }))
  });

  const corps = tableau.lignes.map((ligne) => new D.TableRow({
    children: ligne.map((cellule) => new D.TableCell({
      borders: bordures(D, 2, COULEURS.filet),
      children: [new D.Paragraph({
        children: [new D.TextRun({ text: cellule, size: 17 })]
      })]
    }))
  }));

  return new D.Table({
    width: { size: 100, type: D.WidthType.PERCENTAGE },
    borders: bordures(D, 2, COULEURS.filet),
    rows: [entete, ...corps]
  });
}

/** Corps du document : la suite des sections renseignées. */
function corpsDocument(D, structure) {
  const elements = [];

  for (const section of structure.sections) {
    elements.push(bandeauSection(D, section));

    if (section.fiche.length > 0) {
      elements.push(tableauFiche(D, section.fiche));
      elements.push(new D.Paragraph({ text: '', spacing: { after: 60 } }));
    }

    for (const tableau of section.tableaux) {
      elements.push(new D.Paragraph({
        spacing: { before: 80, after: 40 },
        children: libelle(D, tableau.fr, tableau.en, 16)
      }));
      elements.push(tableauDonnees(D, tableau));
      elements.push(new D.Paragraph({ text: '', spacing: { after: 60 } }));
    }
  }

  if (elements.length === 0) {
    elements.push(new D.Paragraph({
      children: [new D.TextRun({ text: 'Aucun renseignement saisi pour ce document.', size: 18 })]
    }));
  }

  return elements;
}

/** Image du logo, à partir de la donnée déposée par l'utilisatrice. */
function imageLogo(D, logo) {
  if (typeof logo !== 'string' || !logo.startsWith('data:image/')) return null;
  try {
    const type = logo.slice(11, logo.indexOf(';')).toLowerCase();
    const binaire = atob(logo.slice(logo.indexOf(',') + 1));
    const octets = Uint8Array.from(binaire, (c) => c.charCodeAt(0));
    return new D.ImageRun({
      data: octets,
      type: type === 'jpeg' || type === 'jpg' ? 'jpg' : 'png',
      transformation: { width: 96, height: 44 }
    });
  } catch {
    return null; // un logo illisible ne doit jamais empêcher la production
  }
}

/** En-tête répété : titre bilingue du document, logo à droite s'il existe. */
function entete(D, structure, logo) {
  const image = imageLogo(D, logo);
  return new D.Header({
    children: [
      new D.Paragraph({
        children: [new D.TextRun({
          text: structure.titreFr, bold: true, size: 28, color: teinte(COULEURS.vert)
        })]
      }),
      new D.Paragraph({
        spacing: { after: 120 },
        children: [new D.TextRun({
          text: structure.titreEn, italics: true, size: 16, color: teinte(COULEURS.discret)
        })]
      }),
      ...(image
        ? [new D.Paragraph({ alignment: D.AlignmentType.RIGHT, children: [image] })]
        : [])
    ]
  });
}

/** Pied répété : mention unique, puis la numérotation des pages. */
function pied(D, mention) {
  return new D.Footer({
    children: [
      new D.Paragraph({
        children: [new D.TextRun({ text: mention, size: 12, color: teinte(COULEURS.discret) })]
      }),
      new D.Paragraph({
        alignment: D.AlignmentType.RIGHT,
        children: [new D.TextRun({
          children: ['page ', D.PageNumber.CURRENT, ' / ', D.PageNumber.TOTAL_PAGES],
          size: 12,
          color: teinte(COULEURS.discret)
        })]
      })
    ]
  });
}

/** Assemble le fichier .docx à partir de la structure neutre. */
export async function construireFichierWord(structure, options = {}) {
  const D = await chargerDocx();

  const fichier = new D.Document({
    creator: 'BD-DistriDoc',
    title: structure.titreFr,
    styles: { default: { document: { run: { font: 'Calibri', size: 18 }, paragraph: {} } } },
    sections: [{
      properties: {
        page: { margin: { top: 1700, right: 1100, bottom: 1100, left: 1100 } }
      },
      headers: { default: entete(D, structure, options.logo) },
      footers: { default: pied(D, structure.mention) },
      children: corpsDocument(D, structure)
    }]
  });

  return D.Packer.toBlob(fichier);
}

/** Construit puis télécharge la version Word d'un document. */
export async function telechargerWord(entreeMatrice, champs, valeurs, options = {}) {
  const structure = construireStructure(entreeMatrice, champs, valeurs);
  const blob = await construireFichierWord(structure, options);

  const url = URL.createObjectURL(blob);
  const lien = window.document.createElement('a');
  lien.href = url;
  lien.download = nomFichier(entreeMatrice.titreFr, new Date(), 'docx');
  lien.click();
  URL.revokeObjectURL(url);
}
