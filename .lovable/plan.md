
# Correction des mises a jour de diagnostics

## Probleme identifie

PostgREST (le moteur REST de la base de donnees) a besoin de pouvoir "voir" une ligne pour la mettre a jour. La politique `"Deny anon select on diagnostics"` avec `USING(false)` rend toutes les lignes invisibles pour les utilisateurs anonymes. Meme avec une politique UPDATE permissive, PostgREST ne trouve aucune ligne correspondant au filtre `.eq('id', diagnosticId)`, donc 0 lignes sont modifiees -- sans erreur.

C'est pour cela que :
- L'INSERT fonctionne (pas besoin de SELECT)
- Le certificat est genere (l'edge function utilise la cle service_role qui bypass RLS)
- Toutes les mises a jour client echouent silencieusement (email, prenom, score, status restent null)

## Solution

Creer une edge function `save-diagnostic-progress` qui effectue les mises a jour cote serveur avec la cle service_role, exactement comme l'edge function de generation de certificat. Cela contourne le probleme RLS sans compromettre la securite (les donnees restent protegees en lecture).

### Nouvelle edge function : `save-diagnostic-progress`

Cette function recoit le `diagnosticId` et les donnees a mettre a jour, puis fait l'UPDATE avec la cle service_role.

Deux modes :
- **progress** : sauvegarde partielle (diagnostic_data, email, first_name, age, sexe)
- **completion** : sauvegarde finale (tous les champs + status "completed")

### Modifications cote client

| Fichier | Modification |
|---------|-------------|
| `supabase/functions/save-diagnostic-progress/index.ts` | Nouvelle edge function pour les mises a jour |
| `src/lib/diagnosticsRepo.ts` | Remplacer `.update()` direct par appel a l'edge function |

### Securite

- L'edge function valide que le `diagnosticId` est un UUID valide
- Seul le champ `id` est utilise comme filtre (pas d'injection possible)
- Les donnees restent protegees en lecture (pas de SELECT anon)
- Aucune donnee sensible n'est exposee

### Flux mis a jour

```text
Client (anon) --> Edge Function (service_role) --> Database UPDATE
```

Au lieu de :

```text
Client (anon) --> Database UPDATE (bloque par RLS SELECT)
```
