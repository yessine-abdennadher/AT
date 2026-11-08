/**
 * Service de topologie et graphe orienté acyclique (DAG) pour les sorties Tfarhida.
 * Gère les dépendances séquentielles (ex: Café -> Restaurant -> Plage/Loisir)
 * et valide l'absence de cycles.
 */

export function buildOutingPlanGraph(categories = []) {
  const unique = [...new Set(categories)];
  return unique.map((category, index) => ({
    id: `step_${index + 1}`,
    category,
    dependencies: index === 0 ? [] : [`step_${index}`],
    activityId: null,
    activity: null,
    status: index === 0 ? "active" : "pending",
  }));
}

/**
 * Valide qu'un plan de sortie constitue un graphe orienté acyclique (DAG) valide.
 */
export function validateOutingPlanGraph(plan) {
  const steps = Array.isArray(plan?.steps) ? plan.steps : [];
  const ids = steps.map((s) => s?.id);
  if (!steps.length || ids.some((id) => typeof id !== "string" || !id) || new Set(ids).size !== ids.length) {
    return { valid: false, reason: "invalid_step_ids" };
  }

  const known = new Set(ids);
  if (steps.some((s) => !Array.isArray(s.dependencies) || s.dependencies.some((d) => !known.has(d) || d === s.id))) {
    return { valid: false, reason: "unknown_dependency" };
  }

  const visiting = new Set();
  const visited = new Set();
  const byId = new Map(steps.map((s) => [s.id, s]));

  const hasCycle = (id) => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    for (const dep of byId.get(id).dependencies || []) {
      if (hasCycle(dep)) return true;
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  };

  for (const id of ids) {
    if (hasCycle(id)) {
      return { valid: false, reason: "cycle_detected" };
    }
  }

  return { valid: true, reason: null };
}

export function hasCycle(steps = []) {
  return !validateOutingPlanGraph({ steps }).valid;
}
