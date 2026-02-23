

# Ajout d'un point detaille sur les pastilles dans le dashboard admin

## Constat actuel

Le dashboard affiche uniquement une carte KPI "Pastilles moy." avec la moyenne globale. Aucun graphique ne permet de visualiser la repartition ou de croiser les pastilles avec d'autres donnees.

Donnees actuelles en base (169 diagnostics completes avec pastilles) :
- 0 pastilles : 23 utilisateurs (les Hydra'champions bien hydrates)
- 2 pastilles : 66 utilisateurs
- 3 pastilles : 78 utilisateurs (la majorite)
- 4 pastilles : 2 utilisateurs

## Modifications prevues

### 1. Edge function `admin-analytics` : nouvelles agregations pastilles

Ajout de 2 nouvelles donnees dans la reponse :

| Donnee | Description |
|--------|-------------|
| `pastillesDistribution` | Nombre d'utilisateurs par quantite de pastilles (0, 2, 3, 4) |
| `pastillesByRank` | Moyenne de pastilles recommandees par Hydra Rank (champion, avance, initie, debutant) |

### 2. Frontend `AdminOverview.tsx` : nouvelle ligne de graphiques

Ajout d'une ligne dediee aux pastilles entre les graphiques actuels (ligne 3 scores/rank/genre) et la ligne sourcing :

**Colonne gauche** - BarChart "Repartition des pastilles recommandees" :
- Axe X : nombre de pastilles (0, 2, 3, 4)
- Axe Y : nombre d'utilisateurs
- Couleur : violet/bleu pour rester coherent avec le reste du dashboard

**Colonne droite** - BarChart "Pastilles moyennes par Hydra Rank" :
- Axe X : les 4 rangs (Champion, Avance, Initie, Debutant)
- Axe Y : moyenne de pastilles
- Permet de voir la correlation entre le score d'hydratation et les besoins en pastilles

### 3. Tableau des derniers diagnostics enrichi

Ajout d'une colonne "Pastilles" dans le tableau des 10 derniers diagnostics pour voir le nombre recommande a chaque utilisateur.

## Fichiers a modifier

| Fichier | Modification |
|---------|-------------|
| `supabase/functions/admin-analytics/index.ts` | Ajouter `pastillesDistribution` et `pastillesByRank` dans la reponse |
| `src/components/admin/AdminOverview.tsx` | Ajouter la ligne de graphiques pastilles + colonne tableau |

