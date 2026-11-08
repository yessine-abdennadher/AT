import { resolveResponse } from "../resolution/responseResolver.service.js";
import { buildQuickReplies } from "./quickRepliesBuilder.service.js";
import { formatActivityCard } from "../../shared/chatCardFormatter.service.js";

const cardOf = (a) => formatActivityCard(a);

const lineOf = (a, i) => `${i + 1}. ${a.name}${a.city ? ` — ${a.city}` : ""}${a.rating ? ` (${a.rating}/5)` : ""}`;

/**
 * Assemble le message : texte résolu (multi-variantes) + liste d'établissements + suggestions.
 * @returns {{ message, resolution }}
 */
export function composeResponse({
  intentKey,
  lang = "fr",
  vars = {},
  activities = [],
  planSteps = null,
  status,
  recentVariantIds = [],
  rng,
  expander,
  extraLines = [],
  hasGps = false,
  pendingField = null,
  isZoneAlternative = false,
  constraints = {},
}) {
  const resolution = resolveResponse({ intentKey, lang, vars, recentVariantIds, rng, expander })
    || resolveResponse({ intentKey: "UNKNOWN", lang, vars: {}, recentVariantIds, rng, expander });

  const lines = [];
  if (extraLines.length) {
    lines.push(...extraLines);
  } else {
    lines.push(resolution.text);
  }
  if (planSteps) {
    planSteps.forEach((step, i) => lines.push(`${i + 1}. ${step.category} : ${step.activity ? step.activity.name : "—"}`));
  } else {
    activities.forEach((a, i) => lines.push(lineOf(a, i)));
  }

  const cards = planSteps ? planSteps.filter((s) => s.activity).map((s) => cardOf(s.activity)) : activities.map(cardOf);
  return {
    resolution,
    message: {
      sender: "bot",
      text: lines.join("\n"),
      suggestions: buildQuickReplies({
        status,
        lang,
        hasResults: cards.length > 0,
        hasPlan: Boolean(planSteps),
        hasGps,
        pendingField,
        isZoneAlternative,
        constraints,
      }),
      metadata: { intentKey, variantId: resolution.variantId, lang: resolution.lang, cards, isZoneAlternative },
    },
  };
}

