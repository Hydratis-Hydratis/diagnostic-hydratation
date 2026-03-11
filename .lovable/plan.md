

# Afficher toutes les étapes dans le graphique d'abandons

## Problème

La colonne `last_seen_step` vient d'etre ajoutee. Tous les anciens diagnostics ont cette valeur a NULL, donc ils tombent dans "Avant 1ere question". Seuls les nouveaux diagnostics auront une valeur. De plus, le code filtre les etapes a 0, donc les barres vides n'apparaissent pas.

## Solution en 2 parties

### 1. Toujours afficher les 5 etapes (meme a 0)

Dans `AnalyticsCharts.tsx` et `AdminOverview.tsx`, ne plus filtrer les etapes sans donnees : afficher une barre a 0 pour chaque etape du `stepOrder`.

### 2. Inferer le step pour les anciennes donnees (sans `last_seen_step`)

Dans l'edge function `admin-analytics`, pour les diagnostics abandonnes qui n'ont pas de `last_seen_step`, deduire l'etape a partir des cles presentes dans `diagnostic_data` :

- Si contient `boissons_journalieres` → abandon a **Coordonnees**
- Si contient `crampes` ou `urine_couleur` ou `temperature_ext` → abandon a **Habitudes**
- Si contient `sport_pratique` ou `metier_physique` → abandon a **Sante & Conditions**
- Si contient `sexe` ou `age` → abandon a **Activite physique**
- Sinon → **Avant 1ere question**

Cela repartit les ~670 anciens abandons dans les bonnes etapes au lieu de tout mettre dans "Avant 1ere question".

## Fichiers concernes

| Fichier | Modification |
|---------|-------------|
| `supabase/functions/admin-analytics/index.ts` | Ajouter inference du step depuis `diagnostic_data` pour les anciens enregistrements |
| `src/components/admin/AnalyticsCharts.tsx` | Afficher toutes les etapes meme a 0 |
| `src/components/admin/AdminOverview.tsx` | Idem |

