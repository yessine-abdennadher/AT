/**
 * chatOutingPlanMemory.service.js
 *
 * Gestionnaire pur de mémoire pour les programmes de sortie multi-étapes.
 * Intègre la pile d'interruption (interruptStack) pour mettre en pause une sortie
 * lorsqu'une question incidente est posée, sans écraser ni détruire le programme.
 * 100% JS fonctionnel, zéro dépendance externe.
 */

export function isOutingPlanActive(plan) {
  return Boolean(
    plan &&
    typeof plan === "object" &&
    Array.isArray(plan.steps) &&
    plan.steps.length > 0 &&
    !["completed", "cancelled"].includes(plan.status)
  );
}

export function savePlan(state, steps) {
  const sanitizedSteps = (steps || []).map(({ activity, ...rest }) => ({
    ...rest,
    activityName: activity?.name || null,
    activityCity: activity?.city || null,
  }));

  return {
    ...state,
    plan: {
      steps: sanitizedSteps,
      status: "in_progress",
      interruptStack: [],
      updatedAt: new Date().toISOString(),
    },
  };
}

export function pauseOutingPlan(state, { reason = "incidental_question" } = {}) {
  const plan = state?.plan;
  if (!isOutingPlanActive(plan)) return state;

  const now = new Date().toISOString();
  const stack = Array.isArray(plan.interruptStack) ? [...plan.interruptStack] : [];
  stack.push({
    reason,
    pausedAt: now,
    previousStatus: plan.status,
  });

  return {
    ...state,
    plan: {
      ...plan,
      status: "paused",
      interruptStack: stack,
      updatedAt: now,
    },
  };
}

export function resumeOutingPlan(state) {
  const plan = state?.plan;
  if (!plan || plan.status !== "paused") return state;

  const stack = Array.isArray(plan.interruptStack) ? [...plan.interruptStack] : [];
  const lastInterruption = stack.pop();

  return {
    ...state,
    plan: {
      ...plan,
      status: lastInterruption?.previousStatus || "in_progress",
      interruptStack: stack,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function cancelOutingPlan(state) {
  const plan = state?.plan;
  if (!plan) return state;

  return {
    ...state,
    plan: {
      ...plan,
      status: "cancelled",
      updatedAt: new Date().toISOString(),
    },
  };
}

export function clearPlan(state) {
  return { ...state, plan: null };
}
