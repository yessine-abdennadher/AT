export const TURN_STATUSES = Object.freeze(["IDLE", "COLLECTING_CRITERIA", "RECOMMENDING", "REFINING", "INSPECTING_ITEM", "PLANNING_OUTING", "PARTNER_ASSIST"]);

/**
 * Contrat canonique `turnUnderstanding` produit par l'arbitre.
 */
export function createTurnUnderstanding(partial = {}) {
  return Object.freeze({
    intent: partial.intent || "UNKNOWN",
    confidence: Number.isFinite(partial.confidence) ? partial.confidence : 0,
    source: partial.source || "none",
    language: partial.language || "fr",
    dialogueAct: partial.dialogueAct || "OTHER",
    constraints: partial.constraints || { city: null, cities: [], category: null, categories: [], budgetLevel: null, amenities: [], excluded: { amenities: [], categories: [] } },
    vibes: partial.vibes || [],
    urgency: partial.urgency || null,
    segments: partial.segments || [],
    normalizedText: partial.normalizedText || "",
  });
}

export function isValidTurnUnderstanding(value) {
  return Boolean(value) && typeof value.intent === "string" && typeof value.confidence === "number" && typeof value.constraints === "object";
}

