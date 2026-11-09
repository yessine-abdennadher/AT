import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { segmentClauses, hasSequentialConnector } from "../services/chatbot/understanding/semantic/chatClauseSegmenter.service.js";
import { matchSemanticIntent } from "../services/chatbot/understanding/semantic/chatSemanticIntentMatcher.service.js";
import { arbitrateUnderstanding } from "../services/chatbot/understanding/arbiter/chatUnderstandingArbiter.service.js";
import { normalizeChatText } from "../services/chatbot/understanding/normalization/chatTextNormalizer.service.js";
import { classifyTurn } from "../services/chatbot/understanding/classification/chatClassification.facade.js";
import { extractOutingConstraints } from "../services/chatbot/understanding/constraints/chatOutingConstraints.service.js";

describe("Semantic Understanding - Complex Cases", () => {
  describe("1. Segmentation séquentielle & Connecteurs multi-langues", () => {
    it("découpe correctement les conjonctions en Derja Tunisienne (w mba3ed, men ba3d, etc.)", () => {
      const text1 = "nheb 9ahwa behia fi chihia w mba3ed resto r5is";
      const segs1 = segmentClauses(text1);
      assert.equal(segs1.length, 2, `Devrait produire 2 segments, obtenu: ${JSON.stringify(segs1)}`);
      assert.ok(hasSequentialConnector(text1), "Devrait détecter le connecteur séquentiel 'w mba3ed'");

      const text2 = "ftour sbe7 men ba3d cinema";
      const segs2 = segmentClauses(text2);
      assert.equal(segs2.length, 2);
      assert.ok(hasSequentialConnector(text2));
    });

    it("découpe correctement les conjonctions en Arabe (ومن بعد, ثم)", () => {
      const text1 = "قهوة في الشيحية ومن بعد عشاء في قرمدة";
      const segs1 = segmentClauses(text1);
      assert.equal(segs1.length, 2);
      assert.ok(hasSequentialConnector(text1));

      const text2 = "فطور صباح ثم سينما";
      const segs2 = segmentClauses(text2);
      assert.equal(segs2.length, 2);
      assert.ok(hasSequentialConnector(text2));
    });

    it("découpe correctement les conjonctions en Français et Anglais (puis, ensuite, and then)", () => {
      const textFr = "un bon cafe a chihia puis un restaurant gastronomique";
      const segsFr = segmentClauses(textFr);
      assert.equal(segsFr.length, 2);
      assert.ok(hasSequentialConnector(textFr));

      const textEn = "a coffee in the morning and then a movie at night";
      const segsEn = segmentClauses(textEn);
      assert.equal(segsEn.length, 2);
      assert.ok(hasSequentialConnector(textEn));
    });
  });

  describe("2. Détection des sorties multi-étapes (PLAN_MULTI_STEP_OUTING)", () => {
    it("arbitre 'nheb 9ahwa fi chihia w mba3ed resto r5is' en PLAN_MULTI_STEP_OUTING", () => {
      const rawText = "nheb 9ahwa fi chihia w mba3ed resto r5is";
      const normalized = normalizeChatText(rawText);
      const classification = classifyTurn({ normalized, memory: {} });
      const semantic = matchSemanticIntent(normalized.normalizedText);

      const understanding = arbitrateUnderstanding({
        normalized,
        fastPath: { matched: false },
        classification,
        semantic,
        memory: {},
      });

      assert.equal(understanding.intent, "PLAN_MULTI_STEP_OUTING");
      assert.ok(understanding.segments.length >= 2, "Les segments doivent être découpés");
      assert.ok(understanding.constraints.categories.includes("cafe"), "Doit inclure la catégorie cafe");
      assert.ok(understanding.constraints.categories.includes("restaurant"), "Doit inclure la catégorie restaurant");
    });

    it("arbitre 'قهوة في الشيحية ومن بعد عشاء في قرمدة' en PLAN_MULTI_STEP_OUTING", () => {
      const rawText = "قهوة في الشيحية ومن بعد عشاء في قرمدة";
      const normalized = normalizeChatText(rawText);
      const classification = classifyTurn({ normalized, memory: {} });
      const semantic = matchSemanticIntent(normalized.normalizedText);

      const understanding = arbitrateUnderstanding({
        normalized,
        fastPath: { matched: false },
        classification,
        semantic,
        memory: {},
      });

      assert.equal(understanding.intent, "PLAN_MULTI_STEP_OUTING");
      assert.ok(understanding.segments.length >= 2);
    });
  });

  describe("3. Contraintes négatives & Exclusions (sans, blech, men ghir, بدون)", () => {
    it("détecte 'blech chicha' comme exclusion d'équipement en Derja", () => {
      const constraints = extractOutingConstraints({
        normalizedText: "nheb 9ahwa behia ama blech chicha",
      });
      assert.equal(constraints.category, "cafe");
      assert.ok(constraints.excluded.amenities.includes("chicha"), "Chicha doit être dans excluded.amenities");
    });

    it("détecte 'sans fast food' comme exclusion de catégorie en Français", () => {
      const constraints = extractOutingConstraints({
        normalizedText: "je cherche un bon restaurant mais sans fast food",
      });
      assert.equal(constraints.category, "restaurant");
      assert.ok(constraints.excluded.categories.includes("fast_food"), "Fast food doit être dans excluded.categories");
    });

    it("détecte 'بلاش شيشة' et 'بدون تدخين' en Arabe", () => {
      const constraints = extractOutingConstraints({
        normalizedText: "نحب مقهى عائلي بدون تدخين",
      });
      assert.equal(constraints.category, "cafe");
      assert.ok(constraints.excluded.amenities.includes("fumeur"), "Fumeur doit être exclu");
    });
  });

  describe("4. Requête combinée multi-critères (Mood + Catégorie + Budget + Équipements + Quartier)", () => {
    it("extrait simultanément tous les critères d'une requête complexe", () => {
      const rawText = "ouh 9l9t nheb 9ahwa rkhisa fih wifi w terrasse fi gremda";
      const normalized = normalizeChatText(rawText);
      const classification = classifyTurn({ normalized, memory: {} });
      const semantic = matchSemanticIntent(normalized.normalizedText);

      const understanding = arbitrateUnderstanding({
        normalized,
        fastPath: { matched: false },
        classification,
        semantic,
        memory: {},
      });

      assert.equal(understanding.intent, "DISCOVER_ACTIVITIES");
      assert.equal(understanding.constraints.category, "cafe");
      assert.equal(understanding.constraints.budgetLevel, "low");
      assert.ok(understanding.constraints.amenities.includes("wifi"), "Doit inclure wifi");
      assert.ok(understanding.constraints.amenities.includes("terrasse"), "Doit inclure terrasse");
      assert.equal(understanding.constraints.neighborhood, "Gremda");
    });
  });

  describe("5. Recherche sémantique MiniLM sur formulations indirectes / complexes", () => {
    it("reconnaît les formulations indirectes pour chaque intention", () => {
      const cases = [
        { text: "donne moi les tarifs et le menu s il vous plait", expected: "ASK_MENU_OR_PRICE" },
        { text: "envoie moi le plan d acces google maps pour y aller", expected: "ASK_LOCATION_OR_MAPS" },
        { text: "quel est leur numero de telephone ou whatsapp", expected: "ASK_CONTACT_OR_SOCIAL" },
        { text: "a quelle heure ferment ils ce soir", expected: "ASK_OPENING_HOURS" },
        { text: "efface tous les filtres et recommence a zero", expected: "RESET_SEARCH" },
        { text: "organise moi une sortie complete pour ce soir", expected: "PLAN_MULTI_STEP_OUTING" },
        { text: "est ce qu ils ont la climatisation et un parking", expected: "ASK_AMENITIES" },
      ];

      for (const c of cases) {
        const res = matchSemanticIntent(c.text);
        assert.equal(res.intent, c.expected, `Pour '${c.text}', attendu: ${c.expected}, obtenu: ${res.intent} (conf: ${res.confidence})`);
        assert.ok(res.confidence >= 0.35, `La confiance (${res.confidence}) doit être >= 0.35 pour '${c.text}'`);
      }
    });
  });
});
