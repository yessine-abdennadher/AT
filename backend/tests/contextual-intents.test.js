import test from "node:test";
import assert from "node:assert/strict";
import { normalizeChatText } from "../services/chatbot/understanding/normalization/chatTextNormalizer.service.js";
import { extractOutingConstraints } from "../services/chatbot/understanding/constraints/chatOutingConstraints.service.js";
import { classifyTurn } from "../services/chatbot/understanding/classification/chatClassification.facade.js";
import { createChatMainGateway } from "../services/chatbot/conversations/chatMainGateway.service.js";
import { createInMemoryStateStore } from "../services/chatbot/memory/persistence/chatSessionStatePersistence.service.js";

const mockActivities = [
  {
    _id: "act-1",
    name: "Dîner Romantique Couché de Soleil - Restaurant Le Pirate",
    city: "Sfax",
    address: "Route Sidi Mansour Km 4, Sfax",
    category: "food",
    suitableFor: ["couple"],
    price: 45,
    rating: 4.9,
    isIndoor: true,
  },
  {
    _id: "act-2",
    name: "Bowling & Gaming Zone",
    city: "Sfax",
    address: "Bab Bhar, Sfax",
    category: "fun",
    suitableFor: ["friends"],
    price: 15,
    rating: 4.7,
    isIndoor: true,
  },
  {
    _id: "act-3",
    name: "Café Salon de Thé Cosy Le Chauffé",
    city: "Sfax",
    address: "Chihia, Sfax",
    category: "cafe",
    suitableFor: ["couple", "friends"],
    price: 8,
    rating: 4.8,
    isIndoor: true,
  },
  {
    _id: "act-4",
    name: "Restaurant Mlewwi & Plats Économiques",
    city: "Sfax",
    address: "Sfax",
    category: "restaurant",
    price: 12,
    rating: 4.6,
    isIndoor: true,
  },
];

const createMockRepo = () => ({
  find: async (query, limit) => mockActivities.slice(0, limit),
  findById: async (id) => mockActivities.find((a) => a._id === id) || null,
});

test("Scenario 1 - Ennui / Changement de mood: 'ouh 9L9T n7eb n5rej nbd ljww'", async () => {
  const normalized = normalizeChatText("ouh 9L9T n7eb n5rej nbd ljww");
  const constraints = extractOutingConstraints({ normalizedText: normalized.normalizedText });
  assert.equal(constraints.mood, "boredom_relief");

  const classification = classifyTurn({ normalized, memory: {} });
  assert.equal(classification.dto.intent, "DISCOVER_ACTIVITIES");

  const gateway = createChatMainGateway({
    repository: createMockRepo(),
    stateStore: createInMemoryStateStore(),
  });

  const reply = await gateway.handleTurn({
    sessionId: "test-boredom-turn",
    text: "ouh 9L9T n7eb n5rej nbd ljww",
    userContext: { userCity: "Sfax" },
  });

  assert.equal(reply.metadata?.intentKey, "DISCOVER_BOREDOM_RELIEF");
  assert.ok(reply.text.includes("Faddit") || reply.text.includes("9la9") || reply.text.includes("jaw"));
  assert.ok(reply.suggestions.length > 0);
});

test("Scenario 2 - Sortie entre amis: 'n7b n5rej en ws 7abi'", async () => {
  const normalized = normalizeChatText("n7b n5rej en ws 7abi");
  const constraints = extractOutingConstraints({ normalizedText: normalized.normalizedText });
  assert.equal(constraints.group, "friends");

  const gateway = createChatMainGateway({
    repository: createMockRepo(),
    stateStore: createInMemoryStateStore(),
  });

  const reply = await gateway.handleTurn({
    sessionId: "test-friends-turn",
    text: "n7b n5rej en ws 7abi",
    userContext: { userCity: "Sfax" },
  });

  assert.equal(reply.metadata?.intentKey, "DISCOVER_FRIENDS");
  assert.ok(reply.text.includes("s7ab") || reply.text.includes("lamma") || reply.text.includes("jaw"));
  assert.ok(reply.suggestions.includes("Gaming & Fun") || reply.suggestions.includes("9ahwa lamma"));
});

test("Scenario 3 - Météo froide / Intempéries: 't9s berd win njmo n5rjo'", async () => {
  const normalized = normalizeChatText("t9s berd win njmo n5rjo");
  const constraints = extractOutingConstraints({ normalizedText: normalized.normalizedText });
  assert.equal(constraints.situation, "cold");

  const gateway = createChatMainGateway({
    repository: createMockRepo(),
    stateStore: createInMemoryStateStore(),
  });

  const reply = await gateway.handleTurn({
    sessionId: "test-cold-turn",
    text: "t9s berd win njmo n5rjo",
    userContext: { userCity: "Sfax" },
  });

  assert.equal(reply.metadata?.intentKey, "DISCOVER_COLD_WEATHER");
  assert.ok(reply.text.includes("berd") || reply.text.includes("defy") || reply.text.includes("cozy"));
});

test("Scenario 4 - Sortie en couple: 'n7b n5rej en w s7bti'", async () => {
  const normalized = normalizeChatText("n7b n5rej en w s7bti");
  const constraints = extractOutingConstraints({ normalizedText: normalized.normalizedText });
  assert.equal(constraints.group, "couple");

  const gateway = createChatMainGateway({
    repository: createMockRepo(),
    stateStore: createInMemoryStateStore(),
  });

  const reply = await gateway.handleTurn({
    sessionId: "test-couple-turn",
    text: "n7b n5rej en w s7bti",
    userContext: { userCity: "Sfax" },
  });

  assert.equal(reply.metadata?.intentKey, "DISCOVER_COUPLE");
  assert.ok(reply.text.includes("romantique") || reply.text.includes("couple") || reply.text.includes("calme"));
  assert.ok(reply.suggestions.includes("Dîner romantique") || reply.suggestions.includes("Vue b7ar") || reply.suggestions.includes("Cadre calme"));
});

test("Scenario 5 - Restaurant économique: 'n7b resturnat nfter fih w mouch 8ali'", async () => {
  const normalized = normalizeChatText("n7b resturnat nfter fih w mouch 8ali");
  const constraints = extractOutingConstraints({ normalizedText: normalized.normalizedText });
  assert.equal(constraints.budgetLevel, "low");
  assert.ok(constraints.category === "restaurant" || constraints.categories.includes("restaurant"));

  const gateway = createChatMainGateway({
    repository: createMockRepo(),
    stateStore: createInMemoryStateStore(),
  });

  const reply = await gateway.handleTurn({
    sessionId: "test-budget-food-turn",
    text: "n7b resturnat nfter fih w mouch 8ali",
    userContext: { userCity: "Sfax" },
  });

  assert.equal(reply.metadata?.intentKey, "DISCOVER_BUDGET_FOOD");
  assert.ok(reply.text.includes("ghali") || reply.text.includes("bnin") || reply.text.includes("budget") || reply.text.includes("jib"));
});

