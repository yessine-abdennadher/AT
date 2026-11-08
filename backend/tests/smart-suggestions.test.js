import test from "node:test";
import assert from "node:assert/strict";
import { normalizeChatText } from "../services/chatbot/understanding/normalization/chatTextNormalizer.service.js";
import { getSmartSuggestions } from "../services/chatbot/responses/suggestions/smartSuggestionsEngine.service.js";
import { createChatMainGateway } from "../services/chatbot/conversations/chatMainGateway.service.js";
import { createInMemoryStateStore } from "../services/chatbot/memory/persistence/chatSessionStatePersistence.service.js";

test("neighborhood normalization resolves Sfax delegations and auto-infers city Sfax", () => {
  const t1 = normalizeChatText("A3tini 9ahwa fi Gremda");
  assert.deepEqual(t1.detectedNeighborhoods, ["Gremda"]);
  assert.ok(t1.detectedCities.includes("Sfax"));

  const t2 = normalizeChatText("khoussa fi chihya");
  assert.deepEqual(t2.detectedNeighborhoods, ["Chihia"]);
  assert.ok(t2.detectedCities.includes("Sfax"));

  const t3 = normalizeChatText("resto fi sakiet ezzit");
  assert.deepEqual(t3.detectedNeighborhoods, ["Sakiet Ezzit"]);
  assert.ok(t3.detectedCities.includes("Sfax"));

  const t4 = normalizeChatText("blassa fi bab bhar");
  assert.deepEqual(t4.detectedNeighborhoods, ["Centre-ville"]);
  assert.ok(t4.detectedCities.includes("Sfax"));
});

test("smart suggestions engine generates progressive step-by-step chips", () => {
  // Étape 1 : IDLE sans GPS (FR & Derja)
  const step1NoGpsFr = getSmartSuggestions({ status: "IDLE", lang: "fr", hasGps: false });
  assert.deepEqual(step1NoGpsFr, ["Activer position 📍", "Gremda", "Chihia", "Sakiet Ezzit", "Centre-ville"]);

  const step1NoGpsDerja = getSmartSuggestions({ status: "IDLE", lang: "derja", hasGps: false });
  assert.deepEqual(step1NoGpsDerja, ["Khaddem GPS 📍", "Gremda", "Chihia", "Sakiet Ezzit", "Centre-ville"]);

  // Étape 1 : IDLE avec GPS actif
  const step1WithGps = getSmartSuggestions({ status: "IDLE", lang: "fr", hasGps: true });
  assert.deepEqual(step1WithGps, ["Autour de moi 📍", "Gremda", "Chihia", "Sakiet Ezzit", "Centre-ville"]);

  // Étape 2 : Zone sélectionnée (ex: Gremda), proposition de catégories pures
  const step2 = getSmartSuggestions({
    status: "COLLECTING_CRITERIA",
    lang: "fr",
    constraints: { city: "Sfax", neighborhood: "Gremda" },
  });
  assert.deepEqual(step2, ["Café", "Restaurant", "Plein air", "Loisirs & Fun"]);

  // Étape 3 : Résultats affichés -> Affinage & Ambiance
  const step3 = getSmartSuggestions({ status: "RECOMMENDING", lang: "fr", hasResults: true });
  assert.deepEqual(step3, ["Moins cher", "Avec terrasse", "Familial", "Ouvert maintenant"]);

  // Étape 4 : Inspection d'un lieu -> Actions rapides
  const step4 = getSmartSuggestions({ status: "INSPECTING_ITEM", lang: "fr" });
  assert.deepEqual(step4, ["Horaires", "Menu & Prix", "Itinéraire", "Autre zone"]);

  // Repli alternatif : zone demandée vide
  const alt = getSmartSuggestions({ isZoneAlternative: true, lang: "fr" });
  assert.deepEqual(alt, ["Centre-ville", "Chihia", "Sakiet Ezzit", "Toutes les sorties"]);
});

test("zone alternative fallback: when Gremda has 0 spots, provides Sfax alternatives with explanation", async () => {
  // Mock repository with only Centre-ville spots, Gremda is empty
  const mockActivities = [
    {
      _id: "sfax-1",
      name: "Café Bab Diwan",
      city: "Sfax",
      address: "Bab Bhar, Sfax",
      category: "food",
      price: 6,
      rating: 4.8,
    },
    {
      _id: "sfax-2",
      name: "Restaurant Le Pirate",
      city: "Sfax",
      address: "Route Sidi Mansour Km 4, Sfax",
      category: "food",
      price: 45,
      rating: 4.9,
    },
  ];

  const repository = {
    find: async (query, limit) => {
      // Si la requête contient une clause de quartier (Gremda), simuler 0 résultat
      const hasNeighborhood = query.$and?.some((clause) =>
        clause.$or?.some((sub) => sub.address && sub.address.test && sub.address.test("Gremda"))
      );
      if (hasNeighborhood) {
        return [];
      }
      // Dès que le quartier est relâché (repli sur Sfax), renvoyer les activités de Sfax
      return mockActivities.slice(0, limit);
    },
    findById: async (id) => mockActivities.find((a) => a._id === id) || null,
  };

  const gateway = createChatMainGateway({
    repository,
    stateStore: createInMemoryStateStore(),
  });

  const reply = await gateway.handleTurn({
    sessionId: "test-gremda-fallback",
    text: "gremda",
    userContext: { hasGps: false, userCity: "Sfax" },
  });

  assert.equal(reply.sender, "bot");
  assert.ok(reply.text.includes("Gremda"));
  assert.ok(reply.text.includes("Sfax"));
  assert.ok(reply.metadata?.cards?.length > 0);
  assert.equal(reply.metadata.isZoneAlternative, true);
  // Suggestion chips should propose alternative zones
  assert.deepEqual(reply.suggestions, ["Centre-ville", "Chihia", "Sakiet Ezzit", "Toutes les sorties"]);
});
