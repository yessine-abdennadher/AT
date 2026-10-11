# Design Spec: Intégration Backend API Activités & Gestion JWT (ActivityTN) ⚡

**Date**: 2026-10-04  
**Statut**: Validé par l'utilisateur  

---

## 1. Objectifs & Vue d'ensemble

Transférer la logique métier de gestion des activités vers le backend Node.js / Express / MongoDB et connecter le frontend React Native (Expo) via un service API dédié (`activityService.ts`).

### Principes clés :
1. **Rôles & Autorisations** :
   - Ingestion et modification d'activités réservées aux utilisateurs authentifiés avec le rôle `admin` ou `partner` (Propriétaire de café/restaurant/espace).
   - Les partenaires ne peuvent modifier/supprimer que leurs propres activités (`createdBy === req.user.id`), tandis que les administrateurs ont tous les droits.
2. **Gestion des En-têtes JWT (Headers)** :
   - Envoi systématique de `Authorization: Bearer <accessToken>` depuis `activityService.ts` pour toutes les requêtes authentifiées.
   - Tentative de rafraîchissement automatique du token via `refreshAccessToken()` si HTTP 401.
3. **Consommation Frontend & Rétrocompatibilité** :
   - Création de `activitytn/src/services/activityService.ts`.
   - Utilisation des données MongoDB backend avec repli gracieux sur `mockData.js` en cas de déconnexion du serveur.

---

## 2. Endpoints Backend (`backend/routes/activity.routes.js`)

| Méthode | Route | Middleware | Description |
|---|---|---|---|
| `GET` | `/api/activities` | Optionnel (`protect`) | Liste des activités filtrables (`city`, `category`, `search`) |
| `GET` | `/api/activities/:id` | Optionnel | Détails d'une activité spécifique |
| `POST` | `/api/activities` | `protect`, `authorize('admin', 'partner')` | Création d'une nouvelle activité |
| `PUT` | `/api/activities/:id` | `protect`, `authorize('admin', 'partner')` | Modification d'une activité existante |
| `DELETE` | `/api/activities/:id` | `protect`, `authorize('admin', 'partner')` | Suppression d'une activité |
