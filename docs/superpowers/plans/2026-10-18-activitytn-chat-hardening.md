# ActivityTN Chat Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Prevent chat-session takeover and bound chat message storage while preserving guest chat.

**Architecture:** Use opaque server-generated session IDs plus a separate random 256-bit bearer capability, store only its SHA-256 digest, and require it in `X-Chat-Session-Token`. Apply shared creation/message limits, validate message size, and atomically append a bounded history.

**Tech Stack:** Node.js ESM, Express 4, Mongoose 8, Node `node:test` / `node:assert`.

**Spec:** `docs/superpowers/specs/2026-10-18-activitytn-backend-hardening-design.md`

## Global Constraints

- Preserve the guest chat flow; do not require login in this change.
- Generate IDs with `node:crypto`; do not accept caller-selected IDs for new sessions.
- Cap user input at 1,000 characters and retained history at 200 messages.
- Session capability is separate from the ID, returned once at creation, hashed at rest, and never placed in URLs.
- Use the shared rate limiter from `2026-10-18-activitytn-shared-rate-limits.md`.
- Preserve JSON error shape and only return session capability on creation.

## Review Focus

- Caller supplies an existing session ID to `/session`: cannot claim or read it; test 404/403 behavior without leaking existence.
- Concurrent sends to one session: no lost write and no more than 200 retained messages; test the atomic update contract.
- Empty, non-string, and >1,000-character messages: reject with 400; test all boundaries.
- Anonymous user changes role context: caller cannot elevate chat role; test allowed enum and server-controlled value.
- Session lookup for missing/invalid capability: uniform non-disclosing error; test response contract.
- Session ID in access logs: never sufficient to authorize access; test that token is required in the header.

---

### Task 1: Define the chat store operations

**Files:**
- Modify: `backend/models/ChatSession.js`
- Create: `backend/services/chatSession.service.js`
- Test: `backend/tests/chat-session.test.js`

**Interfaces:**
- `createChatSession({ roleContext, userId }) -> Promise<{ session, sessionToken }>` creates a crypto-generated ID/token pair and stores only `sessionTokenHash`.
- `appendChatExchange({ sessionId, sessionToken, userText, botMessage }) -> Promise<ChatSession|null>` atomically appends the exchange and retains at most 200 messages.
- `getChatSession(sessionId, sessionToken) -> Promise<ChatSession|null>` matches both ID and token digest.

- [x] **Step 1: Write failing tests** for generated identifiers, token hashing, capped message retention and capability checks.
- [x] **Step 2: Run `node --test tests/chat-session.test.js`**; observe expected failures.
- [x] **Step 3: Implement token-digest matching and atomic capped append** without read-modify-save message writes.
- [x] **Step 4: Run the focused test**; cap and returned messages pass.
- [x] **Step 5: Commit this task atomically** with the required session signature.

### Task 2: Secure chat routes and controller validation

**Files:**
- Modify: `backend/controllers/chat.controller.js`
- Modify: `backend/routes/chat.routes.js`
- Test: `backend/tests/chat-controller.test.js`

**Interfaces:**
- Controller consumes the session service from Task 1 and shared `chatSessionLimiter` / `chatLimiter`.
- Existing `POST /session`, `POST /send`, and `GET /history/:sessionId` routes remain.

- [x] **Step 1: Write failing tests** for caller identity rejection, creation token, protected history/send, limits and role allowlisting.
- [x] **Step 2: Run the focused test** and confirm expected failures.
- [x] **Step 3: Implement controller validation and header capability checks** with non-disclosing errors.
- [x] **Step 4: Apply shared limiters** to session creation and sending.
- [x] **Step 5: Run focused chat tests and the full backend suite**; frontend search found no existing backend-chat client calls.
- [x] **Step 6: Commit this task atomically** with the required session signature.

### Task 3: Chat API documentation

**Files:**
- Modify: `backend/README.md`

- [x] **Step 1: Document** capability handling, limits, retained history and client compatibility.
- [x] **Step 2: Run the full backend suite**; route paths remain unchanged.
- [x] **Step 3: Commit this documentation change** with the required session signature.
