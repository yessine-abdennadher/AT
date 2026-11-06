import test from "node:test";
import assert from "node:assert/strict";
import { createChatMainGateway } from "../services/chatbot/conversations/chatMainGateway.service.js";
import { classifyIntentWithLlm } from "../services/chatbot/understanding/semantic/chatLlmIntentClassifier.service.js";
import { createInMemoryStateStore, deepMergeConstraints } from "../services/chatbot/memory/persistence/chatSessionStatePersistence.service.js";
import { normalizeChatText } from "../services/chatbot/understanding/normalization/chatTextNormalizer.service.js";
import { dynamicResponseStore } from "../services/chatbot/responses/dynamicPool/dynamicResponseStore.service.js";
import { resetUsageCounters } from "../services/chatbot/responses/dynamicPool/responseUsageTracker.service.js";
import { resolveResponse } from "../services/chatbot/responses/resolution/responseResolver.service.js";

const activities = [
  { _id: "a1", name: "Café Sidi", category: "Café", city: "La Marsa", rating: 4.5, openingTime: "08:00", closingTime: "23:00", phone: "21612345", amenities: ["wifi"] },
  { _id: "a2", name: "Resto Mer", category: "Restaurant", city: "La Marsa", rating: 4.2 },
];

const repository = {
  find: async () => activities,
  findById: async (id) => activities.find((a) => a._id === id) || null,
};

const newGateway = () => createChatMainGateway({ repository, stateStore: createInMemoryStateStore() });

test("normalizer resolves Arabizi and Tunisian city aliases", () => {
  const out = normalizeChatText("nheb 9ahwa fi marsa");
  assert.ok(out.normalizedText.includes("café"));
  assert.deepEqual(out.detectedCities, ["La Marsa"]);
});

test("deep merge keeps earlier criteria and handles exclusions", () => {
  const first = deepMergeConstraints(null, { city: "La Marsa", categories: ["cafe"], amenities: ["wifi"] });
  const second = deepMergeConstraints(first, { amenities: ["terrasse"], excluded: { amenities: ["wifi"], categories: [] } });
  assert.equal(second.city, "La Marsa");
  assert.deepEqual(second.categories, ["cafe"]);
  assert.deepEqual(second.amenities, ["terrasse"]);
});

test("multi-turn: search then detail question uses memory focus", async () => {
  const gw = newGateway();
  const search = await gw.handleTurn({ sessionId: "s1", text: "je cherche un café à la marsa" });
  assert.match(search.text, /Café Sidi/);
  const hours = await gw.handleTurn({ sessionId: "s1", text: "horaires ?" });
  assert.match(hours.text, /08:00 - 23:00/);
  const contact = await gw.handleTurn({ sessionId: "s1", text: "leur numéro" });
  assert.match(contact.text, /21612345/);
});

test("detail without any result asks to search first", async () => {
  const reply = await newGateway().handleTurn({ sessionId: "s2", text: "horaires" });
  assert.equal(reply.metadata.intentKey, "NO_FOCUS");
});

test("multi-step outing builds a plan", async () => {
  const reply = await newGateway().handleTurn({ sessionId: "s3", text: "un café puis un restaurant à la marsa" });
  assert.equal(reply.metadata.intentKey, "PLAN_SUCCESS");
});

test("response pool expands automatically after 3 uses", async () => {
  dynamicResponseStore.clear();
  resetUsageCounters();
  let expanded = 0;
  const expander = async (args) => { expanded += 1; const { expandResponsePool } = await import("../services/chatbot/responses/dynamicPool/llmVariantGenerator.service.js"); return expandResponsePool({ ...args, env: {} }); };
  for (let i = 0; i < 3; i += 1) resolveResponse({ intentKey: "GREETING", lang: "fr", expander });
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(expanded, 1);
  assert.ok(dynamicResponseStore.get("GREETING", "fr").length >= 1);
});

test("LLM intent classifier is called ONLY for intent understanding when FastPath and MiniLM are uncertain, and reply still comes from responses pool", async () => {
  let llmCalledWith = null;
  const gw = createChatMainGateway({
    repository,
    stateStore: createInMemoryStateStore(),
    llmIntentClassifier: async ({ text }) => {
      llmCalledWith = text;
      return {
        intent: "DISCOVER_ACTIVITIES",
        confidence: 0.88,
        source: "llm_intent_classifier",
        constraints: {
          city: "La Marsa",
          cities: ["La Marsa"],
          category: "cafe",
          categories: ["cafe"],
          budgetLevel: null,
          amenities: [],
          excluded: { amenities: [], categories: [] },
        },
      };
    },
  });

  const reply = await gw.handleTurn({ sessionId: "s-llm-intent", text: "bghina chi haja sympatico" });
  assert.equal(llmCalledWith, "bghina chi haja sympatico");
  assert.equal(reply.metadata.intentKey, "DISCOVER_SUCCESS");
  assert.match(reply.text, /Café Sidi/);
});

test("classifyIntentWithLlm parses Gemini 2.5 Flash JSON strictly into allowed intents", async () => {
  const result = await classifyIntentWithLlm({
    text: "3andkomchi blassa behia",
    env: { GEMINI_API_KEY: "test-key" },
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    intent: "DISCOVER_ACTIVITIES",
                    city: "Sousse",
                    category: "cafe",
                    budgetLevel: "low",
                    amenities: ["wifi"],
                  }),
                },
              ],
            },
          },
        ],
      }),
    }),
  });

  assert.equal(result.intent, "DISCOVER_ACTIVITIES");
  assert.equal(result.constraints.city, "Sousse");
  assert.equal(result.constraints.category, "cafe");
  assert.deepEqual(result.constraints.amenities, ["wifi"]);
});

test("chatbot speaks the user's language: derja query triggers derja response and persists across turns", async () => {
  const gw = newGateway();
  const res1 = await gw.handleTurn({ sessionId: "s-derja", text: "aslema, nheb 9ahwa fi marsa" });
  assert.equal(res1.metadata.lang, "derja");
  assert.match(res1.text, /L9it|e9tirah|khyar/i);
  assert.ok(res1.suggestions.some((s) => s.includes("Ar5as") || s.includes("terrasse") || s.includes("wifi")));

  // Follow-up question with ambiguous keyword "horaires" -> should still reply in derja because conversation is in derja!
  const res2 = await gw.handleTurn({ sessionId: "s-derja", text: "wa9tech y7el ?" });
  assert.equal(res2.metadata.lang, "derja");
  assert.match(res2.text, /ma7loul|Aw9at/i);
  assert.match(res2.text, /08:00 - 23:00/);
});


