import { SEMANTIC_THRESHOLDS } from "./config/semanticThresholds.config.js";
import { createTurnUnderstanding } from "./contracts/turnUnderstanding.contract.js";
import { segmentClauses } from "./chatClauseSegmenter.service.js";

const PARTNER_INTENTS = new Set(["PARTNER_MANAGE_ACTIVITY", "PARTNER_HOURS_HELP", "PARTNER_PROMOTION_HELP"]);

function mergeConstraints(primary = {}, secondary = {}) {
  const city = primary.city || secondary.city || null;
  const categories = primary.categories?.length ? primary.categories : (secondary.categories || []);
  const amenities = [...new Set([...(primary.amenities || []), ...(secondary.amenities || [])])];
  return {
    city,
    cities: city ? [city] : [],
    category: categories[0] || null,
    categories,
    budgetLevel: primary.budgetLevel || secondary.budgetLevel || null,
    amenities,
    excluded: primary.excluded || { amenities: [], categories: [] },
  };
}

const EXPLICIT_FRENCH_REGEX = /\b(je|nous|vous|pour|dans|avec|une|des|les|est-ce|bonjour|bonsoir|merci beaucoup|salut|svp)\b/i;

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

  let resolvedLanguage = fastPath?.matched && fastPath.lang
    ? fastPath.lang
    : normalized.detectedLanguage;

  // Si l'utilisateur parlait déjà en derja/arabe et envoie un mot court (ex. "horaires", "menu", "oui"),
  // on conserve sa langue de conversation pour répondre dans la même langue.
  if (resolvedLanguage === "fr" && memory.preferredLanguage && memory.preferredLanguage !== "fr") {
    if (!EXPLICIT_FRENCH_REGEX.test(normalized.originalText || "")) {
      resolvedLanguage = memory.preferredLanguage;
    }
  }

  const base = {
    language: resolvedLanguage,
    dialogueAct: classification.dialogueAct,
    constraints: classification.constraints,
    vibes: classification.vibes,
    urgency: classification.urgency,
    segments,
    normalizedText: normalized.normalizedText,
  };

  if (fastPath?.matched) {
    return createTurnUnderstanding({ ...base, intent: fastPath.intent, confidence: fastPath.confidence, source: "fastPath" });
  }

  if (classification.dialogueAct === "RESET") {
    return createTurnUnderstanding({ ...base, intent: "RESET_SEARCH", confidence: 0.95, source: "classification" });
  }

  const multiCategory = classification.constraints.categories.length >= 2 && segments.length >= 2;
  if (multiCategory) {
    return createTurnUnderstanding({ ...base, intent: "PLAN_MULTI_STEP_OUTING", confidence: 0.9, source: "classification" });
  }

  if (classification.detailIntent) {
    return createTurnUnderstanding({ ...base, intent: classification.detailIntent, confidence: 0.88, source: "classification" });
  }

  if (classification.hasConstraints) {
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
