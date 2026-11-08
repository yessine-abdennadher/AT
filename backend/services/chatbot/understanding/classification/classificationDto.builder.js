/**
 * Constructeur de DTO standardisé pour la classification des intentions et critères de sortie Tfarhida.
 */

export function buildClassificationDto({
  intent = "UNKNOWN",
  confidence = 0,
  dialogueAct = "OTHER",
  constraints = {},
  vibes = [],
  urgency = null,
  secondaryIntents = [],
  source = "classification",
} = {}) {
  const categories = constraints.categories || (constraints.category ? [constraints.category] : []);
  const isMultiStepOuting = categories.length >= 2;

  return Object.freeze({
    intent,
    primaryIntent: intent,
    secondaryIntents: Array.isArray(secondaryIntents) ? secondaryIntents : [],
    confidence: Number.isFinite(confidence) ? Number(confidence.toFixed(3)) : 0,
    dialogueAct,
    source,
    isMultiStepOuting,
    slots: {
      city: constraints.city || null,
      cities: constraints.cities || (constraints.city ? [constraints.city] : []),
      category: categories[0] || null,
      categories,
      budgetLevel: constraints.budgetLevel || null,
      situation: constraints.situation || null,
      group: constraints.group || null,
      mood: constraints.mood || null,
      amenities: constraints.amenities || [],
      urgency: urgency || null,
      vibes: vibes || [],
    },
    excluded: {
      categories: constraints.excluded?.categories || [],
      amenities: constraints.excluded?.amenities || [],
    },
  });
}

