

# Ajouter le rôle admin pour pierre@hydratis.co

## Problème

Le compte `pierre@hydratis.co` s'authentifie avec succès mais est redirigé vers la page de login car il ne possède pas le rôle `admin` dans la table `user_roles`. Seul `anatole@hydratis.co` a ce rôle actuellement.

## Correction

Une seule migration SQL pour insérer le rôle admin :

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('a10f832d-4c20-476d-9387-8bce9d738089', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

Aucun fichier code à modifier.

