# Design Spec: Système d'Authentification Sécurisé Multi-Rôles (ActivityTN) ⚡

**Date**: 2026-10-04  
**Statut**: Validé  

---

## 1. Objectifs & Vue d'ensemble

L'objectif de cette fonctionnalité est d'implémenter un système d'authentification robuste et sécurisé pour **ActivityTN** couvrant le backend Node.js / Express / MongoDB et l'application mobile React Native / Expo.

### Caractéristiques principales :
1. **Gestion de 3 Rôles Utilisateurs** : `user` (Client/Utilisateur), `partner` (Partenaire Café/Restaurant/Activités), `admin` (Administrateur).
2. **Authentification à double jeton (Access + Refresh Token)** :
   - **Access Token (JWT)** : Durée de vie courte (15 minutes), transmis dans le header `Authorization: Bearer <token>`.
   - **Refresh Token (JWT)** : Durée de vie longue (7 jours), stocké en base de données sur le profil utilisateur pour permettre la révocation.
3. **Script de Seeding d'Utilisateurs (`seedUsers.js`)** : Création automatique d'utilisateurs de test pour chaque rôle.
4. **Interface d'Authentification Frontend (`AuthScreen.tsx`) & Service (`authService.ts`)** :
   - Sélecteur de rôle à l'inscription.
   - Intégration complète avec les endpoints d'authentification du backend.

---

## 2. Modèle de Données & Rôles (`backend/models/User.js`)

### Schéma Utilisateur (`User.js`)
```javascript
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: {
    type: String,
    enum: ["user", "partner", "admin"],
    default: "user"
  },
  establishmentName: { type: String, default: "", trim: true }, // Optionnel pour les partenaires
  refreshTokens: [{ type: String }], // Liste des tokens de rafraîchissement valides
  bio: { type: String, default: "" },
  phone: { type: String, default: "" },
  city: { type: String, default: "صفاقس" },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null },
  avatar: { type: String, default: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200" }
}, { timestamps: true });
```

---

## 3. Endpoints API Backend (`backend/routes/auth.routes.js`)

| Méthode | Route | Description | Accès |
|---|---|---|---|
| `POST` | `/api/auth/register` | Inscription d'un compte (`user` ou `partner`) | Public |
| `POST` | `/api/auth/login` | Connexion, retourne `accessToken`, `refreshToken` & `user` | Public |
| `POST` | `/api/auth/refresh` | Régénération d'un `accessToken` valide | Public |
| `POST` | `/api/auth/logout` | Révocation du `refreshToken` | Privé (`protect`) |
| `GET` | `/api/auth/me` | Récupération des informations de l'utilisateur connecté | Privé (`protect`) |

---

## 4. Script de Seeding (`backend/seeders/seedUsers.js`)

Le script génère les 3 utilisateurs suivants :
1. **Admin** : `admin@activitytn.tn` / `Admin123456!` (Rôle: `admin`)
2. **Partenaire** : `partner.moulin@activitytn.tn` / `Partner123456!` (Rôle: `partner`, Établissement: *"Le Moulin Cafe & Lounge"*)
3. **Utilisateur Simple** : `user.sfax@activitytn.tn` / `User123456!` (Rôle: `user`)

Nouveau script dans `backend/package.json` : `"seed:users": "node seeders/seedUsers.js"`.

---

## 5. Modifications Frontend (`activitytn/`)

1. **`src/types/index.ts`** :
   - `export type UserRole = 'user' | 'partner' | 'admin';`
   - Définition des permissions par rôle (`USER_PERMISSIONS`).
2. **`src/services/authService.ts`** :
   - Stockage et gestion de l'`accessToken` et du `refreshToken`.
   - Méthodes `login()`, `register()`, `refreshAccessToken()`, et `logout()`.
3. **`src/screens/AuthScreen.tsx`** :
   - Ajout d'un composant de sélection de rôle lors de l'inscription (Utilisateur vs Partenaire/Établissement).
