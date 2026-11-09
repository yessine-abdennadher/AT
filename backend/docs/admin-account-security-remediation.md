# Remédiation de la sécurité des comptes administrateur

## Objectif et périmètre

Réduire les risques d’élévation de privilèges, de création de comptes partenaires non vérifiés, de vol ou de rejeu de session, et de comptes administrateur de démonstration prévisibles.

## Changements appliqués

- L’inscription publique crée toujours un rôle `user`; les rôles envoyés par le client sont ignorés.
- L’accès Google exige un ID token vérifié côté serveur, une adresse vérifiée et un `aud` autorisé par `GOOGLE_CLIENT_IDS`. L’écran mobile ne simule plus une connexion Google.
- Les mots de passe font de 12 à 128 caractères. Le flux partenaire ne transmet le mot de passe qu’à la vérification OTP, ne le stocke pas avec la demande OTP et exige une livraison réelle par Resend.
- Les OTP ne sont plus retournés à l’appelant ni écrits dans les logs. Le code est à usage unique, limité à trois tentatives et consommé atomiquement après validation.
- Les jetons d’accès expirent après 15 minutes. Les refresh tokens ont une durée de 7 jours, sont stockés sous forme de hash, tournent à chaque usage et sont liés à une session active. Chaque compte conserve au plus cinq sessions.
- Toute connexion admin par mot de passe envoie un code email à usage unique; le code est haché, valable 10 minutes et limité à cinq essais. Aucun JWT n’est émis avant sa validation. Les jetons admin portent une preuve MFA vérifiée à chaque requête; les anciens jetons admin sont donc refusés. La connexion Google des admins est refusée.
- La suspension d’un compte et la modification de son rôle révoquent ses sessions. L’audit admin couvre les changements de rôle/statut, les tiers et abonnements partenaires, les mises en avant/suppressions d’activités et la modération des avis. L’approbation d’activité conserve son journal transactionnel dédié. Le journal admin est consultable via `GET /api/admin/security-audit`.
- L’authentification de l’application Expo Web est désactivée; les sessions utilisateur sont réservées aux clients natifs. Le parcours partenaire navigateur utilise des cookies `HttpOnly`, `Secure` en production et `SameSite=None` en production; une garde CSRF exige une origine autorisée pour les requêtes mutantes avec ces cookies, et les origines navigateur doivent rester dans `CORS_ORIGIN`.
- Les favoris sont plafonnés à 200 par utilisateur et ne peuvent viser que des activités approuvées. Les uploads sont limités à 10 par utilisateur/IP toutes les 15 minutes, au format JPG/PNG/WEBP vérifié par signature et à 5 Mo.
- Le seed de démonstration est autorisé uniquement avec `NODE_ENV=development`. Un administrateur local optionnel utilise `DEV_ADMIN_EMAIL` et `DEV_ADMIN_PASSWORD` (16 caractères minimum), sans identifiant codé en dur. Les scripts n’affichent plus d’identifiants admin fixes.

## Configuration

Copier `.env.example` vers `.env` en développement. En production, fournir des secrets JWT distincts et aléatoires (32 caractères minimum), `MONGODB_URI`, `CORS_ORIGIN`, et les paramètres d’email. `GOOGLE_CLIENT_IDS` reste vide tant que le client n’intègre pas un fournisseur OAuth officiel; l’endpoint Google échoue alors en mode fermé.

## Migration et limites

- Les sessions anciennes ne contiennent pas d’identifiant de session et leurs refresh tokens ne sont pas hachés. Les utilisateurs devront se reconnecter après le déploiement; ne pas tenter de réutiliser ces jetons.
- Les comptes admin de démonstration déjà présents dans une base ne sont pas supprimés par ces changements. Remplacer leur mot de passe via une procédure d’administration contrôlée avant d’exposer cette base.
- Pour réinitialiser un admin existant, configurer temporairement `MONGODB_URI`, `RESET_ADMIN_EMAIL`, `RESET_ADMIN_PASSWORD` (16 caractères minimum) et `CONFIRM_ADMIN_PASSWORD_RESET=RESET_ACTIVITYTN_ADMIN`, puis lancer `node seeders/resetAdminPassword.js`. Le script invalide ses sessions sans afficher le mot de passe.
- L’inscription partenaire web reçoit désormais une session via cookie `HttpOnly`; le site ne copie pas de jetons dans `localStorage` et le tableau de bord web doit encore être raccordé aux API protégées avant d’être présenté comme espace authentifié fonctionnel.
- Cette MFA dépend de la sécurité de la boîte email admin; une compromission de cette boîte compromet les deux facteurs. Un second facteur TOTP ou une clé matérielle serait plus robuste.
- Le déploiement cross-site exige HTTPS en production, `CORS_ORIGIN` précis et un fournisseur Resend fonctionnel avec expéditeur vérifié. Les parcours réels restent à valider sur les domaines finaux.

## Contrôles

- Backend : `node --check` passe sur les fichiers JavaScript modifiés; `git diff --check` ne signale pas d’espace fautif.
- Mobile ActivityTN : `npx tsc --noEmit` passe; les fichiers de traduction FR/EN/AR sont des JSON valides; `git diff --check` passe.
- Landing : `npx tsc --noEmit` passe; `git diff --check` passe.
- Aucun test applicatif n’a été lancé. Les parcours connectés à MongoDB, Google, Resend et les domaines HTTPS finaux restent `À VÉRIFIER`.
