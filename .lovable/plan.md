

# Fix de la limite 1000 lignes + Ajout filtre par date

## Probleme identifie

La requete Supabase dans l'edge function `admin-analytics` (ligne 72-74) utilise `.select()` sans pagination, ce qui est plafonne a **1000 lignes** par defaut par PostgREST. Le chiffre "1000 Total diagnostics" est donc tronque.

## Modifications

### 1. Edge function : pagination complete + filtre date

**Fichier** : `supabase/functions/admin-analytics/index.ts`

- Remplacer la requete simple par une boucle de pagination qui recupere **toutes les lignes** par tranches de 1000 (en utilisant `.range(from, to)`)
- Accepter les parametres `date_from` et `date_to` en query string pour filtrer par periode
- Appliquer le filtre `.gte("created_at", date_from)` et `.lte("created_at", date_to)` quand les parametres sont presents
- Meme logique de pagination pour l'export CSV

### 2. Frontend : selecteur de periode

**Fichier** : `src/components/admin/AdminOverview.tsx`

- Ajouter une barre de filtres en haut du dashboard avec :
  - Boutons rapides : "7 jours", "30 jours", "90 jours", "Tout"
  - Deux DatePickers (date debut / date fin) pour une periode personnalisee
- Passer `date_from` et `date_to` en query params a l'appel de l'edge function
- Re-fetcher les donnees quand le filtre change

### Fichiers concernes

| Fichier | Action |
|---------|--------|
| `supabase/functions/admin-analytics/index.ts` | Pagination + filtres date |
| `src/components/admin/AdminOverview.tsx` | UI filtres + passage des params |

