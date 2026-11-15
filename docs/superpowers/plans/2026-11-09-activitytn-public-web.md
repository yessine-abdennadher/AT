# ActivityTN Public Web Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Deliver an installable ActivityTN web experience where visitors can discover Tunisian venues freely and signed-in users can use account-based features.

**Architecture:** Keep the current Vite/React landing app, add addressable web routes and a shared API/auth layer, then build each public-user journey on the existing backend contracts. Use the backend's HttpOnly browser cookies for web sessions; keep account data and chat sessions out of the service-worker cache. Ship the public discovery and user account flows before map, recommendations, and chatbot enhancements.

**Tech Stack:** React 19, TypeScript, Vite, React Router, existing CSS and localization context, Express/Mongoose API, existing Vite PWA/Workbox setup, Leaflet with OpenStreetMap tiles for web mapping.

**Spec:** Approved in conversation on 2026-11-09: “Conception proposée — Web grand public ActivityTN”. This plan implements that scope only.

## Global Constraints

- Public visitors can browse the catalogue and activity details without creating an account.
- The backend is the authority for roles and protected operations; public registration cannot grant admin or partner privileges.
- Browser authentication uses the existing `activitytn_access` and `activitytn_refresh` HttpOnly cookies with credentialed requests; never persist JWTs in `localStorage`.
- New and edited reviews remain pending moderation and must not appear as published or affect public ratings before approval.
- Do not show invented ratings, review counts, coordinates, prices, phone numbers, promotions, or demo activities as live API data.
- Keep French, English, and Arabic translations; preserve RTL behavior and existing theme preferences.
- Service-worker caching is limited to public GET data and static assets. Never cache authenticated responses, profile/favorites, notification data, or chatbot session secrets/history.
- Do not implement partner/admin dashboards, payments, or browser push notifications in this plan.
- Do not add or run automated tests unless requested. Verify with type/build commands and manual acceptance checks only.

## Review Focus

1. Cross-origin cookie behavior: API calls include credentials, allowed origins are explicit, and cookie/CSRF handling remains compatible with the deployed domains.
2. Session expiry: a protected action prompts for authentication without discarding the user's current activity or intended action.
3. Moderation: pending reviews never appear in public review lists or ratings.
4. Location quality: precise venue markers use only verified coordinates; venues without verified points are grouped at official city centers and clearly labeled approximate. The shared legacy Sfax coordinates are never treated as venue locations.
5. Offline privacy: cached public catalogue data remains usable, while private account and chatbot data never enters Workbox caches.

---

### Task 1: Establish web routes, API client, and user session

**Files:**
- Modify: `landing/package.json` (add `react-router-dom`)
- Modify: `landing/src/main.tsx` (router and `AuthProvider` setup)
- Modify: `landing/src/App.tsx` (replace view-only hash switching with route composition while retaining partner route compatibility)
- Create: `landing/src/routes/AppRoutes.tsx` (public and account route declarations)
- Create: `landing/src/services/apiClient.ts` (base URL, JSON/error parsing, `credentials: 'include'`)
- Create: `landing/src/services/authService.ts` (`login`, `register`, `getMe`, `refresh`, `logout`, `updateProfile`)
- Create: `landing/src/context/AuthContext.tsx` (user/session/loading/error state and auth actions)
- Create: `landing/src/components/ui/AuthModal.tsx` (sign-in/register forms and validation)
- Modify: `landing/src/components/layout/Navbar.tsx` and `landing/src/styles/navbar.css` (sign-in action and signed-in account menu)
- Modify: `landing/src/locales/fr.json`, `landing/src/locales/en.json`, `landing/src/locales/ar.json` (all user-facing strings)

**Interfaces:**
- `apiRequest<T>(path: string, init?: RequestInit): Promise<T>` always sends browser credentials and parses the API's JSON error contract.
- `AuthContext` exposes `user`, `status`, `signIn`, `signUp`, `signOut`, `refreshUser`, and `updateProfile`.
- Auth endpoints are `/api/auth/login`, `/register`, `/me`, `/refresh`, `/logout`, and `/profile`.
- The backend sets browser cookies only for approved request origins. Registration defaults to the public `user` role; no role selector is exposed.

- [ ] Add routes for `/`, `/activites/:activityId`, `/favoris`, `/profil`, `/carte`, `/recommandations`, and `/assistant`; retain the current `#/partenaire` entry as a compatibility redirect or route until the partner area is migrated later.
- [ ] Implement the shared API client and move the existing public activity requests to its common base URL/error behavior without changing their response semantics.
- [ ] Implement auth context initialization using `/api/auth/me`; if the cookie is expired, attempt `/api/auth/refresh` once and retry `/me`, otherwise settle into the signed-out state.
- [ ] Implement sign-in and public registration with accessible validation, pending/error states, and no persistent browser storage of JWT values.
- [ ] Update the navbar for visitor and signed-in states; support keyboard navigation, mobile layout, RTL, and explicit sign-out.
- [ ] Run `npm run build` from `landing/` and manually verify initial visitor state, sign-in, registration, reload persistence, expired-session handling, and logout against the configured development API.

### Task 2: Complete public discovery and shareable activity details

**Files:**
- Modify: `landing/src/services/activityApi.ts` (remove demo search fallback; add paginated/filterable list and detail/review methods)
- Modify: `landing/src/components/sections/ActivityExplorer.tsx` (server-backed filters, pagination, empty/error states)
- Modify: `landing/src/components/sections/HeroSection.tsx` (use real suggestions and open the actual selected activity)
- Modify: `landing/src/components/ui/ActivityModal.tsx` (link to the canonical activity route or replace with route-backed detail rendering)
- Create: `landing/src/views/ActivityDetailView.tsx` (shareable activity details, approved reviews, contact actions)
- Create: `landing/src/components/activity/ActivityReviewList.tsx` and `ActivityReviewForm.tsx`
- Modify: `landing/src/styles/activity-explorer.css`, `landing/src/styles/modal.css`, `landing/src/App.css`
- Modify: all three locale JSON files for search, pagination, review states, and errors

**Interfaces:**
- Public list/detail/reviews use `GET /api/activities`, `/api/activities/:id`, and `/api/activities/:id/reviews`.
- Review creation/update/reaction use the existing protected activity review routes and the shared API client.
- `GET /api/activities` supports `type`, `city`, `category`, `page`, and `limit`; preserve server pagination rather than filtering only a truncated first page.
- `ActivityDetailView` consumes a normalized API activity and uses only its actual contact and promotion fields.

- [ ] Make category, type, city, and text search parameters part of the API request; retain filter state in URL query parameters so a search can be shared and browser back/forward works.
- [ ] Add pagination or “load more” driven by `page`, `totalPages`, and `hasMore` from the API.
- [ ] Remove the `DEMO_ACTIVITIES` live-search fallback and all fabricated rating/review/contact values from search suggestions; show translated empty, offline, and retry states instead.
- [ ] Make selecting a suggestion open the matching API activity, not a demo object. Ensure detail URLs can be opened directly and shared.
- [ ] Load public reviews and ratings from the review endpoint; show the backend's zero-rating/no-reviews state without a fabricated default.
- [ ] Require authentication only when submitting/editing a review or reacting; after authentication, continue the intended action when practical. Clearly tell the user that submitted reviews await moderation.
- [ ] Run `npm run build` from `landing/` and manually verify public browsing, filter combinations, pagination, direct detail URLs, no-results/error states, phone/WhatsApp links, and pending-review messaging.

### Task 3: Profile and synchronized favorites

**Files:**
- Create: `landing/src/views/ProfileView.tsx`
- Create: `landing/src/views/FavoritesView.tsx`
- Create: `landing/src/components/account/AccountMenu.tsx` (if not kept inline in Navbar)
- Create: `landing/src/services/favoriteService.ts`
- Modify: `landing/src/services/authService.ts` (profile data contract)
- Modify: `landing/src/components/sections/ActivityExplorer.tsx` and `ActivityDetailView.tsx` (favorite controls)
- Modify: locale JSON files and `landing/src/App.css`

**Interfaces:**
- Profile uses `GET /api/auth/me` and `PUT /api/auth/profile`.
- Favorites load from `GET /api/auth/favorites`; toggle uses `POST /api/activities/:id/favorite`.
- Favorite IDs are account-scoped and held in in-memory React state; they are not cached by the service worker.

- [ ] Add profile view for supported user fields and editable preferences; do not expose role or security fields as editable profile values.
- [ ] Add favorite toggles to cards and details with optimistic visual feedback and rollback on API failure.
- [ ] Add a favorites view that resolves favorite IDs to current public activity records and handles removed/unapproved records safely.
- [ ] For visitors, show the auth modal when a favorite action is selected; after successful sign-in, resume the favorite action without requiring a second click.
- [ ] Run `npm run build` from `landing/` and manually verify account isolation, visitor gating, sync after reload, profile update, API failure rollback, and empty favorites.

### Task 4: Map and location data quality

**Files:**
- Modify: `backend/models/Activity.js` (stop assigning a shared default coordinate to new venues)
- Modify: `backend/services/activity.service.js` or its activity DTO mapper (mark unavailable/unverified coordinates explicitly)
- Modify: `backend/routes/admin.routes.js`, `backend/controllers/admin.controller.js`, and `backend/services/admin.service.js` (admin-only location verification route with security audit)
- Create: `landing/src/views/ActivityMapView.tsx`
- Create: `landing/src/components/map/ActivityMap.tsx`
- Create: `landing/src/styles/activity-map.css`
- Create or modify: `landing/src/services/mapService.ts`
- Modify: locale JSON files and `landing/package.json` (Leaflet dependencies if not already present)

**Interfaces:**
- Map reads public activities and their `coordinates`; coordinate validity must be explicit and finite, within Tunisia bounds, and not the schema fallback `(34.7406, 10.7603)` unless that coordinate is verified for that specific venue.
- Leaflet uses OpenStreetMap tiles with visible attribution; no paid map key is required.

- [ ] Remove the model default that places every newly created activity at the same Sfax point; return coordinates as unavailable when not verified.
- [ ] Add an admin-only coordinate verification endpoint; partner payloads cannot mark coordinates verified, and changing coordinates invalidates the prior verification.
- [ ] Inventory existing records that contain the historical shared default. Do not bulk-rewrite production data; mark suspect coordinates unavailable until each venue is verified/backfilled through an approved data operation.
- [ ] Implement responsive map/list views, marker-to-detail navigation, and a user-triggered geolocation request with a clear denial fallback.
- [ ] Show unverified venues in city-level aggregate markers using `City.coords`, clearly marked approximate, while retaining every activity in the adjacent list; only verified venue coordinates may create precise markers.
- [ ] Run backend and landing build commands from their respective roots and manually verify valid/invalid coordinates, mobile layout, permission denied, and no-location fallback.

### Task 5: Preference-based recommendations

**Files:**
- Create: `landing/src/views/RecommendationsView.tsx`
- Create: `landing/src/components/recommendations/RecommendationForm.tsx`
- Create: `landing/src/components/recommendations/RecommendationResults.tsx`
- Create: `landing/src/services/recommendationService.ts`
- Modify: locale JSON files and route navigation

**Interfaces:**
- Submit `{ filters, sortBy, page, limit }` to `POST /api/activities/recommendations`.
- Render only returned public activities; use the shared activity card and favorite action.
- Preferences may be kept in the URL/session state for the current journey; do not infer sensitive personal characteristics.

- [ ] Inspect the mobile `activitytn/src/services/activityService.ts` recommendation filter contract and map only supported fields to the web form.
- [ ] Implement a short filter flow for city, category/type, budget and supported occasion/context choices; provide a skip/reset path.
- [ ] Render paginated, sortable results and preserve the submitted filter state on back navigation.
- [ ] Add explicit no-match, loading, API-error, and retry states.
- [ ] Run `npm run build` from `landing/` and manually verify filter serialization, reset, pagination, no results, and favorites from recommendations.

### Task 6: KharjaBot web experience

**Files:**
- Create: `landing/src/views/AssistantView.tsx`
- Create: `landing/src/components/chat/ChatMessageList.tsx`
- Create: `landing/src/components/chat/ChatComposer.tsx`
- Create: `landing/src/services/chatService.ts`
- Modify: locale JSON files and route navigation

**Interfaces:**
- Create/retrieve session through `POST /api/chat/session`; send messages through `POST /api/chat/send`; history through `GET /api/chat/history/:sessionId`.
- Guest session capability secret is held only in `sessionStorage`, sent in `X-Chat-Session-Token`, never placed in a URL or service-worker cache, and cleared when the session is reset.
- Authenticated profile tokens remain in HttpOnly cookies and are separate from the guest session capability secret.

- [ ] Confirm exact session and message response DTOs in the chat controllers before implementing the web adapter.
- [ ] Implement accessible conversation history, message composer, sending/streaming or pending state according to the actual API, retry, and session reset.
- [ ] Handle expired/invalid guest capability by creating a new session without exposing old history.
- [ ] Keep chat endpoints outside all Workbox runtime caching rules.
- [ ] Run `npm run build` from `landing/` and manually verify guest conversation, reload within the same tab session, invalid secret recovery, and offline/error behavior.

### Task 7: Localization, accessibility, PWA privacy, and release review

**Files:**
- Modify: `landing/vite.config.ts` (only if public route cache matching needs adjustment; retain public-only cache policy)
- Modify: `landing/src/locales/fr.json`, `landing/src/locales/en.json`, `landing/src/locales/ar.json`
- Modify: `landing/src/index.css`, `landing/src/App.css`, and scoped styles introduced above
- Modify: `landing/README.md` or create `docs/activitytn-public-web.md` (run/deploy/API/session guidance)

- [ ] Verify all visible strings use the three locale files and Arabic routes/layout remain RTL.
- [ ] Verify keyboard access, focus visibility, form labels/errors, dialog close/focus return, and reduced-motion behavior on the new flows.
- [ ] Verify mobile and desktop layouts, themes, offline public catalogue fallback, and that account/chat API URLs are not cached.
- [ ] Run `npm run build` from `landing/` and the backend's non-mutating lint/build-equivalent validation; execute manual acceptance journeys for visitor discovery, signed-in favorites/profile/review, map, recommendations, and chatbot.
- [ ] Document deployment requirements: HTTPS, exact allowed CORS origins, cookie credentials/CSRF, API URL, verified venue coordinates, PWA install expectations, and known offline limitations.

## Scope and delivery order

1. Tasks 1–3: usable public catalogue plus account, profile, favorites, and reviews.
2. Task 4: map after coordinate quality is addressed.
3. Tasks 5–6: recommendations and assistant.
4. Task 7: release review and documentation.

Partner and admin dashboards, payment processing, and web push remain future work and require their own approved plans.

## Self-review

- All approved public-web modules are covered: discovery, account/profile, favorites, reviews, map, recommendations, KharjaBot, and PWA/offline behavior.
- Role enforcement and moderation remain backend-controlled; no admin/partner UI is added by this plan.
- Coordinate defaults and demo fallback data are called out as real data-quality risks.
- Private data and chat capability secrets are explicitly excluded from service-worker caching.
- Automated tests are intentionally not planned or run under the current instruction; build checks and manual acceptance are specified.
