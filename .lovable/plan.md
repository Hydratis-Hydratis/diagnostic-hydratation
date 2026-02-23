

# Nettoyage des lignes vides dans la base de donnees

## Constat

Sur **1 434 diagnostics** en base :
- **1 230** sont completement vides (status "started", diagnostic_data = `{}`, aucun score, email ou prenom)
- **189** sont des diagnostics completes avec toutes les donnees
- **15** ont des donnees partielles (en cours de progression)

Les 1 230 lignes vides correspondent a des sessions ou l'utilisateur a ouvert la page sans jamais repondre a une question.

## Action

Supprimer les **1 230 lignes** qui remplissent toutes ces conditions :
- `status = 'started'`
- `diagnostic_data::text = '{}'` (aucune reponse enregistree)
- `score IS NULL`
- `email IS NULL`
- `first_name IS NULL`

Les 15 lignes avec des donnees partielles seront conservees (elles contiennent des reponses dans diagnostic_data).

## Details techniques

Une seule requete DELETE via l'outil d'insertion de donnees :

```sql
DELETE FROM diagnostics
WHERE status = 'started'
  AND diagnostic_data::text = '{}'
  AND score IS NULL
  AND email IS NULL
  AND first_name IS NULL;
```

Aucune modification de code ou de schema necessaire.

## Resultat attendu

Apres nettoyage, la base contiendra **204 diagnostics** (189 completes + 15 en cours avec donnees).
