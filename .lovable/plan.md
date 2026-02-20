

# Corrections coordonnees Hydratis + Certificat fidele au rendu

## 1. Coordonnees Hydratis a corriger

Le certificat SVG affiche actuellement **hydratis.fr** au lieu de **hydratis.co**. Les coordonnees completes doivent etre ajoutees partout.

### Fichiers concernes

| Fichier | Probleme | Correction |
|---------|----------|------------|
| `supabase/functions/generate-certificate/index.ts` | "hydratis.fr" dans le footer SVG | Remplacer par "hydratis.co" + ajouter tel et email |

Les liens dans `ResultsDisplay.tsx` sont deja corrects (hydratis.co).

---

## 2. Certificat fidele au compte rendu

Le certificat actuel est un SVG simplifie (3 cartes + jauge). Le compte rendu reel contient beaucoup plus de sections :

- Tableau de bord (score + badge + percentile, eau a boire, pastilles)
- Jauge d'hydratation animee avec comparaison
- CTA Decouvrir Hydratis
- Plan d'hydratation quotidien (besoins de base + besoins sport)
- Avertissements personnalises (grossesse, age, crampes, chaleur)
- Accordeons educatifs
- Defis hydratation
- CTA Commander

### Approche : SVG enrichi multi-sections

Le certificat SVG sera reecrit pour reproduire fidelement toutes les sections visibles du compte rendu. Le SVG passera de 800px de hauteur a ~1800px pour tout inclure :

**Section 1 - Header** : "Ton diagnostic est pret, [Prenom] !" + sous-titre

**Section 2 - Tableau de bord (3 cartes)** :
- Score d'hydratation avec badge (Hydra'debutant/initie/avance/champion)
- Quantite d'eau a boire par jour (+ mention sport si applicable)
- Pastilles recommandees (ou message population sensible)

**Section 3 - Jauge de comparaison** :
- Barre horizontale avec remplissage proportionnel
- Labels "Ton hydratation quotidienne" et "Ton ideal"
- Pourcentage affiche
- Message de progression ("Encore X.XL a boire" ou "Excellent !")

**Section 4 - Plan d'hydratation quotidien** :
- Colonne gauche : Besoin en eau/jour, pastilles basales, detail (besoin total, alimentation, boisson)
- Colonne droite : Si sportif -> besoins additionnels + sport pratique + frequence/duree/transpiration

**Section 5 - Avertissements** (conditionnel) :
- Messages pour grossesse, allaitement, personnes agees, enfants, crampes, chaleur

**Section 6 - Defis hydratation** :
- 3 cartes de defis personnalises

**Section 7 - Footer** :
- Logo HYDRATIS
- Coordonnees : hydratis.co | 01 89 71 32 00 | contact@hydratis.co
- Date du diagnostic

### Donnees supplementaires a transmettre

L'edge function recevra des donnees additionnelles depuis le client pour reproduire le rendu complet :

- `sports_selectionnes` : liste des sports avec noms et categories
- `frequence` : frequence d'entrainement
- `duree_minutes` : duree des seances
- `transpiration` : niveau de transpiration (1-10)
- `situation_particuliere` : enceinte/allaitante/etc
- `age` : pour les messages d'avertissement
- `urine_couleur` : pour les defis
- `crampes` : pour les avertissements et defis
- `temperature_ext` : pour les avertissements chaleur
- `besoins_basals_brut_ml` : besoin total avant deduction alimentation
- `nb_pastilles_basal` : pastilles quotidiennes
- `nb_pastilles_exercice` : pastilles sport
- `socialComparison` : percentile (recupere via l'edge function get-score-percentile)

### Fichiers a modifier

| Fichier | Modification |
|---------|-------------|
| `supabase/functions/generate-certificate/index.ts` | Reecrite complete du SVG : toutes les sections du compte rendu + coordonnees hydratis.co |
| `src/lib/saveDiagnostic.ts` | Transmettre les donnees supplementaires (sports, frequence, situation, age, etc.) a l'edge function |

### Securite et performance

- Le SVG reste genere cote serveur (pas de dependance navigateur)
- La taille du fichier augmentera mais restera legere (~15-20 KB en SVG)
- Le stockage et l'URL publique restent identiques
- Aucune modification de base de donnees necessaire

