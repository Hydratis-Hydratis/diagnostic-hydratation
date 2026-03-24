

# Amélioration du dashboard : abandons + entonnoir détaillé

## 1. Supprimer le graphique "Abandons par écran" dans AdminAbandons

Ne garder que le graphique "Abandons par question" qui est plus précis.

## 2. Enrichir l'entonnoir de conversion

Actuellement l'entonnoir montre : Démarrés → Complétés → Avec email.

Le nouvel entonnoir affichera 4 niveaux :
- **Vues totales** (page_views) — personnes qui se rendent sur le diagnostic
- **Diagnostic démarré** (diagnostics.status = started ou completed) — ceux qui cliquent "Commencer"
- **Sexe validé** — ceux qui ont répondu à la question sexe (diagnostic_data contient `sexe`)
- **Complétés** — diagnostics terminés

### Calcul côté edge function (`admin-analytics`)

Ajouter au résultat :
- `funnel.views` = totalViews (déjà calculé)
- `funnel.started` = total diagnostics (déjà calculé)
- `funnel.withSexe` = nombre de diagnostics ayant `sexe` non null dans la table ou dans `diagnostic_data`
- `funnel.completed` = déjà calculé
- `funnel.withEmail` = déjà calculé

### Affichage dans AdminOverview

Mettre à jour le graphique entonnoir avec 5 barres au lieu de 3, avec les taux de conversion entre chaque étape affichés.

## Fichiers concernés

| Fichier | Modification |
|---------|-------------|
| `src/components/admin/AdminAbandons.tsx` | Supprimer le bloc "Abandons par écran" |
| `supabase/functions/admin-analytics/index.ts` | Ajouter `withSexe` et `views` au funnel |
| `src/components/admin/AdminOverview.tsx` | Entonnoir à 5 niveaux avec taux |

