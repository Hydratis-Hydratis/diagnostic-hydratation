

# Dashboard Admin ameliore : Vue d'ensemble riche + Tracking trafic

## Constat actuel

- L'onglet "Vue d'ensemble" n'affiche que **5 cartes KPI** sans aucun graphique
- Tous les graphiques sont relegues dans l'onglet "Analyses" separe
- Il reste **5 lignes vides** (status "started", diagnostic_data = `{}`) a nettoyer
- **Aucun tracking UTM/referrer** n'est capture : les colonnes utm_source, utm_medium, utm_campaign et referrer n'existent pas

## Plan d'action

### 1. Nettoyage des 5 lignes vides restantes

Suppression des 5 derniers enregistrements fantomes via une requete DELETE (meme criteres que le nettoyage precedent).

### 2. Capture du sourcing/tracking du trafic

**Modification de `diagnosticSession.ts`** : au moment de creer la ligne "started", capturer automatiquement les parametres UTM et le referrer depuis l'URL :
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
- `document.referrer` (page d'ou vient l'utilisateur)

Ces donnees seront stockees dans le champ JSONB `diagnostic_data` sous les cles `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `referrer`.

### 3. Enrichissement de l'edge function `admin-analytics`

Ajout de nouvelles agregations cote serveur :

| Donnee | Description |
|--------|-------------|
| `weeklyMap` | Evolution hebdomadaire (semaines glissantes) avec totaux et taux |
| `deviceMap` | Repartition Mobile / Desktop / Tablet (depuis user_agent) |
| `sourceMap` | Top sources de trafic (utm_source depuis diagnostic_data) |
| `mediumMap` | Repartition par medium (utm_medium) |
| `campaignMap` | Performance par campagne (utm_campaign) |
| `referrerMap` | Top referrers (document.referrer) |
| `scoreDistribution` | Distribution granulaire des scores (par 10 points) |
| `avgHydrationGap` | Ecart moyen d'hydratation en ml |
| `avgPastilles` | Nombre moyen de pastilles recommandees |
| `completionByDay` | Taux de completion jour par jour (pour sparklines) |
| `recentDiagnostics` | 10 derniers diagnostics completes (historique rapide) |

### 4. Refonte de l'onglet "Vue d'ensemble"

Transformation de `AdminOverview.tsx` en un vrai dashboard de monitoring avec :

**Ligne 1 - KPIs (5 cartes)** : Total diagnostics, Taux de completion, Score moyen, Cette semaine, Avec email (existants, conserves)

**Ligne 2 - Graphiques principaux (2 colonnes)** :
- Evolution quotidienne (LineChart) : volume total + completes + taux de completion sur les 30 derniers jours
- Entonnoir de conversion (BarChart horizontal) : Demarres -> Completes -> Avec email

**Ligne 3 - Distributions (3 colonnes)** :
- Repartition des scores (BarChart par tranches de 10)
- Repartition Hydra Rank (PieChart)
- Repartition par sexe (PieChart)

**Ligne 4 - Sourcing du trafic (2 colonnes)** :
- Sources de trafic (BarChart horizontal : utm_source)
- Repartition par device (PieChart : Mobile/Desktop/Tablet)

**Ligne 5 - Derniers resultats (tableau)** :
- Les 10 derniers diagnostics completes avec date, prenom, score, rang, sport (historique rapide sans changer d'onglet)

### 5. Fichiers a modifier

| Fichier | Action |
|---------|--------|
| `src/lib/diagnosticSession.ts` | Capturer UTM + referrer lors de la creation du diagnostic |
| `supabase/functions/admin-analytics/index.ts` | Ajouter les nouvelles agregations (sources, devices, weekly, recents) |
| `src/components/admin/AdminOverview.tsx` | Refonte complete : KPIs + graphiques + sourcing + historique |
| Base de donnees | Supprimer les 5 lignes vides restantes |

### 6. Details techniques

**Parsing du user_agent pour device** : detection simple cote edge function avec des regex sur les mots-cles (Mobile, Tablet, iPad, Android) pour categoriser en Mobile / Desktop / Tablet.

**Parsing UTM** : lecture de `diagnostic_data.utm_source`, `diagnostic_data.utm_medium`, etc. dans l'edge function. Les anciens diagnostics sans UTM seront simplement classes "Direct / Non renseigne".

**Pas de nouvelle table ni migration** : tout est stocke dans le JSONB `diagnostic_data` existant, et le `user_agent` est deja capture dans sa colonne dediee.

