import { stripDiacritics } from "../../shared/textUtils.js";
import { extractOutingConstraints, hasAnyConstraint } from "../constraints/chatOutingConstraints.service.js";
import { classifyDetailIntent, classifyDialogueAct } from "./chatDialogueActClassifier.service.js";
import { classifyVibe } from "./chatVibeAndAudienceClassifier.service.js";
import { classifyTimeUrgency } from "./chatTimeUrgencyClassifier.service.js";

/**
 * Façade des classifieurs déterministes (étape 2).
 */
export function classifyTurn({ normalized, memory = {} } = {}) {
  const text = stripDiacritics(normalized?.normalizedText || "");
  const constraints = extractOutingConstraints({
    normalizedText: text,
    detectedCities: normalized?.detectedCities || [],
  });
  const hasActiveSearch = ["RECOMMENDING", "REFINING", "COLLECTING_CRITERIA"].includes(memory.status);

  return {
    text,
    constraints,
    hasConstraints: hasAnyConstraint(constraints),
    detailIntent: classifyDetailIntent(text),
    dialogueAct: classifyDialogueAct({ text, hasConstraints: hasAnyConstraint(constraints), hasActiveSearch }),
    vibes: classifyVibe(text),
    urgency: classifyTimeUrgency(text),
  };
}

