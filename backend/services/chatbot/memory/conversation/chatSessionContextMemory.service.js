import { deepMergeConstraints } from "../persistence/chatSessionStatePersistence.service.js";
import { emptyConstraints } from "./chatWorkflowStateSchema.service.js";

export function mergeTurnConstraints(state, understanding) {
  const incoming = { ...understanding.constraints, vibes: understanding.vibes, urgency: understanding.urgency };
  return { ...state, activeConstraints: deepMergeConstraints(state.activeConstraints, incoming) };
}

export function resetSearchContext(state) {
  return { ...state, status: "IDLE", activeConstraints: emptyConstraints(), lastResultIds: [], shownActivityIds: [], focusedActivityId: null, pendingQuestion: null, plan: null };
}

export function focusActivity(state, activityId) {
  return { ...state, focusedActivityId: activityId };
}

