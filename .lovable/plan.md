

# Plan de corrections

## 1. Transpiration : pre-selection de la valeur 5

**Probleme** : Le slider est visuellement positionne sur 5 mais `onSelect` n'est jamais appele tant que l'utilisateur ne touche pas le curseur. Le bouton "Continuer" reste donc desactive.

**Solution** : Appeler `onSelect("5")` automatiquement au montage du composant si aucune valeur n'est deja selectionnee.

**Fichier** : `src/components/TranspirationScale.tsx`
- Ajouter un `useEffect` qui appelle `onSelect(initialValue.toString())` au premier rendu si `value` est vide.

---

## 2. Deplacer prenom et email juste apres le profil physique

**Probleme** : Prenom et email sont demandes a la toute fin du formulaire (etape "Informations"). Beaucoup d'utilisateurs abandonnent avant, ce qui genere des `null` dans la base.

**Solution** : 
- Deplacer les questions `firstName` et `email` dans l'etape "Profil" (elles apparaitront sur le meme ecran que les infos physiques).
- Adapter le texte pour une transition naturelle : "D'ailleurs, apprenons a faire connaissance !"
- Comme `updateDiagnosticProgress` sauvegarde deja email et first_name a chaque etape, ces donnees seront capturees des la premiere soumission.

**Fichiers modifies** :

### `src/data/questions.ts`
- Ajouter `step: "Profil"` aux questions `firstName` et `email`
- Mettre a jour les textes :
  - firstName : "D'ailleurs, quel est ton prenom ?"
  - email : "Et ton adresse email ? (pour recevoir ton diagnostic)"

### `src/components/DiagnosticChat.tsx`
- Supprimer l'etape "Informations" de `stepOrder` et `stepIcons` (plus de questions dans cette categorie)
- Mettre a jour le message de transition si necessaire

### Verification Klaviyo
- Le code actuel dans `saveDiagnostic.ts` envoie deja `email` et `first_name` vers Klaviyo via `syncToKlaviyo()` - aucun changement necessaire.
- `upsertDiagnosticProgress` dans `diagnosticsRepo.ts` sauvegarde deja `email` et `first_name` a chaque mise a jour partielle - les donnees seront collectees meme si l'utilisateur abandonne apres l'etape Profil.

---

## Resume des changements

| Fichier | Modification |
|---------|-------------|
| `TranspirationScale.tsx` | Ajouter useEffect pour pre-valider la valeur 5 |
| `data/questions.ts` | Deplacer firstName/email dans step "Profil", adapter les textes |
| `DiagnosticChat.tsx` | Retirer l'etape "Informations" du stepOrder |

