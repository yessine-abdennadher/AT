import test from "node:test";
import assert from "node:assert/strict";

const storeModule = await import("../services/rateLimitStore.service.js").catch(() => ({}));

function createFakeCounter() {
  const rows = new Map();
  return {
    rows,
    async findOneAndUpdate(filter, update) {
      const id = `${filter.key}:${filter.windowStart.getTime()}`;
      const row = rows.get(id) || { key: filter.key, windowStart: filter.windowStart, count: 0 };
      row.count += update.$inc.count;
      if (update.$setOnInsert?.expiresAt) row.expiresAt = update.$setOnInsert.expiresAt;
      rows.set(id, row);
      return row;
    },
  };
}

test("fixed-window counter increments atomically and starts a new bucket after expiry", async () => {
  assert.equal(typeof storeModule.createRateLimitStore, "function");
  const Counter = createFakeCounter();
  const increment = storeModule.createRateLimitStore({ Counter });

  const first = await increment({ key: "client", windowMs: 1000, now: 1500 });
  const second = await increment({ key: "client", windowMs: 1000, now: 1900 });
  const nextWindow = await increment({ key: "client", windowMs: 1000, now: 2000 });

  assert.deepEqual(first, { count: 1, resetAt: 2000 });
  assert.deepEqual(second, { count: 2, resetAt: 2000 });
  assert.deepEqual(nextWindow, { count: 1, resetAt: 3000 });
});

test("rate-limit key digest is stable and does not expose the raw client key", async () => {
  assert.equal(typeof storeModule.hashRateLimitKey, "function");
  const digest = storeModule.hashRateLimitKey("auth:/login:127.0.0.1");
  assert.equal(digest, storeModule.hashRateLimitKey("auth:/login:127.0.0.1"));
  assert.match(digest, /^[a-f0-9]{64}$/);
  assert.notEqual(digest, "auth:/login:127.0.0.1");
});
