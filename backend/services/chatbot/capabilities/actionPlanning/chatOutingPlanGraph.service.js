/**
 * Graphe de plan : "un cafe puis un restaurant" => step_1 -> step_2.
 */
export function buildOutingPlanGraph(categories = []) {
  const unique = [...new Set(categories)];
  return unique.map((category, index) => ({
    id: `step_${index + 1}`,
    category,
    dependsOn: index === 0 ? [] : [`step_${index}`],
    activityId: null,
    status: "pending",
  }));
}

export function hasCycle(steps) {
  const ids = new Set(steps.map((s) => s.id));
  return steps.some((s) => s.dependsOn.some((d) => !ids.has(d) || d === s.id));
}

