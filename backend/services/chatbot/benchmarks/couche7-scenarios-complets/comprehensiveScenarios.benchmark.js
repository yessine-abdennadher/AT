import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeChatText } from "../../understanding/normalization/chatTextNormalizer.service.js";
import { matchFastPath } from "../../understanding/fastPath/chatFastPathMatcher.service.js";
import { classifyTurn } from "../../understanding/classification/chatClassification.facade.js";
import { matchSemanticIntent } from "../../understanding/semantic/chatSemanticIntentMatcher.service.js";
import { arbitrateUnderstanding } from "../../understanding/arbiter/chatUnderstandingArbiter.service.js";
import { evaluateChatSafety } from "../../capabilities/safety/chatSafety.service.js";
import { createChatMainGateway } from "../../conversations/chatMainGateway.service.js";
import { createInMemoryStateStore } from "../../memory/persistence/chatSessionStatePersistence.service.js";

const dir = dirname(fileURLToPath(import.meta.url));
const tablesDataset = JSON.parse(readFileSync(join(dir, "datasets", "multilingualTables1to15.dataset.json"), "utf8"));
const criticalDataset = JSON.parse(readFileSync(join(dir, "datasets", "criticalTests11to60.dataset.json"), "utf8"));
const scenariosDataset = JSON.parse(readFileSync(join(dir, "datasets", "multiTurnScenarios1to24.dataset.json"), "utf8"));

const MOCK_SFAX_ACTIVITIES = [
  { _id: "sfax-cafe-1", name: "Café Jasmin Sfax Jadida", type: "cafe", category: "cafe", city: "Sfax", address: "Sfax Jadida", price: 12, amenities: ["terrasse", "calme", "wifi", "climatisation"], suitableFor: ["friends", "couple"] },
  { _id: "sfax-cafe-2", name: "Salon de Thé El Ain", type: "cafe", category: "cafe", city: "Sfax", address: "El Ain", price: 10, amenities: ["calme", "wifi"], suitableFor: ["couple", "family"] },
  { _id: "sfax-cafe-3", name: "Café Lounge Route de Tunis", type: "cafe", category: "cafe", city: "Sfax", address: "Route de Tunis", price: 15, amenities: ["terrasse", "climatisation", "chic"], suitableFor: ["friends", "couple"] },
  { _id: "sfax-cafe-4", name: "Café Central Beb Bhar", type: "cafe", category: "cafe", city: "Sfax", address: "Centre-ville", price: 8, amenities: ["terrasse", "wifi"], suitableFor: ["friends"] },
  { _id: "sfax-cafe-5", name: "Café Vue Mer Chaffar", type: "cafe", category: "cafe", city: "Sfax", address: "Afrane", price: 14, amenities: ["vue_mer", "terrasse", "calme"], suitableFor: ["couple"] },
  { _id: "sfax-resto-1", name: "Restaurant Le Pirate Sfax", type: "restaurant", category: "restaurant", city: "Sfax", address: "Centre-ville", price: 35, amenities: ["climatisation", "chic", "parking"], suitableFor: ["couple", "family"] },
  { _id: "sfax-resto-2", name: "Pizzeria Bella Sfax Jadida", type: "restaurant", category: "restaurant", city: "Sfax", address: "Sfax Jadida", price: 18, amenities: ["terrasse", "wifi"], suitableFor: ["friends", "family"] },
  { _id: "sfax-sport-1", name: "Karting & Padel Arena Sfax", type: "sport", category: "sport", city: "Sfax", address: "Route de Tunis", price: 25, amenities: ["parking"], suitableFor: ["friends"] },
  { _id: "sfax-fun-1", name: "Escape Game & VR Sfax", type: "fun", category: "fun", city: "Sfax", address: "Sfax Jadida", price: 20, amenities: ["climatisation", "calme"], suitableFor: ["friends", "family"] },
  { _id: "sfax-parc-1", name: "Parc Touta & Balade Plein Air", type: "outdoor", category: "outdoor", city: "Sfax", address: "Centre-ville", price: 5, amenities: ["calme", "terrasse"], suitableFor: ["family", "friends", "couple"] },
  { _id: "sfax-parc-2", name: "Jardin Nature Route de l'Afran", type: "outdoor", category: "parc", city: "Sfax", address: "Afrane", price: 10, amenities: ["calme", "terrasse"], suitableFor: ["family", "friends"] },
];

function createMockRepo() {
  return {
    find: async (_query = {}, limit = 40) => MOCK_SFAX_ACTIVITIES.slice(0, limit),
    findById: async (id) => MOCK_SFAX_ACTIVITIES.find((a) => String(a._id) === String(id)) || MOCK_SFAX_ACTIVITIES[0],
  };
}

function runSingleUnderstanding(text, memory = {}) {
  const normalized = normalizeChatText(text);
  const fastPath = matchFastPath(normalized);
  const classification = classifyTurn({ normalized, memory });
  const semantic = matchSemanticIntent(normalized.normalizedText);
  const understanding = arbitrateUnderstanding({ normalized, fastPath, classification, semantic, memory });
  return { normalized, understanding };
}

export async function runComprehensiveScenariosBenchmark() {
  const start = performance.now();
  let passed = 0;
  let total = 0;
  const failures = [];

  // 1. Validation des 15 Tableaux Multilingues (FR, EN, AR, Aradarja Sfaxia)
  for (const tableGroup of tablesDataset) {
    for (const item of tableGroup.cases) {
      total += 1;
      const { normalized, understanding } = runSingleUnderstanding(item.input);
      const c = understanding.constraints;

      const intentOk = !item.expectedIntent || understanding.intent === item.expectedIntent;
      const cityOk = !item.expectedCity || c.city === item.expectedCity;
      const neighOk = !item.expectedNeighborhood || c.neighborhood === item.expectedNeighborhood;
      const catOk = !item.expectedCategory || c.categories.includes(item.expectedCategory) || c.category === item.expectedCategory;
      const groupOk = !item.expectedGroup || c.group === item.expectedGroup;
      const budgetLvlOk = !item.expectedBudgetLevel || c.budgetLevel === item.expectedBudgetLevel;
      const maxBudgetOk = !item.expectedMaxBudget || c.maxBudget === item.expectedMaxBudget;
      const nearMeOk = !item.expectedNearMe || c.nearMe === true;
      const amenityOk = !item.expectedAmenity || c.amenities.includes(item.expectedAmenity);
      const situationOk = !item.expectedSituation || c.situation === item.expectedSituation;
      const eveningOk = !item.expectedEvening || c.isEvening === true || c.situation === "night";
      const promoOk = !item.expectedPromo || c.hasPromo === true;
      const moodOk = !item.expectedMood || c.mood === item.expectedMood;
      const aradarjaOk = !item.expectAradarja || normalized.isAradarja === true;

      if (
        intentOk &&
        cityOk &&
        neighOk &&
        catOk &&
        groupOk &&
        budgetLvlOk &&
        maxBudgetOk &&
        nearMeOk &&
        amenityOk &&
        situationOk &&
        eveningOk &&
        promoOk &&
        moodOk &&
        aradarjaOk
      ) {
        passed += 1;
      } else {
        failures.push({
          type: `Table ${tableGroup.table} (${tableGroup.theme})`,
          input: item.input,
          expected: item,
          got: {
            intent: understanding.intent,
            isAradarja: normalized.isAradarja,
            constraints: c,
          },
        });
      }
    }
  }

  // 2. Validation des Tests Critiques #11 à #60
  for (const item of criticalDataset) {
    total += 1;
    if (item.expectSafetyBlock) {
      const safety = evaluateChatSafety(item.input);
      if (!safety.isSafe && safety.flag === item.expectedSafetyFlag) {
        passed += 1;
      } else {
        failures.push({ type: `Critical Test #${item.id}`, input: item.input, expectedFlag: item.expectedSafetyFlag, got: safety });
      }
      continue;
    }

    const { understanding } = runSingleUnderstanding(item.input);
    const c = understanding.constraints;

    const intentOk = !item.expectedIntent || understanding.intent === item.expectedIntent;
    const cityOk = !item.expectedCity || c.city === item.expectedCity;
    const neighOk = !item.expectedNeighborhood || c.neighborhood === item.expectedNeighborhood;
    const catOk = !item.expectedCategory || c.categories.includes(item.expectedCategory);
    const groupOk = !item.expectedGroup || c.group === item.expectedGroup;
    const budgetLvlOk = !item.expectedBudgetLevel || c.budgetLevel === item.expectedBudgetLevel;
    const maxBudgetOk = !item.expectedMaxBudget || c.maxBudget === item.expectedMaxBudget;
    const nearMeOk = !item.expectedNearMe || c.nearMe === true;
    const amenityOk = !item.expectedAmenity || c.amenities.includes(item.expectedAmenity);
    const situationOk = !item.expectedSituation || c.situation === item.expectedSituation;
    const eveningOk = !item.expectedEvening || c.isEvening === true || c.situation === "night";
    const promoOk = !item.expectedPromo || c.hasPromo === true;
    const contradictionOk = !item.expectedContradiction || c.hasContradiction === true;
    const excludedCatOk = !item.expectedExcludedCategory || c.excluded.categories.includes(item.expectedExcludedCategory);

    if (
      intentOk &&
      cityOk &&
      neighOk &&
      catOk &&
      groupOk &&
      budgetLvlOk &&
      maxBudgetOk &&
      nearMeOk &&
      amenityOk &&
      situationOk &&
      eveningOk &&
      promoOk &&
      contradictionOk &&
      excludedCatOk
    ) {
      passed += 1;
    } else {
      failures.push({
        type: `Critical Test #${item.id} (${item.section})`,
        input: item.input,
        expected: item,
        got: { intent: understanding.intent, constraints: c },
      });
    }
  }

  // 3. Validation des 24 Scénarios Multi-Tours Complets
  for (const sc of scenariosDataset) {
    total += 1;
    const stateStore = createInMemoryStateStore();
    const gateway = createChatMainGateway({
      repository: createMockRepo(),
      stateStore,
      llmIntentClassifier: async () => null,
    });
    const sessionId = `bench-sc-${sc.scenario}`;
    let lastReply = null;

    for (const turnText of sc.turns) {
      lastReply = await gateway.handleTurn({
        sessionId,
        text: turnText,
        userContext: { userCity: "Sfax" },
      });
    }

    const finalState = await stateStore.get(sessionId);
    const ac = finalState?.activeConstraints || {};
    const exp = sc.expectedFinalState || {};

    let ok = Boolean(lastReply && typeof lastReply.text === "string" && lastReply.text.length > 0);

    if (sc.expectContradictionClarification) {
      ok = ok && Boolean(lastReply?.metadata?.contradictionDetected);
    }
    if (sc.expectDistinctShownActivities) {
      ok = ok && (finalState?.shownActivityIds?.length || 0) >= 2;
    }
    if (exp.city) ok = ok && ac.city === exp.city;
    if (exp.neighborhood) ok = ok && ac.neighborhood === exp.neighborhood;
    if (exp.category) ok = ok && (ac.category === exp.category || ac.categories?.includes(exp.category));
    if (exp.group) ok = ok && ac.group === exp.group;
    if (exp.budgetLevel) ok = ok && ac.budgetLevel === exp.budgetLevel;
    if (exp.maxBudget) ok = ok && ac.maxBudget === exp.maxBudget;
    if (exp.nearMe) ok = ok && ac.nearMe === true;
    if (exp.amenities) {
      ok = ok && exp.amenities.every((a) => ac.amenities?.includes(a));
    }
    if (exp.excludedCategory) {
      ok = ok && ac.excluded?.categories?.includes(exp.excludedCategory) && !ac.categories?.includes(exp.excludedCategory);
    }
    if (exp.excludedCategories) {
      ok = ok && exp.excludedCategories.every((c) => ac.excluded?.categories?.includes(c) && !ac.categories?.includes(c));
    }
    if (exp.hasActivePlan) {
      ok = ok && Boolean(finalState?.plan?.steps?.length);
    }

    if (ok) {
      passed += 1;
    } else {
      failures.push({
        type: `Scénario Multi-Tours #${sc.scenario} (${sc.title})`,
        expected: sc.expectedFinalState || { contradiction: sc.expectContradictionClarification, distinct: sc.expectDistinctShownActivities },
        gotActiveConstraints: ac,
        gotShownCount: finalState?.shownActivityIds?.length,
        gotPlan: finalState?.plan,
        lastReply,
      });
    }
  }

  const durationMs = performance.now() - start;
  return {
    layer: "Couche 7 - Cahier Complet (15 Tableaux + Aradarja + 24 Scénarios + Tests #11-60)",
    passed,
    total,
    accuracy: Number(((passed / total) * 100).toFixed(1)),
    durationMs: Number(durationMs.toFixed(2)),
    failures,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const res = await runComprehensiveScenariosBenchmark();
  console.log(JSON.stringify(res, null, 2));
}

