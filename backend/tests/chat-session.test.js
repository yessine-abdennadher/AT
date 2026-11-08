import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

const storeModule = await import("../services/chatSession.service.js").catch(() => ({}));

test("session creation returns a separate bearer token and stores only its SHA-256 digest", async () => {
  assert.equal(typeof storeModule.createChatSessionStore, "function");
  let created;
  const store = storeModule.createChatSessionStore({
    ChatSessionModel: { create: async (value) => (created = { ...value }) },
  });

  const { session, sessionToken } = await store.createChatSession({ roleContext: "anonyme", userId: null });

  assert.match(session.sessionId, /^[0-9a-f-]{36}$/i);
  assert.match(sessionToken, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(created.sessionTokenHash, createHash("sha256").update(sessionToken).digest("hex"));
  assert.equal(JSON.stringify(session).includes(sessionToken), false);
  assert.equal(Object.hasOwn(created, "requestedSessionId"), false);
});

test("chat exchanges append atomically and retain at most 200 messages", async () => {
  assert.equal(typeof storeModule.createChatSessionStore, "function");
  let call;
  const store = storeModule.createChatSessionStore({
    ChatSessionModel: {
      findOneAndUpdate: async (...args) => (call = args),
    },
  });
  const botMessage = { sender: "bot", text: "Réponse", suggestions: [] };

  await store.appendChatExchange({ sessionId: "capability", sessionToken: "token", userText: "Question", botMessage });

  assert.deepEqual(call[0], {
    sessionId: "capability",
    sessionTokenHash: createHash("sha256").update("token").digest("hex"),
  });
  assert.deepEqual(call[1].$push.messages.$each, [
    { sender: "user", text: "Question" },
    botMessage,
  ]);
  assert.equal(call[1].$push.messages.$slice, -200);
  assert.deepEqual(call[2], { new: true, runValidators: true });
});

test("chat session lookup requires the bearer token digest as well as the session ID", async () => {
  assert.equal(typeof storeModule.createChatSessionStore, "function");
  let query;
  const expected = { sessionId: "capability" };
  const store = storeModule.createChatSessionStore({
    ChatSessionModel: { findOne: async (filter) => (query = filter, expected) },
  });

  assert.equal(await store.getChatSession("capability", "token"), expected);
  assert.deepEqual(query, {
    sessionId: "capability",
    sessionTokenHash: createHash("sha256").update("token").digest("hex"),
  });
});

test("session creation provides dynamic welcome prompt and quick replies in the requested language", async () => {
  let created;
  const store = storeModule.createChatSessionStore({
    ChatSessionModel: { create: async (value) => (created = { ...value }) },
  });

  // Test en Derja
  await store.createChatSession({ roleContext: "anonyme", language: "derja" });
  assert.equal(created.messages.length, 1);
  assert.equal(created.messages[0].sender, "bot");
  assert.ok(created.messages[0].text.length > 5);
  assert.ok(Array.isArray(created.messages[0].suggestions) && created.messages[0].suggestions.length > 0);
  assert.deepEqual(created.messages[0].suggestions, ["Khaddem GPS 📍", "Gremda", "Chihia", "Sakiet Ezzit", "Centre-ville"]);

  // Test en Français
  await store.createChatSession({ roleContext: "anonyme", language: "fr" });
  assert.deepEqual(created.messages[0].suggestions, ["Activer position 📍", "Gremda", "Chihia", "Sakiet Ezzit", "Centre-ville"]);
});
