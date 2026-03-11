

# Tracking précis de l'abandon dans le questionnaire

## Constat actuel

Les questions sont groupées par **écran thématique** (pas une par une) :
1. **Profil** — sexe, situation, âge, taille, poids, prénom, email
2. **Activité physique** — sport, métier physique, sports sélectionnés, fréquence, durée, transpiration
3. **Santé & Conditions** — température, crampes, courbatures, couleur urine
4. **Habitudes** — boissons journalières

Actuellement, les réponses ne sont sauvegardées dans la base qu'**après validation d'un écran** (`updateDiagnosticProgress`). On ne sait donc pas quel écran l'utilisateur regardait quand il est parti — seulement quel écran il a terminé en dernier.

## Solution : sauvegarder l'écran actuellement affiché

### 1. Ajouter une colonne `last_seen_step` à la table `diagnostics`

Colonne texte nullable qui stocke le nom du dernier écran affiché (ex: `"Profil"`, `"Activité physique"`).

### 2. Mettre à jour `last_seen_step` à chaque changement d'écran

Dans `DiagnosticChat.tsx`, quand `currentGroupIndex` change et qu'un nouvel écran s'affiche, faire un appel léger à la base pour mettre à jour `last_seen_step` avec le nom de l'étape courante. Cela inclut aussi le premier écran affiché après l'onboarding.

### 3. Modifier l'edge function `admin-analytics`

Utiliser `last_seen_step` (au lieu de deviner depuis `diagnostic_data`) pour calculer `abandonMap`. Résultat : un objet `{ "Profil": 120, "Activité physique": 45, ... }` montrant précisément à quel écran les utilisateurs quittent.

### 4. Mettre à jour le graphique dans `AnalyticsCharts.tsx`

Adapter le graphique existant pour afficher les abandons par écran thématique (4-5 barres claires) au lieu des 18 questions individuelles.

## Fichiers concernés

| Fichier | Modification |
|---------|-------------|
| Migration SQL | Ajouter colonne `last_seen_step` à `diagnostics` |
| `src/lib/saveDiagnostic.ts` | Nouvelle fonction `updateLastSeenStep(stepName)` |
| `src/components/DiagnosticChat.tsx` | Appeler `updateLastSeenStep` à chaque changement d'écran |
| `supabase/functions/admin-analytics/index.ts` | Utiliser `last_seen_step` pour `abandonMap` |
| `src/components/admin/AnalyticsCharts.tsx` | Adapter le graphique aux noms d'écrans |

