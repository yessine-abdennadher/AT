# Implementation Plan: Sistema d'Authentification Multi-Rôles (ActivityTN)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implémenter l'authentification multi-rôles (`user`, `partner`, `admin`) sécurisée par Access Token et Refresh Token sur le backend Express et l'application mobile React Native ActivityTN.

**Architecture:** Mettre à jour le modèle Mongoose `User` pour supporter les 3 rôles et les jetons de rafraîchissement. Ajouter les endpoints `/api/auth/refresh` et `/api/auth/logout`. Créer le script de seeding `seedUsers.js` pour insérer 3 comptes de test. Adapter `authService.ts` et `AuthScreen.tsx` côté frontend avec sélecteur de rôle et gestion automatique des jetons.

**Tech Stack:** Node.js, Express, Mongoose, JWT (jsonwebtoken), bcryptjs, React Native, Expo, TypeScript.

**Spec:** [`docs/superpowers/specs/2026-10-04-authentication-system-design.md`](file:///c:/Users/abdoy/.gemini/antigravity-ide/scratch/AT/docs/superpowers/specs/2026-10-04-authentication-system-design.md)

## Global Constraints

- Backend : Rôles autorisés = `["user", "partner", "admin"]`.
- Secret JWT harmonisé via `process.env.JWT_SECRET || "activitytn_secret_jwt_key_2026"`.
- Access Token expirable en `15m` ou `1h`. Refresh Token expirable en `7d`.
- Mobile/Frontend : Aucune dépendance externe cassant Expo Web/Native.
- Respect strict du fichier `AGENTS.md` (un fichier par écran, thèmes, i18n/RTL).

## Review Focus

- Enregistrement avec rôle `admin` refusé via la route publique `POST /api/auth/register` (seul `user` ou `partner` est autorisé à l'inscription publique).
- Tentative de `refresh` avec un token révoqué ou inexistant rejetée HTTP 401.
- Connexion d'un compte désactivé (`isActive: false`) rejetée HTTP 403.
- Maintien de la rétrocompatibilité des jetons et permissions dans `authService.ts`.

---

### Task 1: Mise à jour du Modèle Utilisateur Backend (`User.js`)

**Files:**
- Modify: `backend/models/User.js`

**Interfaces:**
- Produces: `User` Mongoose Model mis à jour avec `enum: ["user", "partner", "admin"]`, `establishmentName`, et `refreshTokens`.

- [ ] **Step 1: Mettre à jour le schéma Mongoose `User.js`**
  Modifier `role` pour accepter `user`, `partner`, et `admin`. Ajouter `establishmentName` (String, default `""`) et `refreshTokens` (`[{ type: String }]`).
- [ ] **Step 2: Vérifier la validité de la syntaxe JS**
  S'assurer qu'aucune erreur d'import ou de syntaxe n'est présente dans `backend/models/User.js`.
- [ ] **Step 3: Commit Task 1**
  `git add backend/models/User.js`
  `git commit -m "feat(backend): update User schema with partner role and refreshTokens"`

---

### Task 2: Contrôleur & Routes Backend Auth (`auth.controller.js` & `auth.routes.js`)

**Files:**
- Modify: `backend/controllers/auth.controller.js`
- Modify: `backend/routes/auth.routes.js`
- Modify: `backend/middlewares/auth.middleware.js`

**Interfaces:**
- Consumes: `User` model.
- Produces: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/me`.

- [ ] **Step 1: Implémenter les générateurs `generateAccessToken` (15m) et `generateRefreshToken` (7d) dans `auth.controller.js`**
- [ ] **Step 2: Modifier `registerUser` pour traiter le rôle (`user` ou `partner`) et stocker l'`establishmentName`**
  Conserver la sécurité interdisant de passer `admin` lors d'un `register` public.
- [ ] **Step 3: Implémenter `loginUser` pour émettre `accessToken` et `refreshToken` et sauvegarder le `refreshToken` dans le document `User`**
- [ ] **Step 4: Implémenter les fonctions `refreshToken` et `logoutUser` dans `auth.controller.js`**
- [ ] **Step 5: Enregistrer les routes `/refresh` et `/logout` dans `auth.routes.js`**
- [ ] **Step 6: Harmoniser la clé secrète JWT dans `auth.middleware.js`**
- [ ] **Step 7: Commit Task 2**
  `git add backend/`
  `git commit -m "feat(backend): implement access/refresh token mechanism and auth endpoints"`

---

### Task 3: Script de Seeding Backend Utilisateurs (`seedUsers.js`)

**Files:**
- Create: `backend/seeders/seedUsers.js`
- Modify: `backend/package.json:7-11`

**Interfaces:**
- Produces: Commande `npm run seed:users` alimentant la base MongoDB avec 3 comptes de test (Admin, Partenaire Café, Utilisateur Sfax).

- [ ] **Step 1: Créer le script `backend/seeders/seedUsers.js` avec connexion MongoDB et insertion idempotente des 3 comptes**
- [ ] **Step 2: Ajouter la commande `"seed:users": "node seeders/seedUsers.js"` dans `package.json`**
- [ ] **Step 3: Commit Task 3**
  `git add backend/seeders/seedUsers.js backend/package.json`
  `git commit -m "feat(backend): add seedUsers script for admin, partner, and user demo accounts"`

---

### Task 4: Mise à jour des Types & du Service Frontend (`types/index.ts` & `authService.ts`)

**Files:**
- Modify: `activitytn/src/types/index.ts`
- Modify: `activitytn/src/services/authService.ts`

**Interfaces:**
- Consumes: Endpoints `/api/auth/*`.
- Produces: `AuthUser`, `UserRole` (`'user' | 'partner' | 'admin'`), méthodes `login`, `register`, `logout`, `refreshAccessToken`.

- [ ] **Step 1: Mettre à jour `UserRole` et `USER_PERMISSIONS` dans `activitytn/src/types/index.ts` pour inclure le rôle `'partner'`**
- [ ] **Step 2: Mettre à jour `authService.ts` pour stocker `accessToken` et `refreshToken` et supporter le paramètre `role` / `establishmentName` dans `register()`**
- [ ] **Step 3: Ajouter la méthode `refreshAccessToken()` dans `authService.ts`**
- [ ] **Step 4: Commit Task 4**
  `git add activitytn/src/types/index.ts activitytn/src/services/authService.ts`
  `git commit -m "feat(frontend): update AuthUser types and authService with dual-token management"`

---

### Task 5: Mise à jour de l'Écran d'Authentification Frontend (`AuthScreen.tsx`)

**Files:**
- Modify: `activitytn/src/screens/AuthScreen.tsx`

**Interfaces:**
- Consumes: `authService.ts` (`login`, `register`).
- Produces: Écran d'inscription/connexion avec sélecteur de rôle (*Compte Utilisateur* vs *Compte Partenaire / Établissement*).

- [ ] **Step 1: Ajouter l'état `selectedRole` (`'user'` | `'partner'`) et le champ `establishmentName` pour l'inscription**
- [ ] **Step 2: Ajouter les boutons d'option visuels (Glassmorphism / Ionicons) pour le choix du rôle lors de l'onglet Inscription**
- [ ] **Step 3: Transmettre `role` et `establishmentName` à l'appel `register()` dans `handleEmailAuth()`**
- [ ] **Step 4: Vérifier la conformité visuelle et l'absence d'erreurs TypeScript**
- [ ] **Step 5: Commit Task 5**
  `git add activitytn/src/screens/AuthScreen.tsx`
  `git commit -m "feat(frontend): add partner role selector and establishment field to AuthScreen"`
