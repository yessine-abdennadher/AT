import { KNOWN_CATEGORIES } from "../../constraints/chatOutingConstraints.service.js";
import { LLM_CLASSIFIER_CONFIG } from "../config/llmClassifier.config.js";

const VALID_AMENITIES = new Set(LLM_CLASSIFIER_CONFIG.VALID_AMENITIES);
const VALID_BUDGETS = new Set(LLM_CLASSIFIER_CONFIG.VALID_BUDGETS);

/**
 * Validation stricte de la sortie LLM contre le contrat `supportedIntentContract.json`.
 * Toute valeur hors contrat est neutralisée (intent -> UNKNOWN, champs -> null / []).
 */
export function sanitizeClassifiedPayload(raw, allowedIntentsSet) {
  if (!raw || typeof raw !== "object") return null;
  const intent = typeof raw.intent === "string" && allowedIntentsSet.has(raw.intent) ? raw.intent : "UNKNOWN";
  const category = typeof raw.category === "string" && KNOWN_CATEGORIES.includes(raw.category) ? raw.category : null;
  const city = typeof raw.city === "string" && raw.city.trim().length > 1 ? raw.city.trim() : null;
  const budgetLevel = VALID_BUDGETS.has(raw.budgetLevel) ? raw.budgetLevel : null;
  const amenities = Array.isArray(raw.amenities) ? raw.amenities.filter((a) => VALID_AMENITIES.has(a)) : [];

  return {
    intent,
    confidence: intent !== "UNKNOWN" ? LLM_CLASSIFIER_CONFIG.DEFAULT_CONFIDENCE : LLM_CLASSIFIER_CONFIG.UNKNOWN_CONFIDENCE,
    source: "llm_intent_classifier",
    constraints: {
      city,
      cities: city ? [city] : [],
      category,
      categories: category ? [category] : [],
      budgetLevel,
      amenities,
      excluded: { amenities: [], categories: [] },
    },
  };
}

