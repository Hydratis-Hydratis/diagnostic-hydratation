

# Corrections admin : donnees completes, analyses ameliorees, export

## 1. Probleme des donnees manquantes

La base de donnees contient **1 233 diagnostics** mais le dashboard n'en affiche que **1 000** a cause de la limite par defaut des requetes (plafond a 1000 lignes). De plus, toutes les politiques RLS de la table `diagnostics` sont en mode **RESTRICTIVE** au lieu de **PERMISSIVE**, ce qui devrait normalement bloquer tout acces.

### Corrections

**a) Politiques RLS** : Remplacer la politique admin SELECT restrictive par une politique **permissive** pour que l'admin puisse reellement lire les donnees.

```sql
DROP POLICY IF EXISTS "admin_select_diagnostics" ON public.diagnostics;
DROP POLICY IF EXISTS "Deny authenticated select on diagnostics" ON public.diagnostics;

CREATE POLICY "admin_select_diagnostics"
  ON public.diagnostics
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
```

Meme correction pour `support_requests` et `user_roles`.

**b) Depassement de la limite 1000 lignes** : Modifier `AdminOverview.tsx` et `AnalyticsCharts.tsx` pour utiliser une edge function qui agrege les donnees cote serveur avec la cle service_role (pas de limite de lignes).

### Nouvelle edge function : `admin-analytics`

- Utilise la cle `service_role` pour bypasser la limite de 1000 lignes
- Retourne les statistiques pre-calculees (totaux, moyennes, distributions)
- Necessite un token admin valide (verification du role)

## 2. Analyses ameliorees

Ajout de nouveaux graphiques et indicateurs dans l'onglet Analyses :

| Graphique | Type | Description |
|-----------|------|-------------|
| Taux de completion par jour | Ligne | Evolution du ratio completes/demarres |
| Heatmap horaire | Barres groupees | Heures de la journee les plus actives |
| Score moyen par sport | Barres horizontales | Comparaison des scores entre sports |
| Score moyen par tranche d'age | Barres | Correlation age/hydratation |
| Entonnoir de conversion | Barres horizontales | Demarres -> Completes -> Avec email |
| Boissons les plus consommees | Barres | Extraction depuis diagnostic_data |

## 3. Fonction d'export

Ajout d'un bouton d'export CSV dans l'onglet Diagnostics :

- Bouton "Exporter CSV" dans la barre de filtres
- Exporte **tous** les diagnostics (pas seulement la page courante)
- Utilise l'edge function `admin-analytics` pour recuperer toutes les donnees
- Colonnes exportees : date, prenom, email, age, sexe, sport, score, rang, besoin_total_ml, hydratation_reelle_ml, ecart_hydratation_ml, pastilles, status
- Telechargement automatique du fichier CSV

## 4. Fichiers a creer/modifier

| Fichier | Action |
|---------|--------|
| `supabase/migrations/...` | Corriger les politiques RLS (PERMISSIVE) |
| `supabase/functions/admin-analytics/index.ts` | Nouvelle edge function pour aggregation |
| `src/components/admin/AdminOverview.tsx` | Utiliser l'edge function |
| `src/components/admin/AnalyticsCharts.tsx` | Nouveaux graphiques + utiliser edge function |
| `src/components/admin/DiagnosticsTable.tsx` | Bouton export CSV |

## 5. Securite

- L'edge function `admin-analytics` verifie le token JWT et le role admin avant de retourner les donnees
- Les politiques RLS permissives pour l'admin restent securisees (seuls les utilisateurs avec le role `admin` dans `user_roles` ont acces)
- L'export CSV passe par la meme verification d'authentification

