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
| L0 | Depot, squelette Vite/React, deploiement Netlify | en cours |
| L1 | Matrice JSON des documents et validation | a faire |
| L2 | Formulaire pilote par schema | a faire |
| L3 | Gabarits PDF vectoriels bilingues | a faire |
| L4 | Autres documents, pieces jointes, assemblage, export | a faire |
| L5 | Lien depuis BD-DocPro | a faire |
| L6 | Lien depuis BD-SapoPro V2 | a faire |

## Hors perimetre

Comptes utilisateurs, stockage serveur, versionnage, journal d'audit, base de
donnees. Categories detergent et bougie prevues, non implementees en v1.
Toujours exclus : RSPC et conclusion d'evaluation de la securite.

## Sources reglementaires

Reglement (CE) n° 1223/2009 relatif aux produits cosmetiques (art. 11, 19, 20,
Annexe III) ; Reglement (UE) n° 655/2013 (criteres communs aux allegations) ;
Reglement (UE) 2023/1545 (Annexe III etendue, entrees 324 a 371 ; seuils de
declaration 0,001 % sans rincage et 0,01 % a rincer) ; norme ISO 22716 (bonnes
pratiques de fabrication) ; base de donnees CosIng de la Commission europeenne.

Extension future envisagee : Reglement (CE) n° 648/2004 et Reglement (CE)
n° 1272/2008 (CLP) pour les detergents ; normes NF EN 15493, 15494 et 15426
pour les bougies.

## Mentions

Les documents produits par cet outil sont generes automatiquement a partir des
donnees saisies par l'utilisateur, qui en demeure seul responsable. L'outil ne
constitue ni un avis reglementaire, ni une evaluation de la securite.
