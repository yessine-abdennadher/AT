import test from "node:test";
import assert from "node:assert/strict";
import { createRateLimiter } from "../middlewares/rateLimit.middleware.js";

function createSharedCounter() {
  const counters = new Map();
  return async ({ key, windowMs, now }) => {
    const window = Math.floor(now / windowMs) * windowMs;
    const id = `${key}:${window}`;
    const count = (counters.get(id) || 0) + 1;
    counters.set(id, count);
    return { count, resetAt: window + windowMs };
  };
}

function request(limiter, req) {
  return new Promise((resolve, reject) => {
    const headers = {};
    const res = {
      setHeader: (key, value) => { headers[key] = value; },
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) { resolve({ status: this.statusCode || 200, body, headers }); },
    };
    limiter(req, res, (error) => error ? reject(error) : resolve({ status: 200, headers }));
  });
}

test("separate limiter instances share the same bucket and block after the configured maximum", async () => {
  const increment = createSharedCounter();
  const options = { scope: "auth", windowMs: 60_000, max: 1, incrementCounter: increment, now: () => 10_000 };
  const firstLimiter = createRateLimiter(options);
  const secondLimiter = createRateLimiter(options);
  const req = { ip: "192.0.2.1", method: "POST", baseUrl: "/api/auth", route: { path: "/login" } };

  const first = await request(firstLimiter, req);
  const second = await request(secondLimiter, req);

  assert.equal(first.status, 200);
  assert.equal(first.headers["RateLimit-Remaining"], 0);
  assert.equal(first.headers["X-RateLimit-Remaining"], 0);
  assert.equal(second.status, 429);
  assert.equal(second.body.success, false);
  assert.equal(second.body.retryAfterSeconds, 50);
});

test("unknown dynamic paths do not become raw high-cardinality limiter keys", async () => {
  const keys = [];
  const limiter = createRateLimiter({
    scope: "auth", windowMs: 60_000, max: 10, now: () => 0,
    incrementCounter: async (args) => { keys.push(args.key); return { count: 1, resetAt: 60_000 }; },
  });
  await request(limiter, { ip: "192.0.2.2", method: "GET", baseUrl: "/api/auth", path: "/token/one" });
  await request(limiter, { ip: "192.0.2.2", method: "GET", baseUrl: "/api/auth", path: "/token/two" });
  assert.equal(keys[0], keys[1]);
});

test("counter storage failure blocks the request without calling next", async () => {
  let passed = false;
  const limiter = createRateLimiter({
    incrementCounter: async () => { throw new Error("store unavailable"); },
  });
  const result = await new Promise((resolve) => limiter(
    { ip: "192.0.2.3", method: "POST", baseUrl: "/api/auth", route: { path: "/login" } },
    { setHeader() {}, status(code) { this.code = code; return this; }, json(body) { resolve({ code: this.code, body }); } },
    () => { passed = true; resolve(null); }
  ));
  assert.equal(passed, false);
  assert.equal(result.code, 503);
  assert.equal(result.body.success, false);
});
