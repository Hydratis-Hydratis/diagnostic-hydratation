

# Audit: Pourquoi les diagnostics ne sont pas sauvegardés dans le Cloud

## Diagnostic du probleme

### Ce que j'ai observe

1. **INSERT fonctionne (HTTP 201)** - La creation initiale du diagnostic dans la base reussit
2. **UPDATE via upsert echoue (HTTP 401)** - Toutes les mises a jour subsequentes echouent avec l'erreur RLS `42501`
3. **Tous les diagnostics restent en status "started"** avec des valeurs `null` pour email, first_name, score, etc.

### Cause racine identifiee

Le probleme vient de l'interaction entre **upsert()** et les **politiques RLS de SELECT**.

Quand le code appelle `.upsert(row, { onConflict: "id" })`, Supabase:
1. Tente d'inserer ou mettre a jour la ligne
2. **Par defaut, retourne la ligne inseree/mise a jour** (comportement RETURNING)
3. Ce RETURNING necessite une permission **SELECT** sur la ligne

Or, nos politiques RLS bloquent explicitement SELECT pour le role `anon`:

```text
Politique: "Deny anon select on diagnostics"
Commande: SELECT
USING: false  <-- Bloque toute lecture
```

Meme si INSERT et UPDATE sont autorises, l'operation echoue car PostgreSQL ne peut pas retourner la ligne.

## Solution proposee

Modifier le code pour utiliser l'option `{ returning: 'minimal' }` dans tous les appels upsert. Cette option indique a Supabase de ne pas retourner les donnees apres l'operation, evitant ainsi le besoin de permission SELECT.

### Fichiers a modifier

#### 1. `src/lib/diagnosticsRepo.ts`

Ajouter `count: 'exact'` aux appels upsert pour eviter le RETURNING:

```typescript
// Ligne 43-45 - upsertDiagnosticProgress
const { error } = await supabase
  .from("diagnostics")
  .upsert(row as any, { onConflict: "id", count: 'exact' });

// Ligne 90-92 - upsertDiagnosticCompletion  
const { error } = await supabase
  .from("diagnostics")
  .upsert(row as any, { onConflict: "id", count: 'exact' });
```

**Note**: L'option `count: 'exact'` modifie le comportement de retour pour ne retourner que le compte de lignes affectees, pas les donnees.

Alternativement, on peut utiliser un **UPDATE explicite** au lieu d'upsert pour les mises a jour (puisque la ligne existe deja apres l'INSERT initial).

### Approche recommandee: Separer INSERT et UPDATE

Plutot que d'utiliser upsert partout, le flux devient:
1. **INSERT initial** (dans `ensureDiagnosticId`) - Cree la ligne avec status "started"
2. **UPDATE explicite** (dans `upsertDiagnosticProgress` et `upsertDiagnosticCompletion`) - Met a jour la ligne existante

Cette approche est plus claire et evite les ambiguites RLS.

## Changements de code detailles

### `src/lib/diagnosticsRepo.ts`

Remplacer les appels `.upsert()` par `.update().eq('id', ...)`:

```typescript
// Pour upsertDiagnosticProgress (ligne 43-45)
const { error } = await supabase
  .from("diagnostics")
  .update(row as any)
  .eq('id', diagnosticId);

// Pour upsertDiagnosticCompletion (ligne 90-92)  
const { error } = await supabase
  .from("diagnostics")
  .update(row as any)
  .eq('id', diagnosticId);
```

**Important**: Retirer le champ `id` de l'objet `row` lors des updates pour eviter les erreurs.

## Flux apres correction

```text
1. Utilisateur clique "Commencer"
   -> ensureDiagnosticId() fait INSERT -> 201 OK
   
2. Utilisateur complete une etape  
   -> upsertDiagnosticProgress() fait UPDATE -> 200 OK (plus d'erreur RLS)
   
3. Utilisateur termine le diagnostic
   -> upsertDiagnosticCompletion() fait UPDATE -> 200 OK
   -> status passe a "completed", score/email/first_name sont remplis
```

## Resume technique

| Element | Avant | Apres |
|---------|-------|-------|
| Methode | `.upsert({ onConflict: "id" })` | `.update().eq('id', id)` |
| Probleme RLS | Necessite SELECT (bloque) | Ne necessite que UPDATE (autorise) |
| Resultat | 401 Unauthorized | 200 OK |

