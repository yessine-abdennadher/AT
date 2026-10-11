# Diagnostic Admin, Télémétrie d'Usage, Partenaire Pro & Mode Éclairage/Électricité Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implémenter le système de diagnostic d'usage (sessions et top sections) pour l'Admin, la surveillance des partenaires actifs/inactifs, les horaires d'ouverture/fermeture par activité, le mode direct électricité/lumière avec lampe allumée sur la carte, et la gestion du statut Partenaire Pro autorisant les événements et promotions.

**Architecture:** Modèle `Telemetry` MongoDB pour collecter les sessions et vues d'écrans; extension de `User` avec `partnerTier` et suivi d'activité; extension d'`Activity` avec horaires, `powerBackupMode`, événements et promotions; endpoints d'administration et de télémétrie; intégration dans l'UI mobile (ActivityCard, PartnerDashboardScreen, AdminDashboardScreen).

**Tech Stack:** Node.js/Express, Mongoose, React Native/Expo, TypeScript.

**Spec:** `docs/superpowers/specs/2026-10-10-admin-diagnostics-partner-pro-lighting.md`

## Global Constraints
- Maintenir la compatibilité stricte avec MongoDB sans régression sur les 15 tests existants.
- Exécution de `npx tsc --noEmit` avec 0 erreur TypeScript.
- Les requêtes de télémétrie doivent être non bloquantes et silencieuses en cas de coupure réseau.

## Review Focus
1. Télémétrie en mode hors-ligne : ne doit jamais bloquer la navigation mobile.
2. Protection RBAC Partenaire Pro : un partenaire standard ne peut pas forcer l'ajout d'une promotion via l'API.
3. Affichage visuel du mode lampe : icône dorée avec halo bien visible sur fond sombre et fond clair.
4. Calcul des horaires : gestion propre des heures franchissant minuit (ex: 18:00 - 02:00).
5. Mise à jour de dernière activité : enregistrer `lastActivityUpdate` à chaque modification d'activité.

---

### Task 1: Backend Modèles et Télémétrie (Telemetry & User/Activity schemas)

**Files:**
- Create: `backend/models/Telemetry.js`
- Create: `backend/services/telemetry.service.js`
- Create: `backend/controllers/telemetry.controller.js`
- Create: `backend/routes/telemetry.routes.js`
- Modify: `backend/models/User.js`
- Modify: `backend/models/Activity.js`
- Modify: `backend/server.js`
- Test: `backend/tests/telemetry.test.js`

- [ ] **Step 1: Écrire le test automatisé `backend/tests/telemetry.test.js`**
- [ ] **Step 2: Créer le modèle `Telemetry.js` et mettre à jour `User.js` et `Activity.js`**
- [ ] **Step 3: Implémenter `telemetry.service.js`, `telemetry.controller.js` et monter la route dans `server.js`**
- [ ] **Step 4: Exécuter les tests backend pour valider**

---

### Task 2: Backend Admin Diagnostics & Partner Tiering

**Files:**
- Modify: `backend/services/admin.service.js`
- Modify: `backend/controllers/admin.controller.js`
- Modify: `backend/routes/admin.routes.js`
- Modify: `backend/services/activity.service.js`
- Modify: `backend/controllers/activity.controller.js`
- Modify: `backend/routes/activity.routes.js`
- Test: `backend/tests/admin-diagnostics.test.js`

- [ ] **Step 1: Écrire le test `backend/tests/admin-diagnostics.test.js`**
- [ ] **Step 2: Implémenter `getPlatformDiagnostics()` et `updatePartnerTier()` dans `admin.service.js`**
- [ ] **Step 3: Implémenter le toggle `powerBackupMode`, l'ajout d'événements et de promotions dans `activity.service.js` avec vérification du tier Pro**
- [ ] **Step 4: Exécuter les tests et valider le comportement RBAC**

---

### Task 3: Mobile Telemetry Service & Navigation Tracking

**Files:**
- Create: `activitytn/src/services/telemetryService.ts`
- Modify: `activitytn/src/types/index.ts`
- Modify: `activitytn/App.tsx`

- [ ] **Step 1: Ajouter les types dans `activitytn/src/types/index.ts` (`PartnerTier`, `ActivityEvent`, `ActivityPromotion`, `TelemetryEvent`)**
- [ ] **Step 2: Créer `telemetryService.ts` avec envoi de sessions et suivi d'écrans**
- [ ] **Step 3: Intégrer l'appel au démarrage et sur les changements d'onglets dans `App.tsx`**

---

### Task 4: Mobile UI - ActivityCard avec Lampe Allumée 💡 et Horaires

**Files:**
- Modify: `activitytn/src/components/ActivityCard.tsx`
- Modify: `activitytn/src/screens/ActivityDetailsScreen.tsx`

- [ ] **Step 1: Ajouter l'indicateur visuel lampe allumée (Golden Glow 💡) et badge d'heures d'ouverture sur `ActivityCard.tsx`**
- [ ] **Step 2: Mettre à jour `ActivityDetailsScreen.tsx` avec les horaires détaillés, le statut d'électricité et les événements musicaux / promos**

---

### Task 5: Mobile UI - Admin Dashboard Diagnostics & Attribution Pro

**Files:**
- Modify: `activitytn/src/services/adminService.ts`
- Modify: `activitytn/src/screens/AdminDashboardScreen.tsx`

- [ ] **Step 1: Ajouter les méthodes d'API diagnostics et attribution de Tier dans `adminService.ts`**
- [ ] **Step 2: Ajouter la section diagnostic (sessions, sections populaires, partenaires inactifs) et le bouton toggle PRO dans `AdminDashboardScreen.tsx`**

---

### Task 6: Mobile UI - Partner Dashboard (Mode Électricité, Événements & Promotions Pro)

**Files:**
- Modify: `activitytn/src/services/partnerService.ts`
- Modify: `activitytn/src/screens/PartnerDashboardScreen.tsx`

- [ ] **Step 1: Ajouter les méthodes de bascule électrique, ajout d'événements et ajout de promotions dans `partnerService.ts`**
- [ ] **Step 2: Ajouter le switch direct "💡 Électricité / Lumière garantie" dans `PartnerDashboardScreen.tsx`**
- [ ] **Step 3: Ajouter la gestion des Événements & Promotions (avec badge PRO et déverrouillage conditionnel)**
- [ ] **Step 4: Valider avec `npx tsc --noEmit` et exécuter tous les tests backend**
