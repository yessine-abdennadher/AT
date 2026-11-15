# Espace partenaire web Tfarhida

## Objectif et périmètre

Le portail web permet aux comptes de rôle `partner` de gérer leurs établissements, promotions et événements depuis une interface web responsive. Il reprend les capacités existantes de l’application mobile et réutilise les endpoints backend ainsi que la session par cookie du frontend.

## Architecture

- `landing/src/views/PartnerDashboardView.tsx` : tableau de bord, indicateurs, filtres, états de chargement/erreur et actions partenaire.
- `landing/src/components/partner/PartnerEditorDialog.tsx` : formulaires dédiés à une fiche, une promotion ou un événement. Le navigateur gère la boîte de dialogue native et l’upload passe par l’API.
- `landing/src/services/partnerService.ts` : contrats TypeScript et appels API partenaire; aucune donnée d’authentification n’est stockée dans le navigateur.
- `landing/src/routes/AppRoutes.tsx` : route `/partenaire/espace` et vérification du rôle avant le chargement des données.
- `landing/src/context/AuthContext.tsx` : relecture du profil après l’onboarding OTP afin d’ouvrir la session partenaire sans rechargement manuel.
- `landing/src/styles/partner-dashboard.css` : styles responsives utilisant les variables de thème du site.
- `landing/src/locales/{fr,en,ar}.json` : textes de l’espace partenaire.

## Règles d’accès et métier

- La route web n’affiche les données qu’aux comptes de rôle `partner`.
- Le backend reste l’autorité pour l’authentification, la propriété des fiches et les paliers. Les requêtes utilisent `apiRequest` et la session cookie existante.
- Les promotions sont proposées aux comptes Pro et Premium; les événements aux comptes Premium, comme dans l’application mobile. Le backend revalide ces règles.
- Le contrôle du mode électricité n’est présenté que lorsque `/activities/system-status` indique que l’alerte globale est active.
- La note moyenne n’est pas affichée dans les KPI, car les statistiques backend actuelles peuvent attribuer une note par défaut sans avis. Le nombre d’avis est conservé.
- Les nouvelles fiches restent soumises à la modération backend.

## Validation effectuée

- `npx tsc -p tsconfig.app.json --noEmit --pretty false` : réussi.
- `npx vite build` : réussi; l’avertissement existant de chunk JavaScript supérieur à 500 kB subsiste.
- Les clés principales de traduction ont été vérifiées en français, anglais et arabe.

## Limites connues

- Le parcours d’abonnement et de paiement n’est pas créé par ce portail; le lien de forfait renvoie aux tarifs existants et la conversion reste gérée par le parcours partenaire actuel.
- Les réponses aux avis, la modification/suppression d’événements et les statistiques de consultations ne sont pas proposées, car les routes ou capacités backend correspondantes ne sont pas exposées dans le parcours mobile examiné.
- Le build combiné `npm run build` retourne actuellement le code 1 pendant `tsc -b` sans diagnostic; le contrôle TypeScript ciblé et le build Vite exécutés séparément passent.
