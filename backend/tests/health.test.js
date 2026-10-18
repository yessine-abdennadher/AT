import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createApp } from "../app.js";
import { startServer } from "../server.js";

const requestHealth = async (readyState) => {
  const server = createServer(createApp({ connectionState: { readyState }, env: { NODE_ENV: "test" } }));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const live = await fetch(`${base}/health/live`);
    const ready = await fetch(`${base}/health/ready`);
    return [live.status, ready.status];
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
};

test("liveness stays successful while readiness follows Mongo connection state", async () => {
  assert.deepEqual(await requestHealth(0), [200, 503]);
  assert.deepEqual(await requestHealth(1), [200, 200]);
});

test("startup never opens an HTTP listener when Mongo connection fails", async () => {
  let listened = false;
  await assert.rejects(startServer({ connect: async () => { throw new Error("DB unavailable"); }, listen: () => { listened = true; }, env: { NODE_ENV: "production", CORS_ORIGIN: "https://app.example.com" } }));
  assert.equal(listened, false);
});
