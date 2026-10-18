# ActivityTN Shared Rate Limits Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enforce the existing authentication and chat rate limits consistently across backend instances using MongoDB.

**Architecture:** Replace in-memory request arrays with atomic fixed-window counters in a TTL-indexed Mongo collection. Keep the current limiter exports and response contracts; scope keys by limiter, normalized route, and effective client IP.

**Tech Stack:** Node.js ESM, Express 4, Mongoose 8, Node `node:test` / `node:assert`.

**Spec:** `docs/superpowers/specs/2026-10-18-activitytn-backend-hardening-design.md`

## Global Constraints

- Preserve existing auth limits: 30 requests per 15 minutes; chat: 20 requests per minute.
- Use shared Mongo-backed counters; counter documents expire using a TTL index.
- Do not trust forwarded client IP headers unless Express proxy trust is explicitly configured.
- Return 429 with `success: false` and a retry interval when the limit is exceeded.
- Fail closed for a limiter-backed request if the counter store is unavailable.
- Add no external dependency unless implementation proves it necessary.

## Review Focus

- Parallel requests across instances at the threshold: only `max` requests pass; test with shared injected store.
- Expired windows: the next request starts a fresh counter; test clock-boundary behavior.
- Missing or spoofed forwarding headers: client IP derives from Express's trusted `req.ip`; test key construction.
- Route IDs in URLs: IDs do not create unbounded distinct buckets; test normalized route scope.
- Counter-store failure: request is blocked with service error and does not call `next`; test middleware behavior.

---

### Task 1: Atomic fixed-window counter service

**Files:**
- Create: `backend/models/RateLimitCounter.js`
- Create: `backend/services/rateLimitStore.service.js`
- Test: `backend/tests/rate-limit-store.test.js`

**Interfaces:**
- Produces `incrementRateLimitCounter({ key, windowMs, now }) -> Promise<{ count, resetAt }>`.
- Store key is a SHA-256 digest; model has a unique key/window index and TTL expiry on `expiresAt`.
- No test requires a running MongoDB instance; inject the atomic counter adapter/clock boundary.

- [x] **Step 1: Write failing tests** for atomic increments, new window, and stable digest output.
- [x] **Step 2: Run `node --test tests/rate-limit-store.test.js`**; confirmed expected missing behavior.
- [x] **Step 3: Implement the model and service** with atomic upsert and duplicate-key retry.
- [x] **Step 4: Run the focused test**; all cases pass.
- [x] **Step 5: Commit this task atomically** with the required session signature.

### Task 2: Express middleware and limiter wiring

**Files:**
- Modify: `backend/middlewares/rateLimit.middleware.js`
- Modify: `backend/routes/chat.routes.js`
- Modify: `backend/server.js` only for explicit trusted-proxy configuration
- Modify: `backend/tests/verify-production.test.js`
- Test: `backend/tests/rate-limit-middleware.test.js`

**Interfaces:**
- Preserve `createRateLimiter({ windowMs, max, message })`, `authLimiter`, and `chatLimiter` exports.
- Add `chatSessionLimiter` using 20 creates per minute unless an existing documented limit is found.

- [x] **Step 1: Write failing middleware tests** for thresholds, headers, normalized routes and storage errors.
- [x] **Step 2: Run the focused tests** and observe expected failures.
- [x] **Step 3: Implement async middleware** with normalized route keys and trusted `req.ip`.
- [x] **Step 4: Wire session-creation limiter** and explicitly validate trusted proxy hops.
- [x] **Step 5: Run focused middleware tests and `node tests/verify-production.test.js`**; compatibility checks pass.
- [x] **Step 6: Commit this task atomically** with the required session signature.

### Task 3: Backend configuration documentation and regression run

**Files:**
- Modify: `backend/README.md`
- Modify: `backend/package.json` only if needed to include the new Node test files.

- [x] **Step 1: Document** Mongo counters, proxy-hop behavior, fail-closed behavior and quotas.
- [x] **Step 2: Run the full backend test suite** with the Windows `cmd.exe` script-shell override; all suites pass.
- [x] **Step 3: Commit documentation/test-discovery changes** with the required session signature.
