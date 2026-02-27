

# Tracking des vues de page et provenance du trafic

## Constat

Actuellement, les données de sourcing (UTM, referrer) ne sont capturées que lorsqu'un utilisateur **démarre un diagnostic**. Les simples visiteurs qui arrivent sur la page sans commencer le diagnostic ne sont pas trackés. Il n'y a pas de table `page_views`.

## Plan

### 1. Nouvelle table `page_views`

Migration SQL pour créer une table légère :

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid PK | Identifiant |
| `created_at` | timestamptz | Horodatage |
| `page_path` | text | Route visitée (/, /admin, etc.) |
| `utm_source` | text | Source UTM |
| `utm_medium` | text | Medium UTM |
| `utm_campaign` | text | Campagne UTM |
| `referrer` | text | Document referrer |
| `user_agent` | text | User agent |

RLS : INSERT anonyme autorisé, SELECT réservé aux admins, pas d'UPDATE/DELETE.

### 2. Tracking côté frontend

Créer `src/lib/trackPageView.ts` : une fonction appelée une fois au montage de `App.tsx` qui insère une ligne dans `page_views` avec les UTM params, referrer et user_agent. Dedupe avec `sessionStorage` pour ne pas recompter les reloads.

### 3. Edge function `admin-analytics` enrichie

Ajouter une requête paginée sur `page_views` (avec les mêmes filtres date) pour agréger :
- `totalViews` : nombre total de vues
- `viewsByDay` : vues par jour (pour le graphique d'évolution)
- `viewSourceMap` : top sources de trafic (toutes vues, pas seulement diagnostics)
- `viewDeviceMap` : répartition device des visiteurs
- `conversionRate` : ratio vues → diagnostics démarrés

### 4. Dashboard `AdminOverview.tsx`

- Ajouter une carte KPI "Vues totales" avec le taux de conversion vues→diagnostics
- Superposer les vues sur le LineChart d'évolution quotidienne existant (3e courbe)
- Ajouter un BarChart "Sources de trafic (toutes vues)" pour voir d'où viennent **tous** les visiteurs, pas seulement ceux qui démarrent un diagnostic

### Fichiers concernés

| Fichier | Action |
|---------|--------|
| Migration SQL | Créer table `page_views` + RLS |
| `src/lib/trackPageView.ts` | Nouveau : enregistrer une vue |
| `src/App.tsx` | Appeler `trackPageView()` au montage |
| `supabase/functions/admin-analytics/index.ts` | Agréger les page views |
| `src/components/admin/AdminOverview.tsx` | Afficher vues + sources + conversion |

