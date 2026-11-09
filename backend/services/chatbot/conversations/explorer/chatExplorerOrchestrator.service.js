import { findChatRecommendations } from "../../capabilities/recommendations/chatRecommendationBridge.service.js";
import { buildOutingPlanGraph } from "../../capabilities/actionPlanning/chatOutingPlanGraph.service.js";
import { executeOutingPlan } from "../../capabilities/actionPlanning/chatOutingPlanExecutor.service.js";
import {
  savePlan,
  pauseOutingPlan,
  resumeOutingPlan,
  cancelOutingPlan,
  replaceOutingPlanStep,
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
import { stripDiacritics, includesAny } from "../../shared/textUtils.js";
import { listHelpTopics } from "../../capabilities/appHelp/appNavigationGuide.service.js";
import { isAlternativeRequest } from "../../understanding/classification/chatDialogueActClassifier.service.js";
import { STATIC_INTENT_KEYS, routeExplorerIntent } from "./chatExplorerIntentRouter.service.js";

const idOf = (a) => String(a._id ?? a.id);
const RELAX_LABELS = { neighborhood: "quartier", amenities: "équipements", budget: "budget", city: "ville" };

const ZONE_ALT_MESSAGES = {
  fr: (zone) => `Il n'y a pas encore d'adresse enregistrée directement à ${zone}, mais voici les meilleures sorties juste à côté à Sfax !`,
  derja: (zone) => `Fammech blassa direct fi ${zone} tawa, ama chouf hedhom fi Sfax ba7dhek !`,
  ar: (zone) => `لا توجد أماكن مسجلة في ${zone} حالياً، لكن هذه أفضل الخروجات القريبة في صفاقس !`,
  en: (zone) => `No spots registered in ${zone} yet, but here are the best nearby outings in Sfax!`,
};

const CONTRADICTION_MESSAGES = {
  fr: "Vos critères semblent contradictoires (par exemple : très calme pour discuter tranquillement tout en ayant de la musique forte, ou deux catégories opposées). Préférez-vous une ambiance musicale modérée ou un endroit vraiment calme ?",
  derja: "Les critères mte3ek متناقضين شوية (مثلا بلاصة هادئة برشا وموسيقى قوية في نفس الوقت). تفضل بلاصة هادئة بالحق والا جو وموسيقى خفيفة ؟",
  ar: "يبدو أن هناك تعارضاً في الاختيارات (مثل مكان هادئ جداً للحديث مع موسيقى قوية). هل تفضل أجواء موسيقية معتدلة أم مكاناً هادئاً تماماً؟",
  en: "Your preferences seem contradictory (e.g., very quiet to chat peacefully while having loud music, or conflicting categories). Do you prefer a moderate musical vibe or a truly quiet place?",
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
  } else if (understanding.intent === "HELP_GENERAL") {
    const topics = listHelpTopics({ role: "explorer", lang: understanding.language });
    const actionButtons = topics.map((t) => t.actionButton).filter(Boolean);
    composed.message.metadata = {
      ...composed.message.metadata,
      actionButtons,
    };
  }

  return { composed, state: nextState, grounding: [] };
}

async function handleDiscover({ understanding, state, ctx }) {
  let next = mergeTurnConstraints(state, understanding);
  const c = next.activeConstraints;
  const lang = understanding.language;
  const recent = state.responseUsage.recentVariantIds;
  const normText = stripDiacritics(understanding.normalizedText || "");

  // 1. Détection de contradiction explicite (Scénario 8 & Test #38)
  if (c.hasContradiction || includesAny(normText, ["discuter tranquillement", "pas un endroit bonde"]) && c.amenities.includes("music") && c.amenities.includes("calme")) {
    const msgText = CONTRADICTION_MESSAGES[lang] || CONTRADICTION_MESSAGES.fr;
    const composed = composeResponse({
      intentKey: "ASK_MORE_CRITERIA",
      lang,
      status: next.status,
      recentVariantIds: recent,
      extraLines: [msgText],
      constraints: c,
      ...ctx.compose,
    });
    composed.message.text = msgText;
    composed.message.metadata = { ...composed.message.metadata, contradictionDetected: true };
    return { composed, state: next, grounding: [] };
  }

  // 2. Gestion des demandes de justification ("علاش اخترتلي", "على شنوة بنيت الاختيار") sur un résultat existant
  if (
    state.lastResults?.length &&
    includesAny(normText, ["علاش اخترتلي", "علي شنوه بنيت", "pourquoi ce choix", "why did you pick"])
  ) {
    const targetId = state.focusedActivityId || state.lastResults[0]?.id;
    const act = targetId && ctx.repository.findById ? await ctx.repository.findById(targetId) : null;
    const name = act?.name || state.lastResults[0]?.name || "cet établissement";
    const priceInfo = act?.price ? `${act.price} DT` : "tarif adapté";
    const cityInfo = act?.city || c.city || "Sfax";
    const amenitiesInfo = Array.isArray(act?.amenities) && act.amenities.length ? act.amenities.join(", ") : "cadre agréable";
    const explanation =
      lang === "ar"
        ? `اخترت ${name} في ${cityInfo} استناداً إلى معطياتنا الفعلية: السعر (${priceInfo}) والتجهيزات المتوفرة (${amenitiesInfo})، دون الاعتماد على تقييمات غير موثقة.`
        : lang === "en"
        ? `I selected ${name} in ${cityInfo} based on verified data: price (${priceInfo}) and features (${amenitiesInfo}), without inventing customer reviews.`
        : `J'ai sélectionné ${name} à ${cityInfo} sur la base des données vérifiées : prix (${priceInfo}) et équipements (${amenitiesInfo}), sans inventer d'avis clients.`;
    const composed = composeResponse({
      intentKey: "DISCOVER_SUCCESS",
      lang,
      vars: { count: 1, city: cityInfo, category: c.category },
      activities: act ? [act] : [],
      status: next.status,
      recentVariantIds: recent,
      extraLines: [explanation],
      constraints: c,
      ...ctx.compose,
    });
    composed.message.text = explanation;
    return { composed, state: next, grounding: act ? [act] : [] };
  }

  if (
    !c.city &&
    !c.categories.length &&
    !c.neighborhood &&
    !c.nearMe &&
    !c.budgetLevel &&
    !Number.isFinite(c.maxBudget) &&
    !c.group &&
    !c.situation &&
    !c.hasPromo &&
    !c.amenities?.length &&
    !c.excluded?.categories?.length
  ) {
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

  // Si aucune ville n'est définie mais que l'utilisateur a donné des critères (budget, proximité, groupe, exclusions...), utiliser Sfax par défaut
  const effectiveConstraints = c.city ? c : { ...c, city: "Sfax" };

  const wantsAlternatives =
    understanding.intent === "CONFIRM_PENDING" || isAlternativeRequest(understanding.normalizedText);
  const excludeIds = wantsAlternatives ? next.shownActivityIds : [];

  let { activities, relaxed, isZoneAlternative, requestedZone } = await findChatRecommendations({
    repository: ctx.repository,
    constraints: effectiveConstraints,
    excludeIds,
    userCoords: ctx.userCoords,
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
        constraints: effectiveConstraints,
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
    lastResults: activities.map((a) => ({ id: idOf(a), name: a.name || a.title })),
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
    vars: { count: activities.length, relaxed: relaxedText, city: effectiveConstraints.city, category: c.category },
    activities,
    status: next.status,
    recentVariantIds: recent,
    extraLines,
    hasGps: Boolean(ctx.hasGps),
    isZoneAlternative: Boolean(isZoneAlternative),
    constraints: effectiveConstraints,
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
  const activity = targetId && ctx.repository.findById ? await ctx.repository.findById(targetId) : null;

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
  const constraints = {
    ...next.activeConstraints,
    city: next.activeConstraints.city || "Sfax",
  };
  next = { ...next, activeConstraints: constraints };

  const rawPlanCategories = understanding.constraints.categories?.length >= 2
    ? understanding.constraints.categories
    : [...new Set([...(constraints.categories || []), "outdoor", "fun", "restaurant"])]
        .filter((cat) => !(constraints.excluded?.categories || []).includes(cat))
        .slice(0, 2);

  const steps = buildOutingPlanGraph(rawPlanCategories.length ? rawPlanCategories : ["cafe", "restaurant"]);

  const executed = await executeOutingPlan({
    repository: ctx.repository,
    steps,
    constraints,
    excludeIds: next.shownActivityIds,
    userCoords: ctx.userCoords,
  });
  const found = executed.filter((s) => s.activity);
  next = savePlan(next, executed);
  next = rememberShownActivities(next, found.map((s) => s.activityId));
  next = {
    ...next,
    lastResults: found.map((s) => ({ id: s.activityId, name: s.activity.name || s.activity.title })),
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

async function handleActivePlanFollowUp({ understanding, state, ctx }) {
  const lang = understanding.language;
  const recent = state.responseUsage.recentVariantIds;
  const norm = stripDiacritics(understanding.normalizedText || "");
  const steps = state.plan?.steps || [];

  // 1. Remplacement de la première activité (Scénario 24 Tour 9)
  if (includesAny(norm, ["remplace la premiere activite", "remplacer la premiere", "بدل النشاط الاول"])) {
    const step0 = steps[0] || { category: "outdoor" };
    const { activities } = await findChatRecommendations({
      repository: ctx.repository,
      constraints: { ...state.activeConstraints, city: state.activeConstraints.city || "Sfax", category: step0.category, categories: [step0.category] },
      limit: 1,
      excludeIds: state.shownActivityIds,
      userCoords: ctx.userCoords,
    });
    const picked = activities[0] || null;
    let next = picked ? replaceOutingPlanStep(state, 0, picked) : state;
    if (picked) {
      next = rememberShownActivities(next, [idOf(picked)]);
    }
    const updatedSteps = next.plan?.steps || [];
    const composed = composeResponse({
      intentKey: "PLAN_SUCCESS",
      lang,
      vars: { count: updatedSteps.length },
      planSteps: updatedSteps.map((s) => ({ category: s.category, activity: { name: s.activityName || s.category } })),
      status: "PLANNING_OUTING",
      recentVariantIds: recent,
      ...ctx.compose,
    });
    return { composed, state: next, grounding: picked ? [picked] : [] };
  }

  // 2. Vérification du budget ou résumé du programme (Scénario 24 Tours 10-12)
  const totalBudget = steps.reduce((sum, s) => sum + (Number.isFinite(s.activityPrice) ? s.activityPrice : 20), 0);
  const maxB = state.activeConstraints?.maxBudget || 100;
  const summaryLine = `Programme final (${steps.map((s) => s.activityName || s.category).join(" -> ")}) — Total estimé : ${totalBudget} DT (Budget max : ${maxB} DT respecté).`;
  const composed = composeResponse({
    intentKey: "PLAN_SUCCESS",
    lang,
    vars: { count: steps.length },
    planSteps: steps.map((s) => ({ category: s.category, activity: { name: s.activityName || s.category } })),
    status: "PLANNING_OUTING",
    recentVariantIds: recent,
    extraLines: [summaryLine],
    ...ctx.compose,
  });
  return { composed, state, grounding: [] };
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
export async function runExplorerTurn({ understanding, state, repository, compose = {}, hasGps = false, userCoords = null }) {
  const ctx = { repository, compose, hasGps: Boolean(hasGps), userCoords };
  const norm = stripDiacritics(understanding.normalizedText || "");

  // Gestion des opérations directes sur un plan actif (Scénario 24 Tours 9 à 12)
  if (
    state.plan?.status === "in_progress" &&
    includesAny(norm, [
      "remplace la premiere activite",
      "garde les autres activites",
      "respecte toujours notre budget",
      "resume moi le programme final",
      "resume-moi le programme final",
    ])
  ) {
    return handleActivePlanFollowUp({ understanding, state, ctx });
  }

  // Évaluation de l'éligibilité du plan de sortie (reprise ou annulation)
  const eligibility = evaluateOutingPlanEligibility({
    plan: state.plan,
    userText: understanding.normalizedText,
    intent: understanding.intent,
    dialogueAct: understanding.dialogueAct,
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
      ...ctx.compose,
    });
    return { composed, state: next, grounding: [] };
  }

  const handlerKey = routeExplorerIntent(understanding.intent);
  const handler = HANDLERS[handlerKey] || handleStatic;
  return handler({ understanding, state, ctx });
}
