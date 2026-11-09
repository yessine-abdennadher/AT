import { SEMANTIC_THRESHOLDS } from "../semantic/config/semanticThresholds.config.js";
import { createTurnUnderstanding } from "./contracts/turnUnderstanding.contract.js";
import { segmentClauses, hasSequentialConnector } from "../semantic/chatClauseSegmenter.service.js";
import { resolveLanguage } from "./policies/languageContinuity.policy.js";
import { resolvePendingQuestion } from "./policies/pendingQuestionResolution.policy.js";

const PARTNER_INTENTS = new Set(["PARTNER_MANAGE_ACTIVITY", "PARTNER_HOURS_HELP", "PARTNER_PROMOTION_HELP"]);

function mergeConstraints(primary = {}, secondary = {}) {
  const city = primary.city || secondary.city || null;
  const categories = primary.categories?.length ? primary.categories : (secondary.categories || []);
  const amenities = [...new Set([...(primary.amenities || []), ...(secondary.amenities || [])])];
  const excludedAmenities = [...new Set([...(primary.excluded?.amenities || []), ...(secondary.excluded?.amenities || [])])];
  const excludedCategories = [...new Set([...(primary.excluded?.categories || []), ...(secondary.excluded?.categories || [])])];
  return {
    city,
    cities: city ? [city] : [],
    neighborhood: primary.neighborhood || secondary.neighborhood || null,
    neighborhoods: primary.neighborhoods?.length ? primary.neighborhoods : (secondary.neighborhoods || []),
    category: categories[0] || null,
    categories,
    budgetLevel: primary.budgetLevel || secondary.budgetLevel || null,
    situation: primary.situation || secondary.situation || null,
    group: primary.group || secondary.group || null,
    mood: primary.mood || secondary.mood || null,
    amenities,
    excluded: {
      amenities: excludedAmenities,
      categories: excludedCategories,
    },
  };
}

/**
 * Fusionne les contraintes issues des règles déclaratives fastPath (Schema 1.0.0)
 * dans celles de la classification. La classification reste prioritaire en cas de conflit.
 */
function mergeRuleConstraints(base = {}, ruleConstraints = null) {
  if (!ruleConstraints) return base;
  const merged = { ...base };

  if (ruleConstraints.category && !merged.category) {
    merged.category = ruleConstraints.category;
    merged.categories = [ruleConstraints.category];
  }
  if (ruleConstraints.group && !merged.group) merged.group = ruleConstraints.group;
  if (ruleConstraints.budgetLevel && !merged.budgetLevel) merged.budgetLevel = ruleConstraints.budgetLevel;
  if (ruleConstraints.situation && !merged.situation) merged.situation = ruleConstraints.situation;
  if (ruleConstraints.amenities?.length) {
    merged.amenities = [...new Set([...(merged.amenities || []), ...ruleConstraints.amenities])];
  }
  if (Number.isFinite(ruleConstraints.maxBudget)) merged.maxBudget = ruleConstraints.maxBudget;
  if (ruleConstraints.nearMe) merged.nearMe = true;

  return merged;
}

/**
 * Arbitre final :
 * 1. FastPath (0 ms)
 * 2. Classification déterministe & contraintes
 * 3. Recherche Sémantique MiniLM (Haute confiance >= MEDIUM_CONFIDENCE)
 * 4. Classifieur d'intention LLM (Gemini 2.5 Flash / Groq — uniquement pour comprendre l'intent, jamais pour rédiger la réponse)
 * 5. Fallback MiniLM seuil bas ou mémoire
 */
export function arbitrateUnderstanding({ normalized, fastPath, classification, semantic, llmClassification = null, memory = {} }) {
  const segments = segmentClauses(normalized.normalizedText);

  const resolvedLanguage = resolveLanguage({ fastPath, normalized, memory });

  const base = {
    language: resolvedLanguage,
    dialogueAct: classification.dialogueAct,
    constraints: mergeRuleConstraints(classification.constraints, fastPath?.ruleConstraints),
    vibes: classification.vibes,
    urgency: classification.urgency,
    segments,
    normalizedText: normalized.normalizedText,
    ruleMetadata: fastPath?.ruleMetadata || null,
  };

  if (fastPath?.matched) {
    return createTurnUnderstanding({ ...base, intent: fastPath.intent, confidence: fastPath.confidence, source: "fastPath" });
  }

  if (classification.dialogueAct === "RESET") {
    return createTurnUnderstanding({ ...base, intent: "RESET_SEARCH", confidence: 0.95, source: "classification" });
  }

  const explicitPlanRequest =
    /\b(?:propose[- ]moi un programme|organise[- ]moi une petite sortie|plan a full saturday)\b/i.test(normalized.normalizedText) ||
    normalized.normalizedText.includes("برنامج من الصباح") ||
    normalized.normalizedText.includes("برنامج من صباح");

  const multiCategory =
    !classification.constraints.hasContradiction &&
    (explicitPlanRequest ||
      (classification.constraints.categories.length >= 2 && hasSequentialConnector(normalized.normalizedText)));
  if (multiCategory) {
    return createTurnUnderstanding({ ...base, intent: "PLAN_MULTI_STEP_OUTING", confidence: 0.9, source: "classification" });
  }

  if (classification.detailIntent) {
    return createTurnUnderstanding({ ...base, intent: classification.detailIntent, confidence: 0.88, source: "classification" });
  }

  // Résolution ciblée si le bot avait posé une question de clarification (pendingQuestion)
  const pendingResolution = resolvePendingQuestion({ memory, classification, normalized });
  if (pendingResolution) {
    return createTurnUnderstanding({ ...base, ...pendingResolution });
  }

  const ruleSuggestsDiscovery = fastPath?.ruleMatched && fastPath.ruleIntent === "DISCOVER_ACTIVITIES";
  if (
    classification.hasConstraints ||
    classification.dialogueAct === "SEARCH_REQUEST" ||
    classification.dialogueAct === "REFINEMENT" ||
    ruleSuggestsDiscovery
  ) {
    const refining = classification.dialogueAct === "REFINEMENT";
    return createTurnUnderstanding({ ...base, intent: refining ? "REFINE_CRITERIA" : "DISCOVER_ACTIVITIES", confidence: 0.85, source: "classification" });
  }

  if (semantic?.intent && semantic.confidence >= SEMANTIC_THRESHOLDS.MEDIUM_CONFIDENCE) {
    return createTurnUnderstanding({ ...base, intent: semantic.intent, confidence: semantic.confidence, source: "semantic_minilm" });
  }

  if (llmClassification?.intent && llmClassification.intent !== "UNKNOWN") {
    const mergedConstraints = mergeConstraints(classification.constraints, llmClassification.constraints);
    return createTurnUnderstanding({
      ...base,
      constraints: mergedConstraints,
      intent: llmClassification.intent,
      confidence: llmClassification.confidence,
      source: "llm_intent_classifier",
    });
  }

  if (semantic?.intent && semantic.confidence >= SEMANTIC_THRESHOLDS.FALLBACK_THRESHOLD) {
    return createTurnUnderstanding({ ...base, intent: semantic.intent, confidence: semantic.confidence, source: "semantic_minilm" });
  }

  if (classification.dialogueAct === "AFFIRMATION" && memory.pendingQuestion) {
    return createTurnUnderstanding({ ...base, intent: "CONFIRM_PENDING", confidence: 0.7, source: "memory" });
  }

  return createTurnUnderstanding({ ...base, intent: "UNKNOWN", confidence: 0.1, source: "none" });
}

export { PARTNER_INTENTS };
