

# Espace Admin + Chat d'aide

## Vue d'ensemble

Creation d'un espace `/admin` protege par authentification avec :
1. Un tableau de bord des diagnostics completes
2. Des graphiques d'analyse des reponses
3. Un systeme de chat d'aide accessible depuis le site public, avec collecte email/telephone
4. Une interface admin pour consulter et repondre aux demandes d'aide

---

## 1. Base de donnees

### Nouvelle table `support_requests`

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid (PK) | Identifiant unique |
| email | text NOT NULL | Email du visiteur |
| phone | text | Telephone du visiteur |
| name | text | Nom du visiteur |
| message | text NOT NULL | Message du visiteur |
| admin_reply | text | Reponse de l'admin |
| status | text | "pending" / "replied" / "closed" |
| created_at | timestamptz | Date de creation |
| replied_at | timestamptz | Date de reponse |

### Politiques RLS

- **anon INSERT** (permissive) : les visiteurs peuvent envoyer des demandes d'aide
- **authenticated SELECT** (permissive) : l'admin peut lire toutes les demandes
- **authenticated UPDATE** (permissive) : l'admin peut repondre aux demandes
- **authenticated SELECT sur diagnostics** (permissive) : l'admin peut consulter les resultats

### Compte admin

Un compte admin sera cree via l'authentification standard (email/mot de passe). L'admin se connecte sur `/admin/login`.

---

## 2. Pages et composants

### Routes

| Route | Composant | Description |
|-------|-----------|-------------|
| `/admin/login` | AdminLogin | Page de connexion admin |
| `/admin` | AdminDashboard | Tableau de bord principal (protege) |

### AdminLogin
- Formulaire email + mot de passe
- Connexion via l'authentification integree
- Redirection vers `/admin` apres connexion

### AdminDashboard (avec onglets)

**Onglet "Vue d'ensemble"**
- Nombre total de diagnostics (started vs completed)
- Taux de completion
- Score moyen
- Nombre de diagnostics aujourd'hui / cette semaine

**Onglet "Diagnostics"**
- Tableau paginable avec tous les diagnostics
- Colonnes : date, prenom, email, score, hydra_rank, status, sport
- Filtre par status (started/completed)
- Possibilite d'ouvrir le detail d'un diagnostic

**Onglet "Analyses"**
- Graphique en barres : repartition des scores (tranches 0-25, 25-50, 50-75, 75-100)
- Graphique en camembert : repartition homme/femme/autre
- Graphique en barres : repartition par tranche d'age
- Graphique en barres : sports les plus pratiques
- Graphique en courbe : evolution du nombre de diagnostics par jour
- Graphique en camembert : repartition des hydra_rank

**Onglet "Demandes d'aide"**
- Liste des demandes de support avec email, telephone, message, date
- Possibilite de repondre directement depuis l'interface
- Indicateur de statut (en attente / repondu / ferme)

### Widget Chat d'aide (site public)

- Bouton flottant en bas a droite sur la page du diagnostic
- Au clic, un panneau s'ouvre demandant :
  1. Email (obligatoire)
  2. Telephone (obligatoire)
  3. Nom (optionnel)
  4. Message (obligatoire)
- Soumission enregistree dans la table `support_requests`
- Message de confirmation apres envoi

---

## 3. Securite

- L'espace `/admin` est protege : si l'utilisateur n'est pas authentifie, il est redirige vers `/admin/login`
- Les politiques RLS garantissent que seuls les utilisateurs authentifies peuvent lire les diagnostics et les demandes d'aide
- Les visiteurs anonymes peuvent uniquement inserer des demandes d'aide (pas de lecture)
- Le SELECT sur `diagnostics` reste bloque pour les anonymes (seuls les admins authentifies y ont acces)

---

## 4. Fichiers a creer/modifier

| Fichier | Action |
|---------|--------|
| `supabase/migrations/...` | Creation table support_requests + politiques RLS |
| `src/pages/AdminLogin.tsx` | Page de connexion admin |
| `src/pages/AdminDashboard.tsx` | Dashboard principal avec onglets |
| `src/components/admin/AdminOverview.tsx` | Cartes de statistiques |
| `src/components/admin/DiagnosticsTable.tsx` | Tableau des diagnostics |
| `src/components/admin/AnalyticsCharts.tsx` | Graphiques d'analyse (recharts) |
| `src/components/admin/SupportRequests.tsx` | Gestion des demandes d'aide |
| `src/components/HelpChatWidget.tsx` | Widget chat flottant (site public) |
| `src/hooks/useAdminAuth.ts` | Hook de verification d'authentification |
| `src/App.tsx` | Ajout des routes /admin et /admin/login |

---

## 5. Technologies utilisees

- **recharts** (deja installe) pour les graphiques
- **Authentification integree** pour la connexion admin
- **Composants UI existants** (shadcn/ui) : Tabs, Table, Card, Dialog, Badge, Button, Input, Textarea

