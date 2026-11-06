# Plan d'implémentation : Enrichissement de la Modale Partenaire (Menu, Adresse, Commodités 1-Tap & Réseaux Sociaux)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrichir la modale de création/édition d'établissement (`PartnerActivityModal.tsx`) avec les éléments clés pour le marché tunisien : carte/menu digital, adresse précise avec repère, commodités activables en 1-tap (Wi-Fi, Terrasse, Parking, TPE), et lien Instagram.

**Architecture:** Mettre à jour les interfaces TypeScript (`PartnerActivityInput`, `PartnerActivityItem`), créer les composants de puces de commodités vectorielles, intégrer l'upload/lien du menu et l'adresse précise dans `PartnerActivityModal.tsx` tout en préservant la fluidité et le design épuré sans surcharger la modale.

**Tech Stack:** React Native (Expo), TypeScript, Ionicons (`@expo/vector-icons`), Cloudinary Upload Service, Mongoose backend.

---

## Global Constraints
- **Design System Tfarhida** : 100% Vectoriel (`@expo/vector-icons` - Ionicons), strictement aucun emoji dans le code ou les libellés.
- **Scroll & Ergonomie** : Défilement fluide dans `ScrollableModal`, champs optionnels non bloquants, clarté visuelle et lisibilité Dark/Light.
- **Téléphone & WhatsApp** : Nettoyage strict sans préfixe 216 hardcodé.
- **Compatibilité Backend** : Schema Mongoose avec `strict: false`, persistance transparente des nouveaux attributs.

---

## Tâches d'implémentation

### Tâche 1 : Mise à jour des Types TypeScript (`types/index.ts`)
**Fichiers :**
- Modifier : `activitytn/src/types/index.ts`

- [x] Ajouter les nouveaux champs optionnels dans `PartnerActivityInput` et `PartnerActivityItem` :
  - `address?: string;`
  - `mapsUrl?: string;`
  - `menuUrl?: string;`
  - `menuImageUrl?: string;`
  - `instagram?: string;`
  - `amenities?: string[];` // ex: ['wifi', 'terrace', 'parking', 'card_payment', 'kids_friendly']
- [x] Vérifier la compilation TypeScript avec `npx --prefix activitytn tsc -p activitytn/tsconfig.json --noEmit`.

---

### Tâche 2 : Définition des Commodités 1-Tap (Amenities) & Iconographie Vectorielle
**Fichiers :**
- Modifier : `activitytn/src/components/partner/PartnerActivityModal.tsx`

- [x] Définir la liste constante des commodités standards avec icônes Ionicons :
  - Wi-Fi gratuit (`wifi-outline` / `wifi`)
  - Terrasse / Plein air (`sunny-outline` / `sunny`)
  - Parking disponible (`car-outline` / `car`)
  - Paiement TPE / Carte bancaire (`card-outline` / `card`)
  - Espace Famille / Enfants (`people-outline` / `people`)
- [x] Créer l'état local `formAmenities: string[]` avec fonction de bascule (`toggleAmenity`).
- [x] Rendre les puces sous forme de grille interactive avec surbrillance à l'état actif.

---

### Tâche 3 : Section "Adresse & Quartier" (Avec repère et lien Maps optionnel)
**Fichiers :**
- Modifier : `activitytn/src/components/partner/PartnerActivityModal.tsx`

- [x] Ajouter un champ texte pour l'adresse détaillée / repère : `Route de Gremda km 2.5, Lac 2...`
- [x] Ajouter un champ optionnel pour le lien Google Maps / Waze (`https://maps.app.goo.gl/...`).
- [x] Synchroniser avec `formAddress` et `formMapsUrl`.

---

### Tâche 4 : Section "Menu & Carte des prix" (Upload Photo du Menu ou Lien Digital)
**Fichiers :**
- Modifier : `activitytn/src/components/partner/PartnerActivityModal.tsx`

- [x] Ajouter l'état `formMenuImageUrl` et `formMenuUrl`.
- [x] Ajouter un bouton dédié d'upload de photo du menu avec prévisualisation et bouton de suppression.
- [x] Ajouter un champ texte optionnel pour lien menu digital / QR code (ex: `menu.tn/...`).
- [x] Adapter la visibilité selon la catégorie (particulièrement mis en avant pour `food`, `relax`, `fun`).

---

### Tâche 5 : Section Réseaux Sociaux (Instagram & Contact)
**Fichiers :**
- Modifier : `activitytn/src/components/partner/PartnerActivityModal.tsx`

- [x] Ajouter un champ texte avec icône `logo-instagram` pour le profil `@nom_etablissement`.
- [x] Nettoyer le formatage (supprimer automatiquement `@` au besoin ou le stocker proprement).

---

### Tâche 6 : Synchronisation & Validation Finale
**Fichiers :**
- Modifier : `activitytn/src/components/partner/PartnerActivityModal.tsx`

- [x] Vérifier la synchronisation en mode édition (`editingActivity`) pour charger tous les nouveaux champs.
- [x] Vérifier le payload de `handleSubmit` pour inclure tous les champs dans `onSave`.
- [x] Exécuter `npx --prefix activitytn tsc -p activitytn/tsconfig.json --noEmit` et confirmer zéro erreur.
