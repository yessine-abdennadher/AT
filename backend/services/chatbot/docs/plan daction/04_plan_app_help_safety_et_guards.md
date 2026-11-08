# Plan d'Action 04 — Enrichissement de `capabilities/appHelp/`, `safety/` & `guards/`

## 1. Objectif
Compléter l'architecture de `capabilities/appHelp/` (guide de navigation in-app et deep-links), structurer l'enclave `capabilities/safety/` et renforcer les garde-fous post-génération `guards/`.

---

## 2. Actions sur `capabilities/appHelp/`

1. Créer les catalogues déclaratifs :
   - `capabilities/appHelp/catalogs/explorerHelpTopics.json` (Rubriques Explorateur : recherche, carte interactive, favoris, filtres, profil).
   - `capabilities/appHelp/catalogs/partnerHelpTopics.json` (Rubriques Partenaire : création d'activité, horaires, promotions, statistiques).
   - `capabilities/appHelp/catalogs/deepLinkActions.contract.json` (Actions mobiles : `OPEN_TAB`, `OPEN_INTERACTIVE_MAP`, `OPEN_PARTNER_DASHBOARD`).
2. Enrichir `appNavigationGuide.service.js` pour retourner à la fois l'explication localisée (`fr`, `ar`, `derja`, `en`) et les boutons d'action `actionButtons`.

---

## 3. Actions sur `capabilities/safety/` & `guards/`

1. **Enclave `capabilities/safety/`** :
   - Filtrer en amont (0 LLM) les requêtes hors-périmètre strict ou inappropriées via `chatSafety.service.js`.
2. **Garde-fous `guards/`** :
   - `privacyLeakGuard.service.js` : Masquage systématique de tout token JWT, clé API, email privé ou identifiant interne.
   - `roleIsolationGuard.service.js` : Garantit qu'un utilisateur simple (Explorateur) ne reçoit jamais de données réservées aux Partenaires ou Administrateurs.
   - `hallucinationGuard.service.js` : Vérifie que chaque carte ou établissement cité dans la réponse finale provient strictement du résultat de `activityRepository.mongo.js`.

