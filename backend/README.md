# Backend ActivityTN

## Rôles

- `user` (`simple_user`) : consulter les activités et restaurants.
- `admin` (`administrator`) : créer, modifier et supprimer une activité, un restaurant, un café ou un autre lieu.

Le rôle `admin` ne peut pas être choisi par l'inscription publique. Il doit être attribué de manière contrôlée en base de données.

## Routes principales

- `GET /api/activities` : liste publique, filtres `type`, `city`, `category`.
- `GET /api/activities/:id` : détail public.
- `POST /api/activities` : admin uniquement.
- `PUT /api/activities/:id` : admin uniquement.
- `DELETE /api/activities/:id` : admin uniquement.

Les routes protégées attendent `Authorization: Bearer <token>`.
