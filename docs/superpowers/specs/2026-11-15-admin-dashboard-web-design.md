# Tableau de bord admin web Tfarhida

## Intention

Porter dans le site web les fonctions de l’espace admin mobile afin que les administrateurs puissent piloter la plateforme depuis un navigateur. Le dashboard est un espace séparé de l’espace partenaire et conserve les permissions déjà appliquées par l’API.

## Approches considérées

1. **Dashboard modulaire sous `/admin` — retenu.** Ajouter une route et une vue web avec six onglets, composants métier isolés et un service admin dédié. Cette approche suit `AppRoutes`, `views`, `components` et `services` déjà employés dans `landing/`.
2. **Application admin web distincte.** Elle isolerait davantage les bundles, mais dupliquerait le routage, l’authentification, les traductions et le système visuel sans nécessité dans le projet actuel.

## Objectifs

- Reproduire les six onglets mobiles : vue d’ensemble, modération des activités, avis, utilisateurs, partenaires et diagnostics.
- Rendre les opérations disponibles uniquement à un compte `admin`; vérifier le rôle dans le routeur et laisser l’API faire l’autorisation définitive.
- Ajouter le parcours OTP/MFA admin manquant au login web afin qu’un challenge MFA ne soit pas traité comme une erreur de connexion ordinaire.
- Utiliser les endpoints backend existants, `apiRequest`, la session cookie et le contexte d’authentification web.
- Fournir les traductions FR/EN/AR, une présentation responsive, des états de chargement/erreur/absence de données par onglet et des confirmations pour les suppressions et changements sensibles.
- Documenter les fichiers et la validation.

## Fonctions incluses

1. **Vue d’ensemble :** totaux utilisateurs, partenaires, admins, activités, activités en attente et avis; répartition des activités par ville.
2. **Activités :** filtres de statut, approbation/suspension, mise en avant, populaire et suppression avec confirmation.
3. **Avis :** avis en attente, pagination, approbation et rejet.
4. **Utilisateurs :** recherche, filtre de rôle, suspension/réactivation et changement de rôle; empêcher une action sur le compte admin courant dans l’interface et respecter les contrôles serveur.
5. **Partenaires :** recherche et filtres par forfait/état de fraîcheur, détail du compte et de ses activités/offres, attribution d’un forfait.
6. **Diagnostics :** mode électricité global, sessions mobiles et écrans les plus consultés.
7. **Connexion admin :** capturer le challenge MFA émis par `/auth/login`, demander le code puis appeler `/auth/admin/mfa/verify`; terminer par la session cookie actuelle.

## Hors périmètre

- Journal d’audit de sécurité, gestion de facturation/abonnement, vérification de coordonnées, car ces fonctions ne font pas partie du dashboard mobile examiné.
- Création publique d’un compte admin ou élévation de rôle hors des actions administratives existantes.
- Nouvelles capacités backend, données simulées ou KPI calculés localement.

## Architecture proposée

- `landing/src/views/AdminDashboardView.tsx` compose les modules et gère leur navigation.
- `landing/src/components/admin/` contient la barre d’onglets et une vue par module; chaque module gère ses états locaux.
- `landing/src/services/adminService.ts` centralise les appels aux routes `/admin/*` et leurs types.
- `landing/src/routes/AppRoutes.tsx` expose `/admin` avec un garde de rôle.
- `landing/src/context/AuthContext.tsx`, `landing/src/services/authService.ts` et `landing/src/components/ui/AuthModal.tsx` gèrent le challenge MFA sans stockage manuel de tokens.
- `landing/src/styles/admin-dashboard.css` utilise les tokens existants; `landing/src/locales/{fr,en,ar}.json` porte tous les libellés.
- `docs/admin-dashboard-web.md` documente le périmètre, la sécurité et les contrôles réalisés.

## Règles de sécurité et de données

- Les endpoints admin backend sont protégés par `protect` et `authorize("admin")`; le contrôle frontend ne les remplace pas.
- Aucun token admin ne sera ajouté à `localStorage`.
- Les rôles, statuts, paliers et compteurs affichés proviennent de l’API.
- Les actions de suppression, changement de rôle, suspension et changement de palier demandent une confirmation explicite.
- Une erreur d’un onglet ne masque pas les autres onglets ni la navigation.

## Vérification attendue

- Tests ciblés pour le parsing du challenge MFA, la garde de rôle et les actions sensibles si l’infrastructure de tests web existante le permet.
- TypeScript, build web, vérification des traductions FR/EN/AR et contrôle du diff.
- Parcours navigateur admin réel et backend réel restent à vérifier si aucun compte de test/API accessible n’est disponible.
