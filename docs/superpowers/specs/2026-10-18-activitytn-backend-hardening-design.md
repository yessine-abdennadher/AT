# ActivityTN backend hardening — design

Date: 2026-10-18  
Branch: `fix/backend-hardening` (created from `master`)  
Scope: backend in `C:\AT\backend`; preserve existing frontend contracts unless a migration requires otherwise.

## Context and verified current state

- `middlewares/rateLimit.middleware.js` stores timestamp arrays in process memory; auth and chat limiters therefore reset on restart and do not coordinate across instances.
- Chat routes currently allow session creation and history access without authentication. Sessions and message arrays have no retention/size cap; `getOrCreateSession` accepts client-provided IDs and does not check session ownership.
- Reviews already live in `models/Review.js`, separate from Activity documents. Reactions remain embedded in each review and are changed through read-modify-save logic in `services/activity.service.js`.
- `getRecommendations` loads every activity and scores in application memory.
- `/health` always returns OK, while `server.js` starts listening without waiting for the Mongo connection promise to settle.
- Production CORS uses `CORS_ORIGIN` when supplied, but does not fail startup when it is missing or malformed.
- No email delivery provider or mailer integration is configured. A working email-verification flow therefore cannot be implemented honestly without a provider decision and credentials.
- The task branch is `fix/backend-hardening`, based on `master`; the dirty `activitytn` submodule is unrelated and must remain untouched.

## Goals

1. Make request limits shared, bounded, and stable across application instances.
2. Bound chat storage and prevent cross-user access to known session IDs without silently breaking the current guest chat flow.
3. Make review-reaction limits and updates race-safe while retaining existing review API payloads.
4. Reduce recommendation database reads by filtering and bounding candidates before in-memory scoring.
5. Record who approved or unapproved an activity and when.
6. Expose truthful liveness/readiness and reject invalid production CORS configuration at startup.
7. Add focused regression tests for these contracts.

## Design

### Shared rate limiting

Replace per-process maps with a Mongo-backed fixed-window counter. Use a hashed key built from limiter scope, normalized route, and the effective client IP; never use arbitrary raw paths as unbounded storage keys. Increment atomically, return existing 429 semantics and standard limit/retry headers, and expire old counter documents with a TTL index. Configure Express proxy trust explicitly so forwarded IP headers are not trusted from arbitrary clients. If Mongo is unavailable, fail the affected request closed rather than silently disabling a security control.

Keep the existing auth/chat thresholds unless tests or existing configuration establish a different contract. Apply the shared limiter to chat session creation as well as message sending.

### Chat storage and access

Keep the existing guest experience. Generate cryptographically random session IDs server-side and reject caller-selected IDs for new sessions. Generate a separate 256-bit session capability, return it only on creation, store only its SHA-256 digest, and require it in `X-Chat-Session-Token` for history and message operations; do not put the secret in a URL or logs. Bound message text and retained history; append user/bot messages atomically with a capped `$push`/`$slice` update to avoid concurrent lost updates and unbounded documents. Add limits for session creation and message sending through the shared limiter. Do not impose an account-wide session count until authenticated session ownership exists in the product contract.

### Review reactions

Keep reactions embedded for compatibility and avoid a data migration. Replace read-modify-save with a single-document atomic update pipeline that matches the review and current user, updates an existing reaction or appends only when the array is below the agreed cap. Concurrent first reactions by the same user must not create duplicates. If the current supported MongoDB version cannot guarantee these conditions atomically for embedded arrays, stop and return a revised migration design for review rather than shipping a best-effort workaround.

### Recommendations

Translate supported filters into a Mongo query first, retain the current scoring semantics, and score only a bounded candidate set. Add a stable deterministic sort and bounded page/limit parameters with safe defaults. Do not claim globally optimal ranking if candidate retrieval is bounded; document that behavior and preserve the current response shape where possible.

### Approval audit

Add an append-only ActivityApprovalAudit record for each actual approval-state transition, containing activity ID, actor user ID, previous/new state, and timestamp. Pass the authenticated admin identity from the controller into the service. Do not store credentials or unnecessary personal data. Repeated requests that do not change state should not create duplicate transition events.

### Runtime configuration and health

Require a non-empty, syntactically valid `CORS_ORIGIN` in production and validate every configured origin as an origin URL (no path/query/credentials). Keep development defaults. Separate process liveness from readiness; readiness reports unavailable until Mongoose is connected. Await the initial database connection before accepting traffic, and return a non-2xx readiness response when disconnected.

### Explicitly deferred

- Email verification: requires the owner to select/provision an email delivery provider and configure credentials. Do not add a fake verification flag or non-delivering flow.
- MongoDB TLS/network allowlisting: deployment-specific controls; record as an operations checklist item, not a code guarantee.
- Moving reactions into another collection: only if an atomic embedded-array implementation cannot satisfy the uniqueness/cap tests; this would require an approved migration plan.

## Files expected to change

- `backend/middlewares/rateLimit.middleware.js` and a new Mongo rate-limit model/service.
- `backend/controllers/chat.controller.js`, `backend/models/ChatSession.js`, `backend/routes/chat.routes.js`.
- `backend/models/Review.js` and `backend/services/activity.service.js`.
- `backend/controllers/activity.controller.js`, `backend/services/admin.service.js`, plus a new approval-audit model.
- `backend/server.js`, `backend/config/db.js`, and configuration documentation in `backend/README.md`.
- Focused tests under `backend/tests/` and the existing test command in `backend/package.json` only if required for test discovery.

## Error handling and compatibility

- Continue returning JSON errors with the existing `success: false` convention.
- Preserve current public activity/review response fields and guest chat capability.
- Invalid input receives 400; absent/foreign chat capability receives 403 or 404 without leaking session existence.
- Rate-limited requests receive 429 and a retry interval.
- Readiness is 503 when Mongo is not connected; liveness remains 200 while the process is alive.
- Production misconfiguration prevents startup with a clear variable name, never secret values.

## Verification

- Add tests first for rate-limit sharing/expiry, chat message caps and session ownership, concurrent reaction uniqueness/cap, bounded recommendation candidate retrieval, approval transition audit, CORS validation, and readiness status.
- Run each focused test red before its implementation, then green; run the full backend `npm test` suite.
- Run syntax/import checks and inspect `git diff` to confirm the dirty `activitytn` submodule is unchanged.
- Do not connect to production or modify database data. Any migration script, if found necessary, must be dry-run capable and preserve source data.

## Open implementation constraint

The package currently has no test runner dependency; existing tests are Node scripts. New tests should follow the repository’s dependency-free Node assertion style unless a clear existing test harness is discovered. Mongo integration tests must not assume a local MongoDB service is running; pure logic should use injected stores, and database contracts should be isolated behind testable adapters.
