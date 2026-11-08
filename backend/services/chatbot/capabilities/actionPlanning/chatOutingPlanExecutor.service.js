import { findChatRecommendations } from "../recommendations/chatRecommendationBridge.service.js";

/**
 * Exécute chaque étape dans l'ordre des dépendances en évitant les doublons.
 */
export async function executeOutingPlan({ repository, steps, constraints, excludeIds = [] }) {
  const used = [...excludeIds];
  const executed = [];
  for (const step of steps) {
    const stepConstraints = { ...constraints, category: step.category, categories: [step.category] };
    const { activities, relaxed } = await findChatRecommendations({ repository, constraints: stepConstraints, limit: 1, excludeIds: used });
    const picked = activities[0] || null;
    if (picked) used.push(String(picked._id ?? picked.id));
    executed.push({ ...step, activity: picked, activityId: picked ? String(picked._id ?? picked.id) : null, status: picked ? "done" : "empty", relaxed });
  }
  return executed;
}

