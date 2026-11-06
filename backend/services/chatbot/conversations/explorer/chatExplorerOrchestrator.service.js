import { findWithRelaxation } from "../../capabilities/recommendations/fallbackRelaxation.service.js";
import { buildOutingPlanGraph } from "../../capabilities/actionPlanning/chatOutingPlanGraph.service.js";
import { executeOutingPlan } from "../../capabilities/actionPlanning/chatOutingPlanExecutor.service.js";
import { savePlan } from "../../capabilities/actionPlanning/chatOutingPlanMemory.service.js";
import { extractActivityFacts } from "../../capabilities/establishmentInfo/activityDetailResponder.service.js";
import { focusActivity, mergeTurnConstraints, resetSearchContext } from "../../memory/conversation/chatSessionContextMemory.service.js";
import { transitionStatus } from "../../memory/conversation/chatWorkflowStateSchema.service.js";
import { rememberShownActivities } from "../../memory/recommendations/chatShownActivitiesMemory.service.js";
import { composeResponse } from "../../responses/composition/responseComposer.service.js";
import { stripDiacritics } from "../../shared/textUtils.js";
import { STATIC_INTENT_KEYS, routeExplorerIntent } from "./chatExplorerIntentRouter.service.js";

const idOf = (a) => String(a._id ?? a.id);
const RELAX_LABELS = { amenities: "équipements", city: "ville" };

async function handleStatic({ understanding, state, ctx }) {
  const nextState = understanding.intent === "RESET_SEARCH" ? resetSearchContext(state) : state;
  const intentKey = STATIC_INTENT_KEYS[understanding.intent] || "UNKNOWN";
  const composed = composeResponse({ intentKey, lang: understanding.language, status: nextState.status, recentVariantIds: state.responseUsage.recentVariantIds, ...ctx.compose });
  return { composed, state: nextState, grounding: [] };
}

async function handleDiscover({ understanding, state, ctx }) {
  let next = mergeTurnConstraints(state, understanding);
  const c = next.activeConstraints;
  const lang = understanding.language;
  const recent = state.responseUsage.recentVariantIds;

  if (!c.city && !c.categories.length) {
    next = transitionStatus(next, "COLLECTING_CRITERIA");
    return { composed: composeResponse({ intentKey: "ASK_MORE_CRITERIA", lang, status: next.status, recentVariantIds: recent, ...ctx.compose }), state: next, grounding: [] };
  }

  const excludeIds = understanding.intent === "CONFIRM_PENDING" ? next.shownActivityIds : [];
  const { activities, relaxed } = await findWithRelaxation({ repository: ctx.repository, constraints: c, excludeIds });

  if (!activities.length) {
    next = transitionStatus(next, "COLLECTING_CRITERIA");
    return { composed: composeResponse({ intentKey: "DISCOVER_EMPTY", lang, status: next.status, recentVariantIds: recent, ...ctx.compose }), state: next, grounding: [] };
  }

  next = rememberShownActivities(next, activities.map(idOf));
  next = { ...next, lastResults: activities.map((a) => ({ id: idOf(a), name: a.name })), focusedActivityId: idOf(activities[0]) };
  next = transitionStatus(next, understanding.intent === "REFINE_CRITERIA" ? "REFINING" : "RECOMMENDING");
  if (next.status === "REFINING") next = transitionStatus(next, "RECOMMENDING");

  const relaxedText = relaxed.map((r) => RELAX_LABELS[r] || r).join(", ");
  const intentKey = relaxed.length ? "DISCOVER_RELAXED" : "DISCOVER_SUCCESS";
  const composed = composeResponse({ intentKey, lang, vars: { count: activities.length, relaxed: relaxedText, city: c.city, category: c.category }, activities, status: next.status, recentVariantIds: recent, ...ctx.compose });
  return { composed, state: next, grounding: activities };
}

function pickTargetId(state, text) {
  const normalized = stripDiacritics(text);
  const byName = (state.lastResults || []).find((r) => normalized.includes(stripDiacritics(r.name || "§")));
  return byName?.id || state.focusedActivityId || state.lastResults?.[0]?.id || null;
}

async function handleDetail({ understanding, state, ctx }) {
  const lang = understanding.language;
  const recent = state.responseUsage.recentVariantIds;
  const targetId = pickTargetId(state, understanding.normalizedText);
  const activity = targetId ? await ctx.repository.findById(targetId) : null;

  if (!activity) {
    return { composed: composeResponse({ intentKey: "NO_FOCUS", lang, status: state.status, recentVariantIds: recent, ...ctx.compose }), state, grounding: [] };
  }

  let next = transitionStatus(focusActivity(state, targetId), "INSPECTING_ITEM");
  const { available, values } = extractActivityFacts(understanding.intent, activity);
  let intentKey = "DETAIL_UNAVAILABLE";
  const vars = { name: activity.name };

  if (available) {
    switch (understanding.intent) {
      case "ASK_OPENING_HOURS":
        intentKey = "DETAIL_HOURS";
        vars.hours = [values.openingTime && values.closingTime ? `${values.openingTime} - ${values.closingTime}` : null, values.openDays?.join?.(", ")].filter(Boolean).join(" · ") || null;
        break;
      case "ASK_MENU_OR_PRICE":
        if (values.menuUrl || values.menuImageUrl) { intentKey = "DETAIL_MENU"; vars.link = values.menuUrl || values.menuImageUrl; }
        else { intentKey = "DETAIL_PRICE"; vars.price = values.price; }
        break;
      case "ASK_LOCATION_OR_MAPS":
        intentKey = "DETAIL_LOCATION";
        vars.address = [values.address || values.locationName, values.city, values.mapsUrl].filter(Boolean).join(" · ");
        break;
      case "ASK_CONTACT_OR_SOCIAL":
        intentKey = "DETAIL_CONTACT";
        vars.contact = [values.phone && `Tél ${values.phone}`, values.whatsapp && `WhatsApp +${values.whatsapp}`, values.instagram && `Instagram @${String(values.instagram).replace(/^@/, "")}`].filter(Boolean).join(" · ");
        break;
      default:
    }
    if (intentKey !== "DETAIL_UNAVAILABLE" && !Object.values(vars).every(Boolean)) intentKey = "DETAIL_UNAVAILABLE";
  }
  return { composed: composeResponse({ intentKey, lang, vars, status: next.status, recentVariantIds: recent, ...ctx.compose }), state: next, grounding: [activity] };
}

async function handlePlan({ understanding, state, ctx }) {
  const lang = understanding.language;
  const recent = state.responseUsage.recentVariantIds;
  let next = mergeTurnConstraints(state, understanding);
  const constraints = next.activeConstraints;
  const steps = buildOutingPlanGraph(understanding.constraints.categories);

  if (!constraints.city) {
    next = transitionStatus(next, "COLLECTING_CRITERIA");
    return { composed: composeResponse({ intentKey: "ASK_MORE_CRITERIA", lang, status: next.status, recentVariantIds: recent, ...ctx.compose }), state: next, grounding: [] };
  }

  const executed = await executeOutingPlan({ repository: ctx.repository, steps, constraints, excludeIds: next.shownActivityIds });
  const found = executed.filter((s) => s.activity);
  next = savePlan(next, executed);
  next = rememberShownActivities(next, found.map((s) => s.activityId));
  next = { ...next, lastResults: found.map((s) => ({ id: s.activityId, name: s.activity.name })), focusedActivityId: found[0]?.activityId || null };
  next = transitionStatus(next, "PLANNING_OUTING");

  const intentKey = !found.length ? "DISCOVER_EMPTY" : found.length < executed.length ? "PLAN_PARTIAL" : "PLAN_SUCCESS";
  const composed = composeResponse({ intentKey, lang, vars: { count: found.length }, planSteps: found.length ? executed : null, status: next.status, recentVariantIds: recent, ...ctx.compose });
  return { composed, state: next, grounding: found.map((s) => s.activity) };
}

const HANDLERS = { static: handleStatic, discover: handleDiscover, detail: handleDetail, plan: handlePlan };

/**
 * Orchestrateur du parcours utilisateur simple (explorateur).
 */
export async function runExplorerTurn({ understanding, state, repository, compose = {} }) {
  const handler = HANDLERS[routeExplorerIntent(understanding.intent)];
  return handler({ understanding, state, ctx: { repository, compose } });
}

