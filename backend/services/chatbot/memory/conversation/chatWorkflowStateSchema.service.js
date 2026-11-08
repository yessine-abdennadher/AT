import { TURN_STATUSES } from "../../understanding/semantic/contracts/turnUnderstanding.contract.js";

export const STATUS_TRANSITIONS = Object.freeze({
  IDLE: ["COLLECTING_CRITERIA", "RECOMMENDING", "INSPECTING_ITEM", "PLANNING_OUTING", "PARTNER_ASSIST"],
  COLLECTING_CRITERIA: ["RECOMMENDING", "PLANNING_OUTING", "IDLE"],
  RECOMMENDING: ["REFINING", "INSPECTING_ITEM", "PLANNING_OUTING", "COLLECTING_CRITERIA", "IDLE"],
  REFINING: ["RECOMMENDING", "INSPECTING_ITEM", "IDLE"],
  INSPECTING_ITEM: ["INSPECTING_ITEM", "REFINING", "RECOMMENDING", "IDLE"],
  PLANNING_OUTING: ["RECOMMENDING", "INSPECTING_ITEM", "IDLE"],
  PARTNER_ASSIST: ["PARTNER_ASSIST", "IDLE"],
});

export const emptyConstraints = () => ({
  city: null,
  neighborhood: null,
  neighborhoods: [],
  category: null,
  categories: [],
  budgetLevel: null,
  situation: null,
  group: null,
  mood: null,
  amenities: [],
  vibes: [],
  urgency: null,
  excluded: { amenities: [], categories: [] },
});

export function createInitialState() {
  return {
    version: 3,
    status: "IDLE",
    preferredLanguage: null,
    activeConstraints: emptyConstraints(),
    history: [],
    lastResultIds: [],
    shownActivityIds: [],
    focusedActivityId: null,
    pendingQuestion: null,
    plan: null,
    responseUsage: { counts: {}, recentVariantIds: [] },
  };
}

export function normalizeState(raw) {
  const base = createInitialState();
  if (!raw || typeof raw !== "object") return base;
  return {
    ...base,
    ...raw,
    status: TURN_STATUSES.includes(raw.status) ? raw.status : "IDLE",
    preferredLanguage: typeof raw.preferredLanguage === "string" ? raw.preferredLanguage : null,
    activeConstraints: { ...base.activeConstraints, ...(raw.activeConstraints || {}), excluded: { ...base.activeConstraints.excluded, ...(raw.activeConstraints?.excluded || {}) } },
    responseUsage: { ...base.responseUsage, ...(raw.responseUsage || {}) },
  };
}

export function transitionStatus(state, next) {
  const allowed = STATUS_TRANSITIONS[state.status] || [];
  const status = next === state.status || allowed.includes(next) ? next : state.status;
  return { ...state, status };
}

