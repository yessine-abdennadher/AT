# Spécification Technique : Diagnostic Admin, Télémétrie d'Usage, Partenaire Pro & Mode Éclairage/Électricité

## 1. Objectifs & Vue d'ensemble
Ce document détaille les 4 nouvelles fonctionnalités de la plateforme ActivityTN :
1. **Diagnostic & Télémétrie Admin** : Enregistrement du nombre de sessions, analyse des écrans les plus consultés, et détection de l'inactivité des partenaires (dernière connexion et date de mise à jour des activités).
2. **Horaires d'ouverture & fermeture** : Horaires structurés (`openingTime`, `closingTime`, `openDays`) avec statut dynamique en temps réel (`isOpenNow`).
3. **Mode Électricité / Lumière en Direct** : Le partenaire active/désactive le mode électrifié/éclairé en 1 clic. La carte mobile (`ActivityCard`) affiche une lampe dorée allumée avec glow (`💡 Lumière & Électricité garanties`).
4. **Niveaux de compte Partenaire (Pro vs Standard)** :
   - L'admin peut basculer un partenaire en **Compte Pro** (`partnerTier: 'pro'`) ou **Standard** (`partnerTier: 'standard'`).
   - Le partenaire Pro a l'exclusivité d'ajouter des **Promotions** (réductions de prix, menus promotionnels) et d'organiser des **Événements** (soirées musicales acoustiques, dégustations DJ, animations).

---

## 2. Architecture & Modèles de Données

### A. Modèle `User` (`backend/models/User.js`)
- `partnerTier`: `enum: ['standard', 'pro']`, par défaut `'standard'`.
- `lastLogin`: `Date`.
- `lastActivityUpdate`: `Date`.

### B. Modèle `Activity` (`backend/models/Activity.js`)
- `openingTime`: `String` (ex: `"08:00"`).
- `closingTime`: `String` (ex: `"23:00"`).
- `openDays`: `[String]` (ex: `["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]`).
- `powerBackupMode`: `Boolean` (Mode Électricité/Lumière active en direct, défaut `true`).
- `events`: `[{ title: String, date: String, time: String, description: String, category: String }]` (Événements exclusifs Pro).
- `promotion`: `{ isPromo: Boolean, discountPercent: Number, promoLabel: String, validUntil: String }` (Promotions exclusives Pro).

### C. Modèle `Telemetry` (`backend/models/Telemetry.js`)
- `sessionId`: `String`.
- `eventType`: `enum: ['session_start', 'screen_view', 'action']`.
- `screenName`: `String` (ex: `'home'`, `'recommendations'`, `'map'`, `'chat'`, `'partner_dash'`, `'admin_dash'`).
- `timestamp`: `Date`.
- `metadata`: `Object`.

---

## 3. Endpoints API

### A. Télémétrie (`backend/routes/telemetry.routes.js`)
- `POST /api/telemetry/track` : Enregistrement d'événement télémétrique (public / asynchrone).

### B. Administration (`backend/routes/admin.routes.js`)
- `GET /api/admin/diagnostics` : Statistiques de sessions, top écrans visités, statut des partenaires (actifs / inactifs).
- `PATCH /api/admin/partners/:id/tier` : Modification du tier (`'standard' | 'pro'`).

### C. Activités Partenaire (`backend/routes/activity.routes.js`)
- `PATCH /api/activities/partner/:id/power-mode` : Toggle rapide électricité/lumière.
- `POST /api/activities/partner/:id/events` : Ajout d'événement (protégé si non Pro).
- `PATCH /api/activities/partner/:id/promotion` : Ajout de promotion (protégé si non Pro).

---

## 4. Expérience Mobile (UI/UX)
- `ActivityCard` : Lampe allumée dorée animée quand `powerBackupMode === true`, horaires avec badge ouvert/fermé.
- `AdminDashboardScreen` : Onglet Diagnostics avec KPIs de sessions, top écrans, et gestionnaire de Tier Partenaire Pro.
- `PartnerDashboardScreen` : Switch "💡 Électricité / Lumière garantie", gestionnaire d'Événements et de Promotions avec badge PRO.
