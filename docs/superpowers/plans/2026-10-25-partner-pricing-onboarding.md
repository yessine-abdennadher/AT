# Grille Tarifaire Partenaires & Onboarding 4 Étapes — Plan d'Implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implémenter la nouvelle section interactive des Tarifs (`#tarifs`) et le Modal d'inscription Partenaire en 4 étapes (Formulaire, 2FA Email OTP, Attente Approbation Admin sous 24h, Confirmation) avec support complet Light/Dark Mode sur Tfarhida.tn.

**Architecture:** Création de `PricingSection.tsx` avec calcul dynamique mensuel/annuel (-25%), `PartnerOnboardingModal.tsx` avec machine à états (`step: 1 | 2 | 3 | 4`) et inputs OTP 6 chiffres, intégration dans `Navbar.tsx` et `App.tsx`, et styling CSS fluide.

**Tech Stack:** React 19, Vite 8, TypeScript, Lucide React, CSS Variables (Design Tokens Tfarhida).

**Spec:** [docs/superpowers/specs/2026-10-25-partner-pricing-onboarding-design.md](file:///c:/AT/docs/superpowers/specs/2026-10-25-partner-pricing-onboarding-design.md)

## Global Constraints
- Noms et marques : "Tfarhida.tn (تفرهيدة)".
- Tarifs officiels : Standard (0 DT), Pro (39 DT / mois ou 29 DT/mois annuel), Premium (89 DT / mois ou 69 DT/mois annuel).
- Quotas de notifications push : Standard (0), Pro (2 / mois), Premium (10 / mois).
- Numéro d'assistance WhatsApp officiel : `+216 74 000 000`.
- Aucun `browser_subagent` : vérification visuelle réservée à l'utilisateur.
- Zéro régression TypeScript (`npx tsc --noEmit`) et build Vite passant à 100%.

## Review Focus
1. Le toggle mensuel/annuel commute immédiatement les prix affichés (0 DT, 39 DT vs 29 DT/mois, 89 DT vs 69 DT/mois) et affiche le badge `-25%`.
2. Le modal s'ouvre avec le bon palier pré-sélectionné (Standard, Pro ou Premium).
3. La saisie du code 2FA à 6 chiffres gère l'auto-focus vers la case suivante et le collage (paste).
4. Le bouton WhatsApp à l'étape 3 génère un lien avec message encodé incluant le nom de l'établissement saisi.
5. Les styles sont 100% lisibles et contrastés en Light Mode comme en Dark Mode.

---

### Task 1: Tokens CSS & Classes Utilitaires (Pricing & Modal OTP)

**Files:**
- Modify: `c:\AT\landing\src\index.css:430-490`

**Interfaces:**
- Produces: classes CSS `.pricing-card`, `.pricing-toggle`, `.otp-input`, `.step-indicator` compatibles Light/Dark mode.

- [x] **Step 1: Ajouter les classes de style pour les cartes de tarifs, le toggle switch et les cases OTP**
  - Cartes avec bordure dynamique, hover scale et box-shadow.
  - Switch pillulaire interactif avec transition douce.
  - Grille de 6 inputs carrés centrés avec bordure active Cyan.
- [x] **Step 2: Vérifier le build CSS**
  Run: `npx vite build`
  Expected: Success code 0.

---

### Task 2: Composant `PricingSection.tsx`

**Files:**
- Create: `c:\AT\landing\src\components\sections\PricingSection.tsx`

**Interfaces:**
- Consumes: design tokens CSS.
- Produces: `export const PricingSection: React.FC<{ onSelectPlan: (plan: 'standard' | 'pro' | 'premium') => void }>`

- [x] **Step 1: Créer le composant `PricingSection.tsx`**
  - Header avec badge « Forfaits Établissements & Partenaires ».
  - Switch Mensuel / Annuel (avec badge `-25% d'économie`).
  - 3 cartes : Standard (0 DT), Pro (39 DT / 29 DT), Premium (89 DT / 69 DT).
  - Quotas détaillés : Pro (2 push/mois), Premium (10 push/mois) et explications anti-spam.
  - Résumé visuel des 4 étapes d'inscription au bas de la section.
- [x] **Step 2: Vérifier la compilation TypeScript**
  Run: `npx tsc --noEmit`
  Expected: Success code 0.

---

### Task 3: Composant `PartnerOnboardingModal.tsx` (4 Étapes)

**Files:**
- Create: `c:\AT\landing\src\components\ui\PartnerOnboardingModal.tsx`

**Interfaces:**
- Consumes: `selectedPlan: 'standard' | 'pro' | 'premium'`, `isOpen: boolean`, `onClose: () => void`.
- Produces: Modal interactif avec stepper `1 -> 2 -> 3 -> 4`.

- [x] **Step 1: Créer le composant `PartnerOnboardingModal.tsx`**
  - Étape 1 : Formulaire (Manager, Email, Mot de passe, Établissement, Tél WhatsApp, Ville, Pack).
  - Étape 2 : Écran 2FA avec 6 cases carrées, timer 60s, bouton renvoyer et simulation OTP.
  - Étape 3 : Écran d'attente d'approbation administrative sous 24h avec bouton WhatsApp Admin pré-rempli.
  - Étape 4 : Écran de confirmation de création avec récapitulatif.
- [x] **Step 2: Vérifier la compilation TypeScript**
  Run: `npx tsc --noEmit`
  Expected: Success code 0.

---

### Task 4: Intégration dans `Navbar.tsx` et `App.tsx`

**Files:**
- Modify: `c:\AT\landing\src\components\layout\Navbar.tsx`
- Modify: `c:\AT\landing\src\App.tsx`

**Interfaces:**
- Consumes: `PricingSection`, `PartnerOnboardingModal`.
- Produces: Intégration transparente dans la navigation et ouverture du modal.

- [x] **Step 1: Mettre à jour `Navbar.tsx`**
  - Ajouter le lien `#tarifs` dans le menu de navigation desktop.
  - Modifier le bouton « Espace Pro » pour ouvrir directement le modal avec le plan Pro pré-sélectionné.
- [x] **Step 2: Mettre à jour `App.tsx`**
  - Ajouter l'état `isOnboardingOpen` et `selectedTier`.
  - Insérer `<PricingSection onSelectPlan={...} />` avant le footer.
  - Insérer `<PartnerOnboardingModal isOpen={...} onClose={...} initialPlan={...} />`.
- [x] **Step 3: Vérifier le build complet**
  Run: `npx tsc --noEmit ; npx vite build`
  Expected: Success code 0.

---

### Task 5: Vérification Globale & Recette

**Files:**
- All touched files.

- [ ] **Step 1: Tester le serveur de développement en tâche de fond**
  Vérifier que Vite recharge les modules sans erreur.
- [ ] **Step 2: Présenter la synthèse à l'utilisateur pour son inspection écran**
