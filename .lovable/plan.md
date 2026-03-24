

# Réorganisation du dashboard admin

## Constat actuel

Le dashboard a 4 onglets mais souffre de plusieurs problemes :
- **Vue d'ensemble** est surchargee : KPIs, evolution quotidienne, entonnoir, scores, rangs, sexe, pastilles, abandons, UTM, devices, derniers diagnostics — tout est melange
- **Analyses** duplique beaucoup de graphiques deja presents dans Vue d'ensemble (funnel, genre, rank, abandons)
- Pas de separation claire entre "performance business" et "profil utilisateurs"

## Nouvelle organisation en 5 onglets

### 1. Vue d'ensemble (KPIs + tendances)
- Filtres de date (inchange)
- 7 KPI cards (inchange)
- Evolution quotidienne (diagnostics + vues + taux)
- Entonnoir de conversion
- Derniers diagnostics completes

### 2. Acquisition (trafic + sources)
- Trafic par Source / Medium (UTM)
- Repartition par device
- Sources des diagnostics
- Taux de conversion vues → diagnostics

### 3. Abandons (ou les utilisateurs decrochent)
- Abandons par ecran (graphique existant)
- Abandons par question (graphique existant)
- Les deux graphiques sur toute la largeur, bien lisibles

### 4. Profils utilisateurs (qui sont les utilisateurs)
- Repartition par sexe
- Repartition par age
- Sports les plus pratiques
- Score moyen par sport
- Boissons les plus consommees
- Activite par heure

### 5. Resultats (scores et recommandations)
- Repartition des scores (buckets fins)
- Score moyen par tranche d'age
- Hydra Rank
- Pastilles recommandees (distribution + par rank)

### 6. Demandes d'aide (inchange)

## Changements techniques

- **Supprimer `AnalyticsCharts.tsx`** — son contenu est redistribue dans de nouveaux composants
- **Creer 4 nouveaux composants** :
  - `AdminAcquisition.tsx` — UTM, devices, sources
  - `AdminAbandons.tsx` — abandons par ecran + par question
  - `AdminProfiles.tsx` — sexe, age, sports, boissons, heure
  - `AdminResults.tsx` — scores, ranks, pastilles
- **Simplifier `AdminOverview.tsx`** — ne garde que KPIs, evolution, entonnoir, derniers diagnostics
- **Mettre a jour `AdminDashboard.tsx`** — 6 onglets au lieu de 4

Les filtres de date restent dans Vue d'ensemble. Les autres onglets utilisent les donnees globales (comme Analyses actuellement).

| Fichier | Action |
|---------|--------|
| `src/pages/AdminDashboard.tsx` | 6 onglets |
| `src/components/admin/AdminOverview.tsx` | Allege (KPIs + evolution + funnel + tableau) |
| `src/components/admin/AdminAcquisition.tsx` | Nouveau — UTM, devices, sources |
| `src/components/admin/AdminAbandons.tsx` | Nouveau — abandons ecran + question |
| `src/components/admin/AdminProfiles.tsx` | Nouveau — sexe, age, sports, boissons |
| `src/components/admin/AdminResults.tsx` | Nouveau — scores, ranks, pastilles |
| `src/components/admin/AnalyticsCharts.tsx` | Supprime |

