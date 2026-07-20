# BD-DistriDoc

Outil autonome et public de generation de documents professionnels au format PDF,
a partir des seules informations saisies par l'utilisateur.

## Principe

L'outil **met en forme les donnees saisies**. Il n'invente rien, ne suppose rien
et ne complete aucune donnee manquante. Il ne realise **aucune evaluation de la
securite** et ne produit **aucun RSPC** ni aucune conclusion d'evaluation.

## Architecture

- React + Vite, application monopage.
- Deploiement Netlify **statique**. Aucun serveur, aucune base de donnees.
- **Sans stockage** : tout se passe dans le navigateur, rien n'est conserve.
- Referentiels **statiques** (pas d'IA) pour l'aide a la saisie.
- PDF **vectoriel** genere cote navigateur. La capture d'ecran (html2canvas)
  est proscrite.

## Developpement

```bash
npm install
npm run dev      # serveur local
npm run build    # build de production dans dist/
```

## Etat d'avancement

| Lot | Contenu | Etat |
|-----|---------|------|
| L0 | Depot, squelette Vite/React, deploiement Netlify | fait |
| L1 | Matrice des documents et controle de coherence | fait |
| L2 | Formulaire pilote par schema | a faire |
| L3 | Gabarits PDF vectoriels bilingues | a faire |
| L4 | Autres documents, pieces jointes, assemblage, export | a faire |
| L5 | Lien depuis BD-DocPro | a faire |
| L6 | Lien depuis BD-SapoPro V2 | a faire |

## Hors perimetre

Comptes utilisateurs, stockage serveur, versionnage, journal d'audit, base de
donnees. Categories detergent et bougie prevues, non implementees en v1.
Toujours exclus : RSPC et conclusion d'evaluation de la securite.

## Structure des donnees

- `src/data/champs/<domaine>.json` : dictionnaires de champs. Chaque champ est
  defini **une seule fois**, avec un libelle francais et un libelle anglais.
- `src/data/documents/<famille>.json` : catalogues de documents. Un document
  reference les champs par leur identifiant et declare la famille du fichier
  qui le contient.
- `src/data/regles.js` : controle de coherence, fonction pure.
- `scripts/verifier-matrice.mjs` : le meme controle hors navigateur. Il est
  execute par `npm run build`, de sorte qu'une matrice incoherente ne peut pas
  etre deployee.

Pour ajouter un domaine ou une famille, modifier `src/data/index.js` **et**
`scripts/verifier-matrice.mjs` : les deux listes doivent rester alignees.

## Sources reglementaires

Reglement (CE) n° 1223/2009 relatif aux produits cosmetiques (art. 11, 19, 20,
Annexe III) ; Reglement (UE) n° 655/2013 (criteres communs aux allegations) ;
Reglement (UE) 2023/1545 (Annexe III etendue, entrees 324 a 371 ; seuils de
declaration 0,001 % sans rincage et 0,01 % a rincer) ; norme ISO 22716 (bonnes
pratiques de fabrication) ; norme ISO 29621 (produits a faible risque
microbiologique) ; base de donnees CosIng de la Commission europeenne.

Pour la fiche de donnees de securite : reglement (CE) n° 1907/2006 (REACH),
annexe II telle que modifiee par le reglement (UE) 2020/878, applicable depuis
le 1er janvier 2021 ; reglement (CE) n° 1272/2008 (CLP).

Extension future envisagee : Reglement (CE) n° 648/2004 et Reglement (CE)
n° 1272/2008 (CLP) pour les detergents ; normes NF EN 15493, 15494 et 15426
pour les bougies.

## Mentions

Les documents produits par cet outil sont generes automatiquement a partir des
donnees saisies par l'utilisateur, qui en demeure seul responsable. L'outil ne
constitue ni un avis reglementaire, ni une evaluation de la securite.
