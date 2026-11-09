# Architecture technique de sécurité — ActivityTN

Date de rédaction : 9 novembre 2026

Périmètre : API Express/Mongoose, application mobile Expo et authentification du portail partenaire.

Ce document décrit les mécanismes présents dans le code. Il ne remplace pas la configuration de l’environnement ni les vérifications de déploiement. Les parcours qui nécessitent des services externes sont indiqués comme restant à vérifier.

## 1. Vue d’ensemble

```text
Application native Expo
  ├─ Jetons d’accès et de renouvellement → SecureStore iOS/Android
  ├─ Connexion admin → mot de passe → OTP email → JWT MFA
  └─ Requêtes API → Authorization: Bearer <access token>

Portail partenaire navigateur
  ├─ Vérification email OTP via API
  ├─ Cookies de session HttpOnly
  └─ Requêtes mutantes avec cookies → contrôle Origin / CSRF

API Express
  ├─ Helmet, CORS à origines explicites, parseurs JSON/URL-encoded
  ├─ Rate limiting persistant dans MongoDB
  ├─ Authentification JWT + vérification session active et rôle
  ├─ Services métier et journal d’audit administrateur
  └─ MongoDB, Resend, Cloudinary
```

L’application ActivityTN sur le Web ne restaure pas de session et refuse les parcours de connexion natifs. Le portail partenaire Web est distinct et utilise des cookies `HttpOnly`.

## 2. Authentification et sessions

### 2.1 Inscription et rôles

- L’inscription publique attribue le rôle `user`; les champs de rôle transmis par le client ne donnent pas de privilèges.
- Les comptes partenaires passent par la vérification email à usage unique.
- Les changements de rôle et la suspension d’un compte invalident les sessions enregistrées.
- L’authentification Google est désactivée si aucun client ID officiel n’est configuré. Le serveur vérifie l’ID token, son audience et l’adresse email vérifiée; un compte admin ne peut pas utiliser ce flux.

### 2.2 Connexion administrateur avec OTP email

1. `POST /api/auth/login` vérifie le mot de passe et l’état actif du compte.
2. Si le rôle est `admin`, l’API génère un identifiant de challenge aléatoire et un code à six chiffres.
3. MongoDB conserve le hash SHA-256 du challenge, le hash bcrypt du code, le nombre d’essais et une expiration à 10 minutes. Un nouvel envoi remplace les challenges précédents du compte.
4. Resend envoie le code. En cas d’échec d’envoi, le challenge est supprimé et aucun JWT n’est émis.
5. `POST /api/auth/admin/mfa/verify` accepte le challenge et le code. Après cinq essais erronés, le challenge est invalidé. Un code correct est consommé atomiquement.
6. L’API émet des jetons portant `mfa: true`; le middleware d’authentification exige ce claim pour chaque requête admin.

L’écran mobile `AdminMfaChallengeView` collecte le code. Le flux de connexion admin Google est refusé côté serveur. Ce facteur dépend de la sécurité du compte email de l’administrateur; une compromission de cette boîte compromet le second facteur.

### 2.3 Durée et rotation des jetons

| Élément | Valeur / règle |
|---|---|
| Access token | JWT de 15 minutes |
| Refresh token | JWT de 7 jours |
| Stockage serveur | Hash SHA-256 du refresh token, lié à un identifiant de session |
| Rotation | Un refresh token valide est remplacé à chaque renouvellement |
| Sessions conservées | Au plus cinq par compte |
| Révocation | Contrôle de l’identifiant de session actif à chaque requête protégée |

Les anciens jetons sans identifiant de session ou dont la représentation serveur n’est pas hachée ne sont pas compatibles : les utilisateurs doivent se reconnecter après déploiement.

### 2.4 Stockage client

- iOS/Android : `ACCESS_TOKEN` et `REFRESH_TOKEN` utilisent Expo SecureStore (Keychain/Keystore); le profil utilisateur est stocké séparément.
- Expo Web : l’authentification est désactivée et les jetons locaux hérités sont supprimés à la restauration de session.
- Portail partenaire navigateur : le serveur place les jetons dans `activitytn_access` et `activitytn_refresh`, avec l’attribut `HttpOnly`. Le navigateur ne reçoit pas les jetons dans le JSON lorsque l’origine est autorisée.

Attributs des cookies navigateur :

| Cookie | Chemin | Durée | Production |
|---|---|---|---|
| `activitytn_access` | `/api` | 15 min | `Secure`, `SameSite=None`, `HttpOnly` |
| `activitytn_refresh` | `/api/auth` | 7 jours | `Secure`, `SameSite=None`, `HttpOnly` |

En développement, `Secure` est désactivé et `SameSite=Lax` est utilisé. Les appels navigateur doivent inclure `credentials: 'include'`.

## 3. Protection CSRF et CORS

- `CORS_ORIGIN` contient une liste séparée par des virgules d’origines complètes, par exemple `https://app.example.tn,https://partners.example.tn`.
- Les origines ne peuvent contenir ni chemin, ni identifiants, ni query string, ni fragment.
- En production, les origines doivent employer HTTPS; l’absence de `CORS_ORIGIN` fait échouer le démarrage.
- La garde CSRF traite les méthodes autres que `GET`, `HEAD` et `OPTIONS`. Si une requête mutante porte un cookie de session, son en-tête `Origin` doit correspondre exactement à une origine autorisée. Une origine absente ou non autorisée reçoit `403`.
- CORS avec `credentials: true` ne remplace pas cette garde : CORS contrôle l’accès du navigateur à la réponse, tandis que la garde rejette la mutation côté serveur.

Les requêtes mobiles utilisant un jeton Bearer ne dépendent pas des cookies de navigateur et ne sont pas soumises à cette vérification par cookie.

## 4. Autorisations et journal d’audit

Les routes `/api/admin/*` appliquent d’abord `protect`, puis `authorize('admin')`. Le middleware vérifie le JWT, l’état actif, le rôle, la session non révoquée et le claim MFA pour les administrateurs.

Le journal `AdminSecurityAudit` stocke : acteur, cible, type de cible, action, valeur précédente/nouvelle, adresse IP, user-agent et horodatage. Les actions suivies comprennent :

- changement de statut ou de rôle d’un compte;
- changement de tier partenaire et d’abonnement;
- mise en avant ou suppression d’activité;
- changement de statut d’un avis.

Consultation : `GET /api/admin/security-audit`, accessible uniquement à un administrateur authentifié. L’approbation des activités conserve son journal métier dédié.

## 5. Limitation de débit et uploads

Les compteurs de rate limiting sont stockés dans MongoDB. La clé est hachée avant stockage et combine portée, méthode, route, IP et compte/email selon le contexte. Si le stockage des compteurs est indisponible, la requête est rejetée en `503` (fail closed).

| Flux | Limite implémentée |
|---|---|
| Routes d’authentification | 10 requêtes / 15 min / clé de limitation |
| Upload image | 10 uploads / 15 min / clé de limitation |
| Création de session chatbot | 20 / minute |
| Messages chatbot | 20 / minute |

La route `POST /api/upload/image` exige une session. Les images acceptées sont JPG, PNG ou WEBP, maximum 5 Mo, avec contrôle de la signature binaire et cohérence MIME. Le champ `folder` est limité à `activities` ou `avatars`. En production, Cloudinary doit être configuré; un échec ne bascule pas vers le disque local.

## 6. Limitation des données utilisateur

- Un utilisateur peut conserver au plus 200 favoris.
- Une activité doit exister et être approuvée pour être ajoutée aux favoris.
- L’ajout utilise une condition atomique sur la taille du tableau afin d’empêcher le dépassement concurrent du plafond.
- Les IDs d’activité sont vérifiés avant la requête MongoDB.

## 7. Seeding et comptes de développement

Les seeds d’exemple ne s’exécutent que si `NODE_ENV=development`. Le compte admin de développement est optionnel et dépend de `DEV_ADMIN_EMAIL` et `DEV_ADMIN_PASSWORD` (16 caractères minimum). Aucun secret de démonstration fixe ne doit être utilisé en production.

Pour changer manuellement un mot de passe admin existant, le script `seeders/resetAdminPassword.js` exige `MONGODB_URI`, `RESET_ADMIN_EMAIL`, `RESET_ADMIN_PASSWORD` et la confirmation exacte `CONFIRM_ADMIN_PASSWORD_RESET=RESET_ACTIVITYTN_ADMIN`. Le script révoque les sessions et les challenges existants. Ne pas inclure ces valeurs dans un ticket ou un journal partagé.

## 8. Configuration d’environnement

Les variables sont listées dans [`../.env.example`](../.env.example). Ne jamais versionner le vrai fichier `.env`.

| Variable | Usage | Exigence |
|---|---|---|
| `NODE_ENV` | Profil d’exécution et activation des seeds | `production` en production |
| `MONGODB_URI` | Connexion MongoDB | Obligatoire en production |
| `JWT_SECRET` | Signature des access tokens | Secret aléatoire, 32 caractères minimum |
| `JWT_REFRESH_SECRET` | Signature des refresh tokens | Secret aléatoire, distinct, 32 caractères minimum |
| `CORS_ORIGIN` | Origines web autorisées | Obligatoire en production; HTTPS uniquement |
| `TRUST_PROXY_HOPS` | Nombre de proxies de confiance | Entier de 0 à 5, seulement selon l’infrastructure réelle |
| `RESEND_API_KEY` | Livraison des codes email | À configurer pour le flux partenaire et MFA admin |
| `RESEND_FROM` | Expéditeur email | Utiliser un expéditeur vérifié par Resend en production |
| `GOOGLE_CLIENT_IDS` | Audiences OAuth autorisées | Vide = connexion Google indisponible |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary | Obligatoire pour les uploads en production |
| `CLOUDINARY_API_KEY` | Cloudinary | Obligatoire pour les uploads en production |
| `CLOUDINARY_API_SECRET` | Cloudinary | Secret serveur; ne jamais l’exposer au client |

Ne pas copier de valeurs secrètes dans cette documentation. Les secrets JWT doivent être générés indépendamment et ne doivent pas être réutilisés entre environnements.

## 9. Démarrage et déploiement

1. Configurer MongoDB et vérifier que l’API peut créer/mettre à jour les collections d’index nécessaires (challenges et compteurs à TTL).
2. Définir les secrets JWT distincts, `MONGODB_URI`, `CORS_ORIGIN` HTTPS, les paramètres Resend et Cloudinary.
3. Vérifier l’expéditeur et la réception des emails OTP sur les boîtes d’essai.
4. Déployer le backend et le client; demander une nouvelle connexion à tous les comptes dont les sessions précèdent cette version.
5. Réinitialiser les comptes admin de démonstration déjà existants à l’aide de la procédure contrôlée; leur présence en base n’est pas supprimée automatiquement.
6. Vérifier les flux mobile, partenaire, admin, refresh, logout, suspension et révocation sur les domaines réels.
7. Ne présenter le tableau de bord partenaire web comme authentifié qu’après raccordement complet de ses appels aux API protégées. Le parcours d’onboarding obtient un cookie, mais l’intégration fonctionnelle du dashboard reste à terminer.

## 10. Fichiers principaux

| Domaine | Fichiers |
|---|---|
| Configuration | `config/jwt.config.js`, `config/runtimeConfig.js`, `app.js` |
| Auth API | `controllers/auth.controller.js`, `services/auth.service.js`, `routes/auth.routes.js` |
| Auth middleware / CSRF | `middlewares/auth.middleware.js`, `middlewares/cookieCsrf.middleware.js` |
| MFA / audit | `models/AdminLoginChallenge.js`, `models/AdminSecurityAudit.js`, `services/admin-security-audit.service.js` |
| Email / débit | `services/mail.service.js`, `middlewares/rateLimit.middleware.js`, `services/rateLimitStore.service.js` |
| Favoris / upload | `services/activity-favorite.service.js`, `services/upload.service.js`, `routes/upload.routes.js` |
| Client mobile | `activitytn/src/services/storage.ts`, `activitytn/src/services/authService.ts`, `activitytn/src/screens/auth/AdminMfaChallengeView.tsx` |
| Portail partenaire | `landing/src/services/partnerAuthService.ts` |

## 11. Vérifications et limites connues

### Contrôles statiques déjà exécutés

- `node --check` sur les fichiers JavaScript backend modifiés.
- `npx tsc --noEmit` dans `activitytn` et `landing`.
- Validation JSON des traductions mobile et `git diff --check` sur les changements concernés.

### Non exécutés / à vérifier

- Tests applicatifs et tests d’intégration.
- Connexion réelle à MongoDB et présence effective des index TTL après migration.
- Livraison réelle des OTP par Resend, domaines/expéditeurs vérifiés et stratégie anti-abus côté fournisseur.
- Connexion aux domaines HTTPS de production, cookies cross-site, CORS et contrôle CSRF dans les navigateurs ciblés.
- Vérification réelle Cloudinary et limites/quotas du compte.
- Recette sur appareil iOS/Android, lecteur d’écran et parcours admin complet.
- Intégration des appels authentifiés du tableau de bord partenaire web.

La MFA actuelle est un code email à usage unique; elle est plus exposée qu’un TOTP ou une clé matérielle si la boîte mail est compromise. Les compteurs de débit étant dans MongoDB, leur indisponibilité rend les routes associées temporairement indisponibles.
