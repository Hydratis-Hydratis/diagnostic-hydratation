

# Correction des politiques RLS de la table diagnostics

## Probleme identifie

Les politiques RLS "Allow anon insert diagnostics" et "Allow anon update diagnostics" ont ete creees en mode **RESTRICTIVE** au lieu de **PERMISSIVE**. 

En PostgreSQL, les politiques RESTRICTIVE ne peuvent que restreindre davantage un acces deja accorde par une politique permissive. Comme il n'existe aucune politique permissive sur la table, aucun acces n'est accorde, meme pas INSERT ou UPDATE.

C'est pour cela que :
- L'INSERT initial fonctionne (probablement via un comportement par defaut de Supabase ou un cache)
- Tous les UPDATE echouent silencieusement
- email, first_name, score restent tous a `null`
- Aucun diagnostic ne passe jamais en status "completed"

## Solution

Supprimer les politiques restrictives existantes et les recreer en mode **PERMISSIVE** (qui est le mode par defaut de `CREATE POLICY`).

### Migration SQL a executer

```sql
-- Supprimer les politiques restrictives actuelles
DROP POLICY IF EXISTS "Allow anon insert diagnostics" ON public.diagnostics;
DROP POLICY IF EXISTS "Allow anon update diagnostics" ON public.diagnostics;
-- Aussi les versions avec espaces en fin de nom (vu dans les precedentes migrations)
DROP POLICY IF EXISTS "Allow anon insert diagnostics " ON public.diagnostics;
DROP POLICY IF EXISTS "Allow anon update diagnostics " ON public.diagnostics;

-- Recreer en mode PERMISSIVE (defaut)
CREATE POLICY "anon_insert_diagnostics"
  ON public.diagnostics
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon_update_diagnostics"
  ON public.diagnostics
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
```

Note : les noms de politiques sont changes pour eviter toute confusion avec les anciennes versions (et les problemes d'espaces en fin de nom).

### Aucun changement de code necessaire

Le code dans `diagnosticsRepo.ts` utilise deja correctement `.update().eq('id', diagnosticId)` -- seules les politiques RLS doivent etre corrigees.

## Resultat attendu

| Etape | Avant | Apres |
|-------|-------|-------|
| INSERT initial | Fonctionne | Fonctionne |
| UPDATE progres (email, prenom) | Echoue (RLS restrictive) | Fonctionne |
| UPDATE completion (score, status) | Echoue (RLS restrictive) | Fonctionne |
| Sync Klaviyo | Donnees nulles | Donnees completes |

