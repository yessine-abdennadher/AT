import { findChatRecommendations } from "../../capabilities/recommendations/chatRecommendationBridge.service.js";
import { buildOutingPlanGraph } from "../../capabilities/actionPlanning/chatOutingPlanGraph.service.js";
import { executeOutingPlan } from "../../capabilities/actionPlanning/chatOutingPlanExecutor.service.js";
import {
  savePlan,
  pauseOutingPlan,
  resumeOutingPlan,
  cancelOutingPlan,
} from "../../capabilities/actionPlanning/chatOutingPlanMemory.service.js";
import { evaluateOutingPlanEligibility } from "../../capabilities/actionPlanning/chatOutingPlanEligibility.service.js";
import {
  getOutingPlanSuggestions,
  getOutingPlanResumeAck,
} from "../../capabilities/actionPlanning/chatOutingPlanResponse.service.js";
import { extractActivityFacts } from "../../capabilities/establishmentInfo/activityDetailResponder.service.js";
import {
  focusActivity,
  mergeTurnConstraints,
  resetSearchContext,
  setPendingQuestion,
  clearPendingQuestion,
} from "../../memory/conversation/chatSessionContextMemory.service.js";
import { transitionStatus } from "../../memory/conversation/chatWorkflowStateSchema.service.js";
import { rememberShownActivities } from "../../memory/recommendations/chatShownActivitiesMemory.service.js";
import { composeResponse } from "../../responses/composition/responseComposer.service.js";
import { stripDiacritics } from "../../shared/textUtils.js";
import { STATIC_INTENT_KEYS, routeExplorerIntent } from "./chatExplorerIntentRouter.service.js";

const idOf = (a) => String(a._id ?? a.id);
const RELAX_LABELS = { neighborhood: "quartier", amenities: "équipements", city: "ville" };

const ZONE_ALT_MESSAGES = {
  fr: (zone) => `Il n'y a pas encore d'adresse enregistrée directement à ${zone}, mais voici les meilleures sorties juste à côté à Sfax !`,
  derja: (zone) => `Fammech blassa direct fi ${zone} tawa, ama chouf hedhom fi Sfax ba7dhek !`,
  ar: (zone) => `لا توجد أماكن مسجلة في ${zone} حالياً، لكن هذه أفضل الخروجات القريبة في صفاقس !`,
  en: (zone) => `No spots registered in ${zone} yet, but here are the best nearby outings in Sfax!`,
};

async function handleStatic({ understanding, state, ctx }) {
  const nextState = understanding.intent === "RESET_SEARCH" ? resetSearchContext(state) : state;
  const isOtherZone =
    understanding.source === "other_zone_chip" ||
    (understanding.normalizedText &&
      (understanding.normalizedText.includes("zone") ||
        understanding.normalizedText.includes("منطق") ||
        understanding.normalizedText.includes("area")));

  const intentKey = isOtherZone ? "ASK_MORE_CRITERIA" : (STATIC_INTENT_KEYS[understanding.intent] || "UNKNOWN");
  const extraLines = isOtherZone
    ? [
        understanding.language === "ar"
          ? "أي منطقة تحب تكتشفها في صفاقس ؟"
          : understanding.language === "derja"
          ? "Ama zone t7eb tchoufha fi Sfax ?"
          : understanding.language === "en"
          ? "Which area in Sfax would you like to explore?"
          : "Quelle zone souhaitez-vous explorer à Sfax ?",
      ]
    : [];

  const composed = composeResponse({
    intentKey,
    lang: understanding.language,
    status: nextState.status,
    recentVariantIds: state.responseUsage.recentVariantIds,
    hasGps: Boolean(ctx.hasGps),
    extraLines,
    constraints: nextState.activeConstraints,
    ...ctx.compose,
  });

  if (isOtherZone) {
    composed.message.suggestions =
      understanding.language === "ar"
        ? ["قرمدة", "الشيحية", "ساقية الزيت", "وسط المدينة"]
        : understanding.language === "en"
        ? ["Gremda", "Chihia", "Sakiet Ezzit", "Downtown"]
        : ["Gremda", "Chihia", "Sakiet Ezzit", "Centre-ville"];
  }

  return { composed, state: nextState, grounding: [] };
}

async function handleDiscover({ understanding, state, ctx }) {
  let next = mergeTurnConstraints(state, understanding);
  const c = next.activeConstraints;
  const lang = understanding.language;
  const recent = state.responseUsage.recentVariantIds;

  if (!c.city && !c.categories.length && !c.neighborhood) {
    next = transitionStatus(next, "COLLECTING_CRITERIA");
    next = setPendingQuestion(next, { field: "city", text: "Quelle ville cherchez-vous ?" });
    return {
      composed: composeResponse({
        intentKey: "ASK_MORE_CRITERIA",
        lang,
        status: next.status,
        recentVariantIds: recent,
        pendingField: "city",
        hasGps: Boolean(ctx.hasGps),
        constraints: c,
        ...ctx.compose,
      }),
      state: next,
      grounding: [],
    };
  }

  const excludeIds = understanding.intent === "CONFIRM_PENDING" ? next.shownActivityIds : [];
  const { activities, relaxed, isZoneAlternative, requestedZone } = await findChatRecommendations({
    repository: ctx.repository,
    constraints: c,
    excludeIds,
  });

  if (!activities.length) {
    next = transitionStatus(next, "COLLECTING_CRITERIA");
    return {
      composed: composeResponse({
        intentKey: "DISCOVER_EMPTY",
        lang,
        status: next.status,
        recentVariantIds: recent,
        hasGps: Boolean(ctx.hasGps),
        constraints: c,
        ...ctx.compose,
      }),
      state: next,
      grounding: [],
    };
  }

  next = clearPendingQuestion(next);
  next = rememberShownActivities(next, activities.map(idOf));
  next = {
    ...next,
    lastResults: activities.map((a) => ({ id: idOf(a), name: a.name })),
    focusedActivityId: idOf(activities[0]),
  };
  next = transitionStatus(next, understanding.intent === "REFINE_CRITERIA" ? "REFINING" : "RECOMMENDING");
  if (next.status === "REFINING") next = transitionStatus(next, "RECOMMENDING");

  const extraLines = [];
  if (isZoneAlternative && requestedZone) {
    const altFn = ZONE_ALT_MESSAGES[lang] || ZONE_ALT_MESSAGES.fr;
    extraLines.push(altFn(requestedZone));
  }

  function pickContextualIntentKey() {
    if (relaxed.length && !isZoneAlternative) return "DISCOVER_RELAXED";
    if (c.hasPromo && (c.isEvening || c.situation === "night")) return "DISCOVER_EVENING_PROMO";
    if (c.hasPromo) return "DISCOVER_PROMO";
    if (c.isEvening || c.situation === "night") return "DISCOVER_EVENING";
    if (c.mood === "boredom_relief") return "DISCOVER_BOREDOM_RELIEF";
    if (c.group === "couple" || c.category === "couple") return "DISCOVER_COUPLE";
    if (c.group === "friends" || c.category === "friends") return "DISCOVER_FRIENDS";
    if (c.situation === "cold") return "DISCOVER_COLD_WEATHER";
    if (c.budgetLevel === "low" && (c.category === "restaurant" || c.category === "food")) return "DISCOVER_BUDGET_FOOD";
    return "DISCOVER_SUCCESS";
  }

  const relaxedText = relaxed.map((r) => RELAX_LABELS[r] || r).join(", ");
  const intentKey = pickContextualIntentKey();
  const composed = composeResponse({
    intentKey,
    lang,
    vars: { count: activities.length, relaxed: relaxedText, city: c.city, category: c.category },
    activities,
    status: next.status,
    recentVariantIds: recent,
    extraLines,
    hasGps: Boolean(ctx.hasGps),
    isZoneAlternative: Boolean(isZoneAlternative),
    constraints: c,
    ...ctx.compose,
  });
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
    return {
      composed: composeResponse({
        intentKey: "NO_FOCUS",
        lang,
        status: state.status,
        recentVariantIds: recent,
        ...ctx.compose,
      }),
      state,
      grounding: [],
    };
  }

  let next = transitionStatus(focusActivity(state, targetId), "INSPECTING_ITEM");

  // Si un plan de sortie était actif, on le met en pause proprement dans interruptStack
  if (next.plan && next.plan.status === "in_progress") {
    next = pauseOutingPlan(next, { reason: "detail_question_interruption" });
  }

  const { available, values } = extractActivityFacts(understanding.intent, activity);
  let intentKey = "DETAIL_UNAVAILABLE";
  const vars = { name: activity.name };

  if (available) {
    switch (understanding.intent) {
      case "ASK_OPENING_HOURS":
        intentKey = "DETAIL_HOURS";
        vars.hours = [
          values.openingTime && values.closingTime ? `${values.openingTime} - ${values.closingTime}` : null,
          values.openDays?.join?.(", "),
        ].filter(Boolean).join(" · ") || null;
        break;
      case "ASK_MENU_OR_PRICE":
        if (values.menuUrl || values.menuImageUrl) {
          intentKey = "DETAIL_MENU";
          vars.link = values.menuUrl || values.menuImageUrl;
        } else {
          intentKey = "DETAIL_PRICE";
          vars.price = values.price;
        }
        break;
      case "ASK_LOCATION_OR_MAPS":
        intentKey = "DETAIL_LOCATION";
        vars.address = [values.address || values.locationName, values.city, values.mapsUrl].filter(Boolean).join(" · ");
        break;
      case "ASK_CONTACT_OR_SOCIAL":
        intentKey = "DETAIL_CONTACT";
        vars.contact = [
          values.phone && `Tél ${values.phone}`,
          values.whatsapp && `WhatsApp +${values.whatsapp}`,
          values.instagram && `Instagram @${String(values.instagram).replace(/^@/, "")}`,
        ].filter(Boolean).join(" · ");
        break;
      default:
    }
    if (intentKey !== "DETAIL_UNAVAILABLE" && !Object.values(vars).every(Boolean)) intentKey = "DETAIL_UNAVAILABLE";
  }

  const composed = composeResponse({
    intentKey,
    lang,
    vars,
    status: next.status,
    recentVariantIds: recent,
    ...ctx.compose,
  });

  // Si le plan de sortie est en pause, proposer les boutons de reprise du programme
  if (next.plan && next.plan.status === "paused") {
    composed.message.suggestions = getOutingPlanSuggestions({ status: "paused", lang });
  }

  return { composed, state: next, grounding: [activity] };
}

async function handlePlan({ understanding, state, ctx }) {
  const lang = understanding.language;
  const recent = state.responseUsage.recentVariantIds;
  let next = mergeTurnConstraints(state, understanding);
  const constraints = next.activeConstraints;
  const steps = buildOutingPlanGraph(understanding.constraints.categories);

  if (!constraints.city) {
    next = transitionStatus(next, "COLLECTING_CRITERIA");
    return {
      composed: composeResponse({
        intentKey: "ASK_MORE_CRITERIA",
        lang,
        status: next.status,
        recentVariantIds: recent,
        ...ctx.compose,
      }),
      state: next,
      grounding: [],
    };
  }

  const executed = await executeOutingPlan({ repository: ctx.repository, steps, constraints, excludeIds: next.shownActivityIds });
  const found = executed.filter((s) => s.activity);
  next = savePlan(next, executed);
  next = rememberShownActivities(next, found.map((s) => s.activityId));
  next = {
    ...next,
    lastResults: found.map((s) => ({ id: s.activityId, name: s.activity.name })),
    focusedActivityId: found[0]?.activityId || null,
  };
  next = transitionStatus(next, "PLANNING_OUTING");

  const intentKey = !found.length ? "DISCOVER_EMPTY" : found.length < executed.length ? "PLAN_PARTIAL" : "PLAN_SUCCESS";
  const composed = composeResponse({
    intentKey,
    lang,
    vars: { count: found.length },
    planSteps: found.length ? executed : null,
    status: next.status,
    recentVariantIds: recent,
    ...ctx.compose,
  });

  composed.message.suggestions = getOutingPlanSuggestions({ status: "active", lang });
  return { composed, state: next, grounding: found.map((s) => s.activity) };
}

async function handleResumePlan({ understanding, state, ctx }) {
  const lang = understanding.language;
  const recent = state.responseUsage.recentVariantIds;
  const next = resumeOutingPlan(state);
  const ackText = getOutingPlanResumeAck(lang);
  const steps = next.plan?.steps || [];
  const found = steps.filter((s) => s.activityName);

  const composed = composeResponse({
    intentKey: "PLAN_SUCCESS",
    lang,
    vars: { count: found.length || steps.length },
    planSteps: steps.map((s) => ({ category: s.category, activity: { name: s.activityName || s.category } })),
    status: "PLANNING_OUTING",
    recentVariantIds: recent,
    extraLines: [ackText],
    ...ctx.compose,
  });

  composed.message.suggestions = getOutingPlanSuggestions({ status: "active", lang });
  return { composed, state: next, grounding: [] };
}

const HANDLERS = {
  static: handleStatic,
  discover: handleDiscover,
  detail: handleDetail,
  plan: handlePlan,
};

/**
 * Orchestrateur du parcours utilisateur simple (explorateur).
 */
export async function runExplorerTurn({ understanding, state, repository, compose = {}, hasGps = false }) {
  const ctx = { repository, compose, hasGps: Boolean(hasGps) };

  // Évaluation de l'éligibilité du plan de sortie (reprise ou annulation)
  const eligibility = evaluateOutingPlanEligibility({
    plan: state.plan,
    userText: understanding.normalizedText,
    intent: understanding.intent,
  });

  if (eligibility.decision === "RESUME_PLAN") {
    return handleResumePlan({ understanding, state, ctx });
  }

  if (eligibility.decision === "CANCEL_PLAN") {
    const next = cancelOutingPlan(state);
    const intentKey = STATIC_INTENT_KEYS.RESET_SEARCH;
    const composed = composeResponse({
      intentKey,
      lang: understanding.language,
      status: "IDLE",
      recentVariantIds: state.responseUsage.recentVariantIds,
      hasGps: ctx.hasGps,
      ...compose,
    });
    return { composed, state: next, grounding: [] };
  }

  const handler = HANDLERS[routeExplorerIntent(understanding.intent)];
  return handler({ understanding, state, ctx });
}
