

# Fix des vues totales et du graphique d'evolution

## Problemes identifies

1. **"Vues totales = 3"** : La table `page_views` ne contient que 4 lignes car le tracking vient d'etre deploye. Il n'y a aucune donnee historique. Le taux de conversion 37900% est absurde.

2. **Graphique commence a 0 pendant 20 jours** : En mode "Tout", le code affiche toujours les 30 derniers jours (hardcode ligne 111), meme si les premiers diagnostics datent du ~19 fevrier. Resultat : 20 jours de zeros inutiles.

## Corrections prevues

### 1. Graphique : plage dynamique basee sur les donnees reelles

**Fichier** : `src/components/admin/AdminOverview.tsx`

- En mode "Tout" et "custom", calculer la plage du graphique a partir de la **premiere date presente dans `dailyMap`** (et non 30 jours en dur)
- En mode 7d/30d/90d, garder le comportement actuel (N jours glissants)
- Cela eliminera les jours vides en debut de graphique

### 2. Vues totales : afficher un message contextuel quand le tracking est recent

**Fichier** : `src/components/admin/AdminOverview.tsx`

- Si `totalViews < 10`, afficher "Tracking recent" au lieu du taux de conversion absurde
- Cela evite d'induire en erreur avec un taux de conversion de 37900%

### 3. Ligne "Vues" sur le graphique : masquer si donnees insuffisantes

- Ne pas afficher la courbe "Vues" sur le LineChart si la somme des vues est < 5, pour eviter une ligne plate a 0 qui ecrase les autres courbes

## Fichiers a modifier

| Fichier | Modification |
|---------|-------------|
| `src/components/admin/AdminOverview.tsx` | Plage dynamique du graphique + gestion vues faibles |

