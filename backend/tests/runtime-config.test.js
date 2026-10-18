import test from "node:test";
import assert from "node:assert/strict";
import { parseAllowedOrigins, resolveMongoUri } from "../config/runtimeConfig.js";
import { getJwtSecrets } from "../config/jwt.config.js";

test("production CORS configuration requires valid HTTP(S) origins", () => {
  assert.deepEqual(parseAllowedOrigins({ nodeEnv: "production", corsOrigin: "https://app.example.com,https://admin.example.com" }), ["https://app.example.com", "https://admin.example.com"]);
  for (const corsOrigin of ["", "https://app.example.com/path", "https://user:pass@app.example.com", "ftp://app.example.com", "not-a-url"]) {
    assert.throws(() => parseAllowedOrigins({ nodeEnv: "production", corsOrigin }));
  }
});

test("development retains localhost frontend origins", () => {
  assert.ok(parseAllowedOrigins({ nodeEnv: "development", corsOrigin: "" }).includes("http://localhost:5173"));
});

test("production JWT secrets must be present, strong, and distinct", () => {
  const base = { NODE_ENV: "production", JWT_SECRET: "a".repeat(40), JWT_REFRESH_SECRET: "b".repeat(40) };
  assert.deepEqual(getJwtSecrets(base), { accessSecret: base.JWT_SECRET, refreshSecret: base.JWT_REFRESH_SECRET });
  for (const env of [
    { ...base, JWT_REFRESH_SECRET: undefined },
    { ...base, JWT_SECRET: "short" },
    { ...base, JWT_REFRESH_SECRET: base.JWT_SECRET },
  ]) assert.throws(() => getJwtSecrets(env));
});

test("Mongo URI fallback is development-only", () => {
  assert.equal(resolveMongoUri({ nodeEnv: "development" }), "mongodb://127.0.0.1:27017/activitytn_db");
  assert.equal(resolveMongoUri({ nodeEnv: "production", mongoUri: "mongodb+srv://cluster/db" }), "mongodb+srv://cluster/db");
  assert.throws(() => resolveMongoUri({ nodeEnv: "production" }));
});
