# Plan d'Implémentation : Paliers Partenaires, Soirées & Promotions (End-to-End)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implémenter le flux complet de bout en bout permettant aux partenaires Pro de publier des promotions (sur tout ou sur un article) et aux partenaires Premium de publier des événements/soirées, avec répercussion instantanée sur le backend MongoDB, la Home page et la fiche détaillée.

**Architecture:** Modèle 3 tiers (`standard`, `pro`, `premium`) dans MongoDB, API Express avec contrôle RBAC par palier, passerelle de synchronisation dans `activityService.ts`, formulaires de saisie dédiés dans `PartnerDashboardScreen`, et affichage dynamique sur les composants Home et Détails.

**Tech Stack:** Node.js / Express, MongoDB / Mongoose, React Native (Expo), TypeScript.

**Spec:** [`c:\AT\docs\architecture_partenaire_tiers_et_flux_complet.md`](file:///c:/AT/docs/architecture_partenaire_tiers_et_flux_complet.md)

---

## Tâches d'implémentation

- [ ] **Tâche 1 : Backend - Modèles & Contrôles d'accès RBAC**
  - Mettre à jour `c:\AT\backend\models\User.js` pour accepter `partnerTier: ['standard', 'pro', 'premium']`.
  - Mettre à jour `c:\AT\backend\models\Activity.js` pour inclure `promoType: ['all', 'item']` et `targetItem` dans le sous-document `promotion`.
  - Mettre à jour `c:\AT\backend\services\activity.service.js` pour vérifier que `updatePromotion` est accessible aux tiers `['pro', 'premium']`, et `addEvent` aux tiers `['premium']`.

- [ ] **Tâche 2 : Frontend Mobile - Types & Passerelle `activityService.ts`**
  - Mettre à jour `c:\AT\activitytn\src\types\index.ts` pour `PartnerTier = 'standard' | 'pro' | 'premium'` et `ActivityPromotion`.
  - Corriger `mapActivity()` dans `c:\AT\activitytn\src\services\activityService.ts` pour mapper `events` et `promotion` depuis MongoDB.

- [ ] **Tâche 3 : Espace Partenaire - Formulaires & Actions Directes**
  - Mettre à jour `PartnerProPromoModal.tsx` pour permettre de choisir entre promotion sur tout (`all`) ou sur un article précis (`item`).
  - Vérifier et connecter les boutons "Ajouter Soirée" et "Ajouter Promo" sur chaque établissement dans `PartnerDashboardScreen.tsx`.

- [ ] **Tâche 4 : Affichage Fiche Détail (`ActivityDetailsScreen.tsx`)**
  - Ajouter l'affichage de la bannière Soirée et de la bannière Promo en haut de la fiche de l'activité.

- [ ] **Tâche 5 : Tests & Validation**
  - Vérifier la compilation TypeScript (`npx tsc --noEmit`).
  - Lancer les tests backend (`npm test` dans `c:\AT\backend`).
