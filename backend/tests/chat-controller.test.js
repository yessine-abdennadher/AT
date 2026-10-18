import test from "node:test";
import assert from "node:assert/strict";
import * as chatController from "../controllers/chat.controller.js";

function response() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("session creation ignores caller-supplied identity and returns server capability once", async () => {
  assert.equal(typeof chatController.createChatController, "function");
  let createInput;
  const session = { sessionId: "f54db05e-0819-48bb-987a-258a80a26813", messages: [] };
  const handlers = chatController.createChatController({
    sessionStore: {
      createChatSession: async (input) => (createInput = input, { session, sessionToken: "secret" }),
      getChatSession: async () => null,
    },
  });
  const res = response();

  await handlers.getOrCreateSession({ body: { roleContext: "not-a-role", sessionId: "chosen-by-client" } }, res, assert.fail);

  assert.equal(res.statusCode, 404);
  assert.equal(createInput, undefined);
});

test("new session response returns token and enforces the role-context allowlist", async () => {
  assert.equal(typeof chatController.createChatController, "function");
  let createInput;
  const session = { sessionId: "f54db05e-0819-48bb-987a-258a80a26813", messages: [] };
  const handlers = chatController.createChatController({
    sessionStore: {
      createChatSession: async (input) => (createInput = input, { session, sessionToken: "secret" }),
    },
  });
  const res = response();

  await handlers.getOrCreateSession({ body: { roleContext: "not-a-role" } }, res, assert.fail);

  assert.equal(res.body.sessionToken, "secret");
  assert.equal(res.body.session, session);
  assert.equal(createInput.roleContext, "anonyme");
});

test("session ID in history URL is not enough without the session-token header", async () => {
  assert.equal(typeof chatController.createChatController, "function");
  let lookupCalled = false;
  const handlers = chatController.createChatController({
    sessionStore: { getChatSession: async () => (lookupCalled = true, { messages: [] }) },
  });
  const res = response();

  await handlers.getHistory({ params: { sessionId: "f54db05e-0819-48bb-987a-258a80a26813" }, headers: {} }, res, assert.fail);

  assert.equal(res.statusCode, 404);
  assert.equal(lookupCalled, false);
});

test("send rejects messages longer than 1000 characters before session lookup", async () => {
  assert.equal(typeof chatController.createChatController, "function");
  let lookupCalled = false;
  const handlers = chatController.createChatController({
    sessionStore: { getChatSession: async () => (lookupCalled = true, null) },
  });
  const res = response();

  await handlers.sendMessage({
    body: { sessionId: "f54db05e-0819-48bb-987a-258a80a26813", text: "x".repeat(1001) },
    headers: { "x-chat-session-token": "a".repeat(43) },
  }, res, assert.fail);

  assert.equal(res.statusCode, 400);
  assert.equal(lookupCalled, false);
});

test("a maximum-length user message still produces a valid stored bot message", async () => {
  assert.equal(typeof chatController.createChatController, "function");
  let exchange;
  const session = { roleContext: "anonyme", messages: [] };
  const updated = { messages: [{ sender: "user", text: "x".repeat(1000) }, { sender: "bot", text: "ok" }] };
  const handlers = chatController.createChatController({
    sessionStore: {
      getChatSession: async () => session,
      appendChatExchange: async (input) => (exchange = input, updated),
    },
  });
  const res = response();

  await handlers.sendMessage({
    body: { sessionId: "f54db05e-0819-48bb-987a-258a80a26813", text: "x".repeat(1000) },
    headers: { "x-chat-session-token": "a".repeat(43) },
  }, res, assert.fail);

  assert.equal(exchange.userText.length, 1000);
  assert.ok(exchange.botMessage.text.length <= 1000);
});
