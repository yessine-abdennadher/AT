# Admin Dashboard Web Implementation Plan

> **For agentic workers:** Use the approved design in `docs/superpowers/specs/2026-11-15-admin-dashboard-web-design.md`. Implement natively in this session. Each task is a bounded implementation unit.

**Goal:** Port all six mobile admin dashboard modules into the Tfarhida web app and enable secure admin login with MFA.

**Architecture:** Add a role-protected `/admin` route, an admin dashboard view composed of focused tab components, and an API service using the existing cookie-based `apiRequest`. Extend the existing web login/context flow for the backend MFA challenge; keep backend authorization authoritative.

**Tech Stack:** React 19, TypeScript, React Router, existing `apiRequest`, Lucide icons, CSS tokens, FR/EN/AR locale JSON, Node built-in test runner for pure auth/access helpers.

**Spec:** `docs/superpowers/specs/2026-11-15-admin-dashboard-web-design.md`

## Global Constraints

- No new admin role may be assigned during public registration.
- Never store admin access or refresh tokens in `localStorage`.
- All admin API calls use the existing credentialed API client; backend middleware remains authoritative.
- Do not use demo data or locally fabricated statistics in admin screens.
- Keep each tab’s loading, error, empty and retry states local to its content.
- User-facing strings are added in French, English and Arabic; retain existing RTL behavior.
- Preserve unrelated dirty worktree changes; change only landing frontend files plus the scoped design/plan/technical docs.

## Review Focus

1. Expired or invalid MFA challenge must leave the user signed out and show a recoverable error — test challenge parsing, verification success and verification failure.
2. A signed-in non-admin must not mount admin data components or call `/admin/*` — test role gate decisions for `user`, `partner`, `admin`, and null.
3. An empty or out-of-range API page must render a coherent empty state and usable pagination — exercise the boundary in the owning tab.
4. A failing API request in one tab must not hide the tab bar or already-loaded modules — exercise a section-local failure state.
5. Missing telemetry or review data must be shown as unavailable/empty rather than an invented count — exercise null and empty payloads.

---

### Task 1: Admin MFA authentication flow

**Files:**
- Modify: `landing/src/services/authService.ts`
- Modify: `landing/src/context/AuthContext.tsx`
- Modify: `landing/src/components/ui/AuthModal.tsx`
- Modify: `landing/src/locales/fr.json`
- Modify: `landing/src/locales/en.json`
- Modify: `landing/src/locales/ar.json`
- Test: `landing/src/services/adminMfa.test.mjs`

**Interfaces:**
- Add `AdminMfaChallenge { challengeId: string; maskedEmail: string }` and `AdminMfaRequiredError` carrying this challenge.
- `authService.login(email, password)` rejects with that typed error only when backend returns `mfaRequired` and a non-empty `challengeId`; otherwise preserve the existing user result.
- Add `authService.verifyAdminMfa(challengeId, otp): Promise<AuthUser>` using `POST /auth/admin/mfa/verify` with cookies.
- Add context action `completeAdminMfa(user: AuthUser): Promise<void>` backed by the same accepted-user/session bootstrap logic as standard sign-in.
- Keep the OTP step inside the existing accessible `AuthModal`; verify a six-digit code and handle invalid/expired challenge without setting signed-in state.

- [ ] Write failing Node tests named `recognizes_mfa_challenge`, `passes_through_normal_login`, `rejects_mfa_response_without_challenge_id`, and `verifies_admin_otp_returns_user`; assert the parsed challenge fields, normal `user` object, explicit malformed-challenge error, and verified `user` object respectively.
- [ ] Run `node --test src/services/adminMfa.test.mjs` from `landing/` and confirm the expected failures.
- [ ] Implement typed challenge parsing and verification.
- [ ] Run the focused test and confirm it passes; verify context and modal TypeScript compilation.

### Task 2: Admin route gate and dashboard shell

**Files:**
- Create: `landing/src/views/AdminDashboardView.tsx`
- Create: `landing/src/components/admin/AdminDashboardTabs.tsx`
- Create: `landing/src/components/admin/AdminAccessGate.tsx`
- Create: `landing/src/styles/admin-dashboard.css`
- Modify: `landing/src/routes/AppRoutes.tsx`
- Modify: `landing/src/components/layout/Navbar.tsx`
- Modify: `landing/src/locales/fr.json`
- Modify: `landing/src/locales/en.json`
- Modify: `landing/src/locales/ar.json`
- Test: `landing/src/routes/adminAccess.test.mjs`

**Interfaces:**
- Add pure role predicate `isAdminRole(role: unknown): boolean` in `landing/src/services/adminAccess.ts`; test null, `user`, `partner`, and `admin`.
- Add route `/admin`; signed-out users see a login action, signed-in non-admins get an access-denied view, admins mount the dashboard.
- Add the admin navigation link only for role `admin`.
- Dashboard tabs: `overview | activities | reviews | users | partners | diagnostics`; preserve the tab bar while content loads or errors.

- [ ] Write failing role predicate tests named `allows_admin_role_only`, `denies_user_partner_and_unknown_roles`, and `denies_null_user`; run `node --test src/routes/adminAccess.test.mjs`.
- [ ] Add the route gate and dashboard shell; ensure no admin service is called before role authorization.
- [ ] Re-run role tests and TypeScript checking.

### Task 3: Admin API service and overview

**Files:**
- Create: `landing/src/services/adminService.ts`
- Create: `landing/src/components/admin/AdminOverviewTab.tsx`
- Modify: `landing/src/views/AdminDashboardView.tsx`
- Modify: `landing/src/locales/fr.json`
- Modify: `landing/src/locales/en.json`
- Modify: `landing/src/locales/ar.json`

**Interfaces:**
- Define web-local DTOs for platform stats, activity moderation rows, reviews, users and partner diagnostics; do not import types across the Expo app.
- `adminService` calls `/admin/stats`, `/admin/activities`, `/admin/reviews`, `/admin/users`, `/admin/diagnostics`, plus the corresponding protected PATCH/DELETE routes through `apiRequest`.
- Overview renders totals for users/partners/admins, activities/pending approval, reviews and activities by city from `/admin/stats` only.
- Diagnostics display a neutral empty/unavailable state when telemetry fields are missing.

- [ ] Add typed service contracts and render overview loading/error/empty/success states.
- [ ] Use backend values directly; do not derive missing totals in the UI.
- [ ] Typecheck the service and overview before continuing.

### Task 4: Activity and review moderation tabs

**Files:**
- Create: `landing/src/components/admin/AdminActivitiesTab.tsx`
- Create: `landing/src/components/admin/AdminReviewsTab.tsx`
- Create: `landing/src/components/admin/ConfirmAdminActionDialog.tsx`
- Modify: `landing/src/services/adminService.ts`
- Modify: `landing/src/views/AdminDashboardView.tsx`
- Modify: `landing/src/locales/fr.json`
- Modify: `landing/src/locales/en.json`
- Modify: `landing/src/locales/ar.json`

**Interfaces:**
- Activities support status filters, approve/suspend, featured, popular, and delete. Confirm delete before calling `DELETE /admin/activities/:id`.
- Reviews load pending status pages with page/limit, approve or reject, and reload the affected page.
- Keep each tab’s loading, error/retry and empty state local; preserve tab navigation during requests.

- [ ] Implement each action using its matching admin endpoint and typed result.
- [ ] Add confirmation for destructive action and visible pending/error/success feedback.
- [ ] Typecheck both tabs and verify locale-key completeness.

### Task 5: User and partner administration tabs

**Files:**
- Create: `landing/src/components/admin/AdminUsersTab.tsx`
- Create: `landing/src/components/admin/AdminPartnersTab.tsx`
- Create: `landing/src/components/admin/AdminPartnerDetailsDialog.tsx`
- Create: `landing/src/components/admin/AdminPartnerTierDialog.tsx`
- Modify: `landing/src/services/adminService.ts`
- Modify: `landing/src/views/AdminDashboardView.tsx`
- Modify: `landing/src/locales/fr.json`
- Modify: `landing/src/locales/en.json`
- Modify: `landing/src/locales/ar.json`

**Interfaces:**
- Users support server-side search, role/status filters, pagination, activate/suspend, and role changes. Disable editing the signed-in admin account in the UI.
- Partner tab consumes `/admin/diagnostics` partner summaries, searches name/email/establishment, filters tier/freshness, and opens a details dialog.
- Tier updates use `PATCH /admin/partners/:id/tier`; preserve server authorization and confirm the selected new tier.
- Display subscription dates/status, last login, last activity update, offers and activity summary as returned; do not imply payments are processed in this tab.

- [ ] Add paginated user controls and per-row action states.
- [ ] Add partner filters, details, and tier-update confirmation.
- [ ] Typecheck both modules and verify the 50%/200% narrow viewport layout manually where the browser is available.

### Task 6: Diagnostics, docs and integration

**Files:**
- Create: `landing/src/components/admin/AdminDiagnosticsTab.tsx`
- Modify: `landing/src/services/adminService.ts`
- Modify: `landing/src/views/AdminDashboardView.tsx`
- Modify: `landing/src/locales/fr.json`
- Modify: `landing/src/locales/en.json`
- Modify: `landing/src/locales/ar.json`
- Create: `docs/admin-dashboard-web.md`

**Interfaces:**
- Diagnostics show global electricity status, total mobile sessions and top screen views from `/admin/diagnostics`.
- Changing global electricity mode uses `PATCH /admin/electricity-mode`; require a confirmation dialog and reflect only the returned state.
- Documentation states objectives, files, route/backend access rules, MFA, validation commands and known limits.

- [ ] Implement diagnostics with empty and request-error states.
- [ ] Add technical documentation.
- [ ] Run focused tests, `npx tsc -p tsconfig.app.json --noEmit --pretty false`, `npx vite build`, and the existing locale consistency checker if present.
- [ ] Review the final diff to confirm unrelated dirty files were left untouched.
