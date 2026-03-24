

# Renommer "Diagnostics" en "Commencés" dans le graphique quotidien

Changement simple dans `src/components/admin/AdminOverview.tsx` : renommer le label de la ligne `total` de `"Diagnostics"` en `"Commencés"` dans le `LineChart`.

| Fichier | Modification |
|---------|-------------|
| `src/components/admin/AdminOverview.tsx` | `name="Diagnostics"` → `name="Commencés"` sur la ligne `dataKey="total"` |

