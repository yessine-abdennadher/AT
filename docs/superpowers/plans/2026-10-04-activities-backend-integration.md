# Implementation Plan: Intégration Backend API Activités & Gestion JWT (ActivityTN)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implémenter les autorisations multi-rôles (`admin`, `partner`) sur les routes d'activités backend et créer le service frontend `activityService.ts` avec en-têtes `Authorization: Bearer <token>`.

**Architecture:** Modifier `activity.routes.js` et `activity.controller.js` pour autoriser les partenaires et vérifier la propriété des ressources. Développer `activityService.ts` dans l'application Expo pour effectuer les appels API avec jetons JWT.

**Tech Stack:** Node.js, Express, Mongoose, React Native, TypeScript, Expo.

**Spec:** [`docs/superpowers/specs/2026-10-04-activities-backend-integration.md`](file:///c:/Users/abdoy/.gemini/antigravity-ide/scratch/AT/docs/superpowers/specs/2026-10-04-activities-backend-integration.md)

## Global Constraints

- En-tête de requête : `Authorization: Bearer <accessToken>`.
- Rôles autorisés pour modification/création : `admin` et `partner`.
- Un partenaire ne peut modifier que ses propres activités (`createdBy === req.user.id`).

---

### Task 1: Mise à jour des Autorisations & Contrôleur Backend Activités

**Files:**
- Modify: `backend/routes/activity.routes.js`
- Modify: `backend/controllers/activity.controller.js`

- [ ] **Step 1: Mettre à jour `activity.routes.js` pour accorder les permissions aux rôles `admin` et `partner`**
  `authorize("admin", "partner")` pour `POST`, `PUT`, `DELETE`.
- [ ] **Step 2: Mettre à jour `activity.controller.js` pour valider la propriété de l'activité lors d'une modification ou suppression par un partenaire**
- [ ] **Step 3: Commit Task 1**
  `git add backend/`
  `git commit -m "feat(backend): allow partner role to manage activities with ownership check"`

---

### Task 2: Création du Service API Frontend `activityService.ts`

**Files:**
- Create: `activitytn/src/services/activityService.ts`

- [ ] **Step 1: Implémenter `fetchWithAuth` incluant le token dans le header `Authorization`**
- [ ] **Step 2: Implémenter `getActivities()`, `getActivityById()`, `createActivity()`, `updateActivity()`, `deleteActivity()` dans `activityService.ts`**
- [ ] **Step 3: Repli gracieux sur `mockData.js` si le serveur backend n'est pas joignable**
- [ ] **Step 4: Commit Task 2**
  `git add activitytn/src/services/activityService.ts`
  `git commit -m "feat(frontend): implement activityService with JWT bearer token header support"`
