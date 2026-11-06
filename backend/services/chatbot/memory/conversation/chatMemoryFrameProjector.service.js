/**
 * Projection compacte de l'état pour la couche de compréhension/orchestration.
 */
export function projectMemoryFrame(state) {
  return Object.freeze({
    status: state.status,
    preferredLanguage: state.preferredLanguage || null,
    activeConstraints: state.activeConstraints,
    focusedActivityId: state.focusedActivityId,
    lastResultIds: state.lastResultIds,
    shownActivityIds: state.shownActivityIds,
    pendingQuestion: state.pendingQuestion,
    hasPlan: Boolean(state.plan),
    turnCount: state.history?.length || 0,
  });
}

