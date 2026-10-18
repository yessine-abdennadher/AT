# ActivityTN Approval Audit and Runtime Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Audit admin approval transitions and make production configuration and service health truthful.

**Architecture:** Persist append-only activity-approval events tied to the authenticated admin, validate CORS origins before startup, and expose liveness/readiness separately with readiness tied to Mongoose connectivity. Await DB startup before accepting requests.

**Tech Stack:** Node.js ESM, Express 4, Mongoose 8, Node `node:test` / `node:assert`.

**Spec:** `docs/superpowers/specs/2026-10-18-activitytn-backend-hardening-design.md`

## Global Constraints

- Audit actual approval-state transitions only; record activity, actor, previous state, next state, and timestamp.
- Never log secrets or persist unnecessary personal data.
- Production requires syntactically valid `CORS_ORIGIN`; development keeps local defaults.
- `/health/live` returns 200 while process is responsive; `/health/ready` returns 503 unless Mongo is connected.
- Do not accept API traffic before the initial DB connection succeeds.
- Email verification and deployment-specific Mongo TLS/network policy remain deferred per spec.

## Review Focus

- Approval request repeated with same value: does not create another audit entry; test.
- Invalid/non-boolean approval value: rejected with 400 and no audit; test.
- CORS origin with path, credentials, malformed URL, or empty production value: startup validation rejects it; test each class.
- Mongo disconnect after boot: readiness reports 503 while liveness remains 200; test both endpoints with injected connection state.
- Initial Mongo connection failure: server does not begin listening; test startup orchestration without launching a public server.

---

### Task 1: Append-only approval audit

**Files:**
- Create: `backend/models/ActivityApprovalAudit.js`
- Modify: `backend/controllers/admin.controller.js`
- Modify: `backend/services/admin.service.js`
- Test: `backend/tests/activity-approval-audit.test.js`

**Interfaces:**
- Change service signature to `toggleActivityApproval(activityId, isApproved, actorUserId)`.
- Controller supplies `req.user.id`; audit records `{ activity, actor, previousState, nextState, createdAt }`.

- [x] **Step 1: Write failing tests** for strict approval values.
- [x] **Step 2: Run `node --test tests/activity-approval-audit.test.js`** and observe expected failures.
- [x] **Step 3: Implement transition validation and transactional audit write**; unchanged state does not create an event.
- [x] **Step 4: Run focused tests** and existing admin coverage. Live transaction behavior on a replica set remains `À VÉRIFIER`.
- [x] **Step 5: Commit this task atomically** with the required session signature.

### Task 2: CORS validation and health lifecycle

**Files:**
- Modify: `backend/server.js`
- Modify: `backend/config/db.js`
- Create: `backend/config/runtimeConfig.js`
- Test: `backend/tests/runtime-config.test.js`
- Test: `backend/tests/health.test.js`

**Interfaces:**
- `parseAllowedOrigins({ nodeEnv, corsOrigin }) -> string[]` validates production configuration and retains development defaults.
- `createApp({ connectionState }) -> Express app` exposes `/health/live` and `/health/ready` for testable health behavior.
- `startServer()` awaits successful Mongo connection before `listen`.

- [x] **Step 1: Write failing pure tests** for origin parsing and health readiness.
- [x] **Step 2: Run focused Node tests** and observe expected failures.
- [x] **Step 3: Implement config parsing**; production origins must be valid bare HTTP(S) origins.
- [x] **Step 4: Implement testable app/startup boundaries**; readiness follows Mongo state and server startup waits for Mongo.
- [x] **Step 5: Run focused tests**; failed DB connection does not call the listener.
- [x] **Step 6: Commit this task atomically** with the required session signature.

### Task 3: Operations documentation and complete regression run

**Files:**
- Modify: `backend/README.md`
- Modify: `backend/package.json` only if test discovery requires it.

- [x] **Step 1: Document** production config, liveness/readiness and transactional audit semantics.
- [x] **Step 2: Run the full backend suite** with `npm --script-shell C:\Windows\System32\cmd.exe test`; all suites passed.
- [x] **Step 3: Commit documentation/test discovery** with the required session signature.
