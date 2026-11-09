/**
 * Politique de résolution prioritaire d'une question de clarification (pendingQuestion).
 * Si le bot attendait une ville / catégorie / budget et que l'utilisateur y répond,
 * on renvoie un patch d'arbitrage `REFINE_CRITERIA` ; sinon `null`.
 */
export function resolvePendingQuestion({ memory = {}, classification, normalized }) {
  if (!memory.pendingQuestion) return null;

  const field = memory.pendingQuestion.field;
  const base = { intent: "REFINE_CRITERIA", confidence: 0.92, source: "pending_question_resolved" };

  if (field === "city" && (classification.constraints.city || normalized.detectedCities?.length)) {
    const city = classification.constraints.city || normalized.detectedCities[0];
    return { ...base, constraints: { ...classification.constraints, city, cities: [city] } };
  }
  if (field === "category" && classification.constraints.category) return base;
  if (field === "budgetLevel" && classification.constraints.budgetLevel) return base;

  return null;
}

