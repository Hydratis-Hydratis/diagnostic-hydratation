

# Fix du graphique d'évolution quotidienne

## Problèmes

1. Le graphique en mode "Tout" remonte jusqu'au 28 novembre avec des mois de données vides
2. La courbe "Vues" est affichée alors qu'elle est insignifiante et écrase visuellement les autres courbes

## Corrections dans `src/components/admin/AdminOverview.tsx`

### 1. Plage par défaut : commencer au 17 février 2026

En mode "Tout", au lieu de partir de la première date dans `dailyMap`, forcer la date de début au **17 février 2026** (ou la première date avec données si elle est postérieure). Cela évite d'afficher 3 mois de zéros.

### 2. Masquer la courbe "Vues" tant que le volume est trop faible

Relever le seuil de `showVuesLine` (actuellement >= 5) à un seuil beaucoup plus élevé, ou simplement la masquer par défaut en hardcodant `showVuesLine = false` jusqu'à ce que le tracking ait accumulé suffisamment de données. Option recommandée : ne pas afficher la ligne "Vues" du tout pour le moment (seuil à >= 50 par exemple).

### Fichier concerné

| Fichier | Modification |
|---------|-------------|
| `src/components/admin/AdminOverview.tsx` | Date de début par défaut + masquer courbe Vues |

