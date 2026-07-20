# BD-DistriDoc

Outil autonome et public de génération de documents professionnels au format PDF,
à partir des seules informations saisies par l'utilisateur.

## Principe

L'outil **met en forme les données saisies**. Il n'invente rien, ne suppose rien
et ne complète aucune donnée manquante. Il ne réalise **aucune évaluation de la
sécurité** et ne produit **aucun RSPC** ni aucune conclusion d'évaluation.

## Architecture

- React + Vite, application monopage.
- Déploiement Netlify **statique**. Aucun serveur, aucune base de données.
- **Sans stockage** : tout se passe dans le navigateur, rien n'est conservé.
  Un brouillon peut être enregistré sur l'appareil de l'utilisateur, sous forme
  de fichier qu'il télécharge et relit lui-même.
- Référentiels **statiques** (pas d'intelligence artificielle) pour l'aide à la
  saisie.
- PDF **vectoriel** généré côté navigateur, avec pdfmake chargé à la demande.
  La capture d'écran (html2canvas) est proscrite.

## Développement

```bash
npm install
npm run dev      # serveur local
npm run build    # contrôle de la matrice, puis build de production dans dist/
npm run verifier # contrôle de la matrice seul
```

## État d'avancement

| Lot | Contenu | État |
|-----|---------|------|
| L0 | Dépôt, squelette Vite/React, déploiement Netlify | fait |
| L1 | Matrice des documents et contrôle de cohérence | fait |
| L2 | Formulaire piloté par la matrice, parcours en deux étapes | fait |
| L3 | Génération PDF vectorielle bilingue des 23 documents | fait |
| L4 | Assemblage : sommaire, fusion, pièces jointes, export | en cours |
| L5 | Lien depuis BD-DocPro | à faire |
| L6 | Lien depuis BD-SapoPro V2 | à faire |

## Hors périmètre

Comptes utilisateurs, stockage serveur, versionnage, journal d'audit, base de
données. Catégories détergent et bougie prévues, non implémentées en v1.

Toujours exclus : le RSPC et toute conclusion d'évaluation de la sécurité.
L'outil ne qualifie pas non plus la conformité d'un document à une exigence
réglementaire : la matrice de conformité est **renseignée par l'utilisateur**,
qui seul porte cette appréciation.

## Structure des données

- `src/data/champs/<domaine>.json` : dictionnaires de champs. Chaque champ est
  défini **une seule fois**, avec un libellé français et un libellé anglais.
- `src/data/documents/<famille>.json` : catalogues de documents. Un document
  référence les champs par leur identifiant et déclare la famille du fichier
  qui le contient.
- `src/data/regles.js` : regroupement des champs et contrôle de cohérence,
  fonctions pures, exécutables hors navigateur.
- `src/pdf/definition.js` : construction de la définition d'un document,
  fonction pure elle aussi, indépendante de pdfmake.
- `scripts/verifier-matrice.mjs` : le même contrôle hors navigateur. Il est
  exécuté par `npm run build`, de sorte qu'une matrice incohérente ne peut pas
  être déployée.

Pour ajouter un domaine de champs ou une famille de documents, modifier
`src/data/index.js` **et** `scripts/verifier-matrice.mjs` : les deux listes
doivent rester alignées.

## Sources réglementaires

Règlement (CE) n° 1223/2009 relatif aux produits cosmétiques (art. 11, 19, 20,
annexe III) ; règlement (UE) n° 655/2013 (critères communs aux allégations) ;
règlement (UE) 2023/1545 (annexe III étendue, entrées 324 à 371 ; seuils de
déclaration 0,001 % sans rinçage et 0,01 % à rincer) ; norme ISO 22716 (bonnes
pratiques de fabrication) ; norme ISO 29621 (produits à faible risque
microbiologique) ; base de données CosIng de la Commission européenne.

Pour la fiche de données de sécurité : règlement (CE) n° 1907/2006 (REACH),
annexe II telle que modifiée par le règlement (UE) 2020/878, applicable depuis
le 1er janvier 2021 ; règlement (CE) n° 1272/2008 (CLP).

Extension future envisagée : règlement (CE) n° 648/2004 et règlement (CE)
n° 1272/2008 (CLP) pour les détergents ; normes NF EN 15493, NF EN 15494 et
NF EN 15426 pour les bougies.

## Mentions

Les documents produits par cet outil sont générés automatiquement à partir des
données saisies par l'utilisateur, qui en demeure seul responsable. L'outil ne
constitue ni un avis réglementaire, ni une évaluation de la sécurité.
