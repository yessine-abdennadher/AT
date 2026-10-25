# Backend ActivityTN

## Rôles

- `user` (`simple_user`) : consulter les activités et restaurants.
- `admin` (`administrator`) : créer, modifier et supprimer une activité, un restaurant, un café ou un autre lieu.

Le rôle `admin` ne peut pas être choisi par l'inscription publique. Il doit être attribué de manière contrôlée en base de données.

## Organisation des services métier

Les contrôleurs historiques continuent d'importer `services/activity.service.js`, qui sert de façade de compatibilité. Les implémentations sont séparées par domaine :

- `activity.service.js` : catalogue et CRUD des activités.
- `activity-recommendation.service.js` : filtres, sélection bornée des candidats et classement.
- `activity-favorite.service.js` : favoris utilisateur.
- `activity-review.service.js` : avis, notes et réactions.
- `activity-partner.service.js` : statistiques partenaire, promotions et événements.
- `activity-power.service.js` : mode énergie et signalements communautaires.
- `activity.utils.js` : utilitaires partagés du domaine Activité.

La façade évite une migration simultanée des contrôleurs; chaque domaine peut désormais être testé et modifié sans concentrer sa logique dans un seul module.

## Routes principales

- `GET /api/activities` : liste publique, filtres `type`, `city`, `category`.
- `GET /api/activities/:id` : détail public.
- `POST /api/activities` : admin uniquement.
- `PUT /api/activities/:id` : admin uniquement.
- `DELETE /api/activities/:id` : admin uniquement.

### Modération des activités

- Les listes, recommandations, détails et avis publics ne retournent que les activités avec `isApproved: true`.
- Toute nouvelle activité reste en attente (`isApproved: false`), quel que soit le rôle et même si la requête tente d'envoyer `isApproved: true`.
- Seule la route dédiée d'administration peut approuver une activité; la mise à jour générique ignore `isApproved` et `createdBy`.

### Modération des avis

- Les nouveaux avis et les avis modifiés restent `pending`; les réponses publiques et la note agrégée ne comptent que les avis approuvés. Sans avis public, la note et le compteur valent 0.
- `GET /api/admin/reviews?status=pending` liste les avis à traiter (pagination). `PATCH /api/admin/reviews/:id/status` accepte `approved` ou `rejected` pour un administrateur authentifié et enregistre le modérateur et l'heure.
- Les avis historiques sans champ `status` restent visibles pour compatibilité et apparaissent dans le filtre admin `approved`; ils peuvent être rejetés manuellement. Une vérification de ces anciens avis reste nécessaire avant ouverture publique.

Les routes protégées attendent `Authorization: Bearer <token>`.

## Sécurité et exploitation

### Configuration

- `MONGODB_URI` est obligatoire en production; aucune base locale de repli n'est utilisée dans cet environnement. En développement, l'URI locale par défaut est définie dans `config/db.js`.
- En production, `JWT_SECRET` et `JWT_REFRESH_SECRET` doivent être configurés séparément, contenir au moins 32 caractères et être distincts.
- En production, `CORS_ORIGIN` doit contenir une ou plusieurs origines HTTP(S) séparées par des virgules, sans chemin, identifiants, query ni fragment (ex. `https://app.example.tn`).
- `TRUST_PROXY_HOPS` est facultatif et doit être un entier entre 0 et 5. Ne le configurez que selon le nombre exact de proxies de confiance devant l'API.
- `npm start` attend la connexion MongoDB avant d'ouvrir le port HTTP. Un échec de connexion empêche donc l'API d'accepter du trafic.

### Limitation de débit

Les quotas sont partagés entre les instances grâce aux compteurs MongoDB et leurs clés sont stockées sous forme de condensat. Si le stockage de quotas est indisponible, les routes protégées échouent de manière fermée (503). Les réponses incluent `RateLimit-*` et les en-têtes historiques `X-RateLimit-*` pour compatibilité.

### Chat invité

Une nouvelle session retourne un secret aléatoire à usage de capacité. Le client doit conserver ce secret et l'envoyer dans `X-Chat-Session-Token` pour lire l'historique ou ajouter un message; l'identifiant de session seul n'autorise plus l'accès. Le serveur stocke uniquement le SHA-256 du secret. Les sessions historiques sans ce secret ne sont plus accessibles et doivent être recréées. La taille des messages et le nombre d'échanges conservés sont plafonnés.

### Recommandations et réactions

Les recommandations évaluent au plus dix pages de candidats, triés de façon déterministe à l'extraction; la taille de page est comprise entre 1 et 100 (défaut 20). Le classement est relatif à ce jeu borné, et non à un classement global optimal. La réponse conserve `success`, `count` et `activities`, et ajoute `page`, `limit` et `hasMore`.

Les réactions aux avis sont modifiées par une mise à jour MongoDB atomique et sont limitées à 50 par avis. Une nouvelle réaction au-delà de la capacité n'est pas ajoutée; les utilisateurs déjà présents peuvent toujours changer ou retirer leur réaction.

### Audit de modération et santé

Chaque transition réelle d'approbation d'activité est enregistrée dans `ActivityApprovalAudit` avec l'acteur admin, l'état précédent et suivant et l'heure. Les répétitions du même état ne créent pas d'événement. L'écriture d'état et d'audit utilise une transaction MongoDB : le serveur de base doit prendre en charge les transactions (replica set ou cluster shardé).

- `GET /health/live` vérifie que le processus HTTP répond, indépendamment de MongoDB.
- `GET /health/ready` retourne 200 uniquement lorsque Mongoose est connecté, sinon 503.
- `GET /health` reste un alias de readiness pour compatibilité.

### Tests

`npm test` lance d'abord les tests ciblés sans base de données, puis les tests historiques. Les suites `telemetry`, `admin-diagnostics` et `notification` ont besoin d'une base MongoDB de test joignable et peuvent créer des données. Elles ne doivent pas être pointées vers une base de production.
