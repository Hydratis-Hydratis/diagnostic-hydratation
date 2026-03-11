

# Analyse des abandons par question dans le dashboard admin

## Principe

Les réponses partielles sont déjà sauvegardées progressivement dans `diagnostic_data` (JSONB). Pour les diagnostics avec `status = 'started'` (non terminés), on peut déterminer la dernière question répondue en vérifiant quelles clés sont présentes dans ce JSONB, en suivant l'ordre des questions défini dans `questions.ts`.

## Ordre des questions (IDs)

`sexe` → `situation_particuliere` (conditionnel) → `age` → `taille_cm` → `poids_kg` → `temperature_ext` → `sport_pratique` → `metier_physique` → `sports_selectionnes` (conditionnel) → `frequence` (conditionnel) → `duree_minutes` (conditionnel) → `transpiration` (conditionnel) → `crampes` → `courbatures` → `urine_couleur` → `boissons_journalieres` → `firstName` → `email`

## Modifications

### 1. Edge Function `admin-analytics/index.ts`

Ajouter une agrégation `abandonMap` pour les diagnostics non terminés (`status !== 'completed'`). Pour chaque diagnostic abandonné, parcourir la liste ordonnée des clés de questions et trouver la dernière clé présente dans `diagnostic_data` — la question suivante est celle où l'utilisateur a abandonné.

Retourner un objet `abandonMap: Record<string, number>` mappant chaque question à son nombre d'abandons.

### 2. Composant `AdminOverview.tsx`

Ajouter un graphique en barres horizontales "Abandons par question" dans l'onglet Vue d'ensemble, montrant à quelle question les utilisateurs décrochent. Chaque barre = nombre d'utilisateurs ayant abandonné à cette étape.

### Fichiers concernés

| Fichier | Modification |
|---------|-------------|
| `supabase/functions/admin-analytics/index.ts` | Calcul de `abandonMap` sur les diagnostics non terminés |
| `src/components/admin/AdminOverview.tsx` | Nouveau graphique barres horizontales "Abandons par question" |

