

## Plan d'amélioration du certificat

### 1. Vérifications et corrections de données

- **Confirmer que `hydratis.fr`** est bien affiché (déjà correct dans le code, vérifier que c'est bien `.fr` et pas `.co`)
- S'assurer que toutes les données correspondent exactement aux résultats affichés dans `ResultsDisplay.tsx`

### 2. Améliorations visuelles et de contenu

- **Ajouter le prénom de l'utilisateur** de manière plus visible dans le titre
- **Harmoniser les couleurs** des badges selon le score (déjà fait, mais à vérifier)
- **Améliorer l'affichage de la jauge** pour qu'elle soit plus lisible

### 3. Correspondance exacte avec les résultats du diagnostic

Vérifier que :
- Le score affiché = `results.score`
- Les besoins en eau = `results.besoin_total_ml / 1000` (en litres, avec 1 décimale)
- Les pastilles = `results.nb_pastilles_basal + results.nb_pastilles_exercice`
- L'écart = `results.ecart_hydratation_ml / 1000` (en litres)
- Le pourcentage de la jauge = `(results.hydratation_reelle_ml / results.besoin_total_ml) * 100`

### 4. Modifications à apporter dans `generate-certificate/index.ts`

1. **Ligne 249** : Confirmer que l'URL est `hydratis.fr` (déjà correct)
2. **Améliorer le design** si nécessaire (polices, espacements, couleurs)
3. **Ajouter des informations supplémentaires** si souhaité (par ex. le sport pratiqué)

### 5. Points à clarifier

- Souhaitez-vous ajouter d'autres informations sur le certificat (sport, température, etc.) ?
- Voulez-vous modifier le design global du certificat ?
- Y a-t-il des éléments spécifiques que vous voyez incorrects sur l'image que vous avez partagée ?

