# ActivityTN Web grand public

## Objectif et périmètre

Le site `landing/` fournit les parcours web grand public de découverte, compte, favoris, avis, carte, recommandations et KharjaBot. Les visiteurs peuvent consulter les activités sans compte. Les espaces d’administration et partenaire, les paiements et les notifications push web ne font pas partie de cette livraison.

## Routes

| Route | Fonction |
| --- | --- |
| `/` | Découverte, recherche, filtres et catalogue paginé |
| `/activites/:activityId` | Fiche, avis publiés, envoi d’un avis à modérer, favoris et contact |
| `/favoris` | Favoris du compte connecté |
| `/profil` | Consultation et modification du profil |
| `/carte` | Carte des lieux aux coordonnées vérifiées et liste complète |
| `/recommandations` | Recherche selon ville, catégorie/type, budget et contexte |
| `/assistant` | Conversation KharjaBot avec capacité de session invitée |
| `/partenaire` | Page de présentation et formulaire partenaire existants |

Les routes sont servies par le fallback SPA de l’hébergeur. Configurer une réécriture vers `index.html` pour les chemins inconnus, tout en laissant `/api/*` au backend.

## Configuration et démarrage

Dans `landing/`, définir `VITE_API_URL` sur l’origine API suivie du préfixe `/api` si le backend n’est pas servi sur la même origine. Par défaut, l’application utilise `/api`; le serveur Vite relaie ce chemin vers `http://127.0.0.1:5000` en développement.

Le backend doit autoriser l’origine exacte du site dans `CORS_ORIGIN` et activer les credentials. En production, servir le site et l’API en HTTPS. Les sessions navigateur utilisent les cookies `activitytn_access` et `activitytn_refresh` HttpOnly; aucun JWT utilisateur n’est écrit dans le stockage web. Les requêtes du frontend utilisent `credentials: include`.

Pour un déploiement sur des domaines distincts, vérifier les attributs `SameSite=None; Secure`, les politiques de cookies tiers des navigateurs et la protection CSRF du backend avant ouverture publique. Un navigateur peut bloquer les cookies tiers même si CORS est correctement configuré; un proxy API sous la même origine est alors préférable.

Commandes de livraison utilisées :

```sh
npm ci
npm run build
```

## Données, modération et carte

Le catalogue, les filtres, les fiches et les recommandations proviennent de l’API. Les avis en attente de modération ne sont pas présentés comme publiés. Les champs absents restent absents plutôt que d’être remplacés par des valeurs de démonstration.

La carte place un marqueur précis uniquement lorsque `coordinatesVerified` est vrai et que les coordonnées sont dans les bornes tunisiennes. Les activités sans position précise sont regroupées sous un repère basé sur `City.coords`; il indique clairement le centre-ville approximatif et liste toutes les fiches concernées. Un administrateur vérifie un emplacement via `PATCH /api/admin/activities/:id/location` avec `{ "coordinates": { "latitude": number, "longitude": number } }`. Cette route exige le rôle admin et inscrit une entrée d’audit. Les anciennes coordonnées communes ne sont jamais interprétées comme la position d’une activité.

## Session et confidentialité hors ligne

Le service worker précache les assets de l’application et utilise un cache réseau-first borné pour les GET publics d’activités, catégories et villes. Les profils, favoris, avis, endpoints de chat et mutations ne sont pas dans les règles de cache API.

La capacité secrète du chat invité est gardée dans `sessionStorage` pendant l’onglet et envoyée dans `X-Chat-Session-Token`. Elle est séparée des cookies de compte, effacée au démarrage d’une nouvelle conversation et n’est jamais ajoutée à une URL. Éviter d’ajouter des règles Workbox génériques qui mettraient en cache `/api/chat/*` ou les réponses authentifiées.

Le chatbot est également disponible depuis un lanceur rond fixe sur les routes du site. Il ouvre un panneau non modal; Échap ou le bouton de fermeture le referme. La route `/assistant` donne accès à ce même panneau. Le widget conserve jusqu’à 20 conversations dans l’historique de l’onglet; les jetons de capacité restent en `sessionStorage` et les anciennes conversations peuvent être reprises tant que la session du navigateur est active.

L’application peut démarrer hors ligne après installation et afficher les données publiques déjà mises en cache. Les actions de compte et le chatbot nécessitent une connexion réseau; les données jamais consultées ne sont pas disponibles hors ligne.

## Limites connues

- Le bundle JavaScript principal dépasse le seuil Vite de 500 kB; découper les routes et la carte avec du chargement différé avant d’élargir la distribution si le poids initial devient un problème.
- La compatibilité des cookies dépend du domaine de déploiement et des politiques navigateur; valider les domaines réels avant la mise en production.
- La carte utilise les tuiles OpenStreetMap et nécessite une connexion; respecter les conditions d’utilisation et la politique de charge du fournisseur choisi.
- Les vérifications visuelles multi-écrans et navigateurs n’ont pas été exécutées par la compilation seule.
