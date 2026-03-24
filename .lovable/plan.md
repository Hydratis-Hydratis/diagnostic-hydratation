

# Tracking des abandons par question individuelle

## Principe

Actuellement, `last_seen_step` enregistre l'ecran thematique (Profil, Activite physique, etc.). Pour savoir a quelle question precise l'utilisateur abandonne, il faut enregistrer l'ID de la derniere question vue/repondue.

## Approche

### 1. Nouvelle colonne `last_seen_question` dans `diagnostics`

Colonne texte nullable qui stocke l'ID de la derniere question affichee ou repondue (ex: `"age"`, `"sport_pratique"`, `"boissons_journalieres"`).

### 2. Sauvegarder la question courante dans `ThematicScreen.tsx`

A chaque fois que l'utilisateur repond a une question dans un ecran thematique (changement de valeur d'un champ), appeler un update leger pour enregistrer l'ID de cette question. On reutilise le mode `step_update` existant de l'edge function en ajoutant le champ `last_seen_question`.

### 3. Modifier l'edge function `save-diagnostic-progress`

Accepter `last_seen_question` dans le mode `step_update` et le sauvegarder.

### 4. Modifier l'edge function `admin-analytics`

- Pour les diagnostics abandonnes, utiliser `last_seen_question` pour construire un `abandonByQuestion: Record<string, number>` (ex: `{ "age": 45, "sport_pratique": 30, ... }`).
- Pour les anciens enregistrements sans `last_seen_question`, inferer depuis les cles presentes dans `diagnostic_data` (derniere cle remplie dans l'ordre des questions).
- Retourner un mapping `questionLabels` avec les libelles lisibles (ex: `"age"` → `"Âge"`, `"boissons_journalieres"` → `"Boissons"`).

### 5. Nouveau graphique dans `AnalyticsCharts.tsx`

Remplacer ou completer le graphique "Abandons par ecran" par un graphique en barres horizontales "Abandons par question" montrant chaque question individuellement, avec le libelle court en ordonnee.

## Inference pour les anciens enregistrements

L'ordre des questions est connu. Pour chaque diagnostic abandonne sans `last_seen_question`, parcourir la liste des IDs dans l'ordre et trouver le dernier present dans `diagnostic_data`. La question suivante est celle ou l'utilisateur a abandonne.

## Fichiers concernes

| Fichier | Modification |
|---------|-------------|
| Migration SQL | Ajouter colonne `last_seen_question` |
| `supabase/functions/save-diagnostic-progress/index.ts` | Accepter `last_seen_question` dans `step_update` |
| `src/lib/diagnosticsRepo.ts` | Ajouter `lastSeenQuestion` au mode `step_update` |
| `src/lib/saveDiagnostic.ts` | Nouvelle fonction `updateLastSeenQuestion(questionId)` |
| `src/components/ThematicScreen.tsx` | Appeler `updateLastSeenQuestion` quand une reponse change |
| `supabase/functions/admin-analytics/index.ts` | Calculer `abandonByQuestion` + inference anciens |
| `src/components/admin/AnalyticsCharts.tsx` | Graphique abandons par question |

