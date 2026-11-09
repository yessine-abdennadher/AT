/**
 * Configuration du classifieur d'intention LLM (Étape 4 — dernier recours).
 * Le LLM ne rédige jamais la réponse : il renvoie uniquement { intent, city, category, budgetLevel, amenities }.
 */
export const LLM_CLASSIFIER_CONFIG = Object.freeze({
  DEFAULT_TIMEOUT_MS: 2500,
  DEFAULT_CONFIDENCE: 0.84,
  UNKNOWN_CONFIDENCE: 0.2,
  DEFAULT_GEMINI_MODEL: "gemini-2.5-flash",
  DEFAULT_GROQ_MODEL: "llama-3.3-70b-versatile",
  MAX_INPUT_CHARS: 300,
  VALID_AMENITIES: Object.freeze(["wifi", "climatisation", "terrasse", "power_backup", "vue_mer", "parking"]),
  VALID_BUDGETS: Object.freeze(["low", "high"]),
});

