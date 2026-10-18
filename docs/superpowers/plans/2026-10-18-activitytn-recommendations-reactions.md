# ActivityTN Recommendations and Reactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make review reactions race-safe and constrain recommendation work to indexed, filtered candidates.

**Architecture:** Keep Review documents and embedded reactions for now; use a single-document atomic update pipeline to toggle/update reactions within a fixed cap. Translate validated recommendation inputs to a Mongo filter, then preserve current scoring over a bounded, paginated candidate set.

**Tech Stack:** Node.js ESM, Mongoose 8, MongoDB aggregation/update pipelines, Node `node:test` / `node:assert`.

**Spec:** `docs/superpowers/specs/2026-10-18-activitytn-backend-hardening-design.md`

## Global Constraints

- Keep `Review` separate from `Activity`; no review data migration.
- Do not allow more than 50 reactions per review or more than one reaction per user per review.
- Preserve reaction-toggle semantics and current response fields.
- Preserve recommendation scoring weights; candidate retrieval must be bounded and deterministic.
- Clamp recommendations to `page >= 1` and `1 <= limit <= 100` with defaults page 1 and limit 20.
- Do not claim a globally optimal score outside the bounded candidate set.

## Review Focus

- Concurrent first reaction by same user: one reaction row only; test concurrent calls against the atomic store contract.
- 50 reactions already present: new user is rejected/left unchanged while existing users can still change/remove; test boundary.
- Invalid reaction type: same fallback to `like`; test.
- Recommendation filter with malicious regex characters: interpreted as literal input or exact enum validation; test.
- Equal recommendation scores and sort fields: stable ordering by `_id`; test pagination has no duplicates between pages.

---

### Task 1: Atomic bounded reaction updates

**Files:**
- Modify: `backend/models/Review.js`
- Modify: `backend/services/activity.service.js`
- Test: `backend/tests/review-reactions.test.js`

**Interfaces:**
- Preserve `reactToReview(activityId, reviewId, reactionType, userAuth)` result keys.
- Use `MAX_REACTIONS_PER_REVIEW = 50` as the single cap.

- [x] **Step 1: Write failing tests** for the atomic pipeline, reaction cap and fallback.
- [x] **Step 2: Run `node --test tests/review-reactions.test.js`** and observe expected failures.
- [x] **Step 3: Implement an atomic update pipeline** with a shared 50-reaction cap and one reaction per user.
- [x] **Step 4: Run focused tests**; no read-modify-save remains. A live Mongo replica-set concurrency test remains `À VÉRIFIER`.
- [x] **Step 5: Commit this task atomically** with the required session signature.

### Task 2: Bounded recommendation retrieval and pagination

**Files:**
- Modify: `backend/services/activity.service.js`
- Modify: `backend/controllers/activity.controller.js`
- Test: `backend/tests/recommendations.test.js`

**Interfaces:**
- `getRecommendations(filters = {}, sortBy = "rating", { page = 1, limit = 20 } = {})` returns `{ activities, page, limit, hasMore }`.
- Controller response retains `success` and `count`, and adds pagination metadata without removing existing fields.

- [x] **Step 1: Write failing tests** for query filters, candidate cap, deterministic surprise scoring and page bounds.
- [x] **Step 2: Run the focused test** and observe expected failures.
- [x] **Step 3: Build a Mongo filter** from supported fields, fetch at most `limit * 10` candidates with indexed deterministic extraction, preserve scoring weights, and paginate the bounded score set.
- [x] **Step 4: Run focused tests**; candidate and page limits are bounded.
- [x] **Step 5: Run the full backend test suite and commit** this task atomically with the required session signature.

### Task 3: Document ranking semantics

**Files:**
- Modify: `backend/README.md`

- [x] **Step 1: Document** bounded candidate scoring, filter inputs, pagination and ranking semantics.
- [x] **Step 2: Run the full backend suite** and inspect the response contract.
- [x] **Step 3: Commit documentation** with the required session signature.
