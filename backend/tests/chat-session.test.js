import test from "node:test";
import assert from "node:assert/strict";

const storeModule = await import("../services/chatSession.service.js").catch(() => ({}));

test("session creation generates an unguessable server-side ID and ignores caller-selected IDs", async () => {
  assert.equal(typeof storeModule.createChatSessionStore, "function");
  let created;
  const store = storeModule.createChatSessionStore({
    ChatSessionModel: { create: async (value) => (created = value) },
  });

  const session = await store.createChatSession({ roleContext: "anonyme", userId: null });

  assert.match(session.sessionId, /^[0-9a-f-]{36}$/i);
  assert.equal(created.sessionId, session.sessionId);
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

  await store.appendChatExchange({ sessionId: "capability", userText: "Question", botMessage });

  assert.deepEqual(call[0], { sessionId: "capability" });
  assert.deepEqual(call[1].$push.messages.$each, [
    { sender: "user", text: "Question" },
    botMessage,
  ]);
  assert.equal(call[1].$push.messages.$slice, -200);
  assert.deepEqual(call[2], { new: true, runValidators: true });
});

test("chat session lookup uses the unguessable session capability", async () => {
  assert.equal(typeof storeModule.createChatSessionStore, "function");
  let query;
  const expected = { sessionId: "capability" };
  const store = storeModule.createChatSessionStore({
    ChatSessionModel: { findOne: async (filter) => (query = filter, expected) },
  });

  assert.equal(await store.getChatSession("capability"), expected);
  assert.deepEqual(query, { sessionId: "capability" });
});
