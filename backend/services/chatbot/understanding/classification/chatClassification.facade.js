import { stripDiacritics } from "../../shared/textUtils.js";
import { extractOutingConstraints, hasAnyConstraint } from "../constraints/chatOutingConstraints.service.js";
import { classifyDetailIntent, classifyDialogueAct } from "./chatDialogueActClassifier.service.js";
import { classifyVibe } from "./chatVibeAndAudienceClassifier.service.js";
import { classifyTimeUrgency } from "./chatTimeUrgencyClassifier.service.js";
import { buildClassificationDto } from "./classificationDto.builder.js";

/**
 * Façade modulaire des classifieurs de sortie (étape 2).
 * Combine les règles déterministes et produit le DTO standardisé.
 */
export function classifyTurn({ normalized, memory = {} } = {}) {
  const text = stripDiacritics(normalized?.normalizedText || "");
  const constraints = extractOutingConstraints({
    normalizedText: text,
    detectedCities: normalized?.detectedCities || [],
    detectedNeighborhoods: normalized?.detectedNeighborhoods || [],
  });
  const hasConstraints = hasAnyConstraint(constraints);
  const hasActiveSearch = ["RECOMMENDING", "REFINING", "COLLECTING_CRITERIA"].includes(memory.status);

  const detailIntent = classifyDetailIntent(text);
  const dialogueAct = classifyDialogueAct({ text, hasConstraints, hasActiveSearch });
  const vibes = classifyVibe(text);
  const urgency = classifyTimeUrgency(text);

  const dto = buildClassificationDto({
    intent: detailIntent || (hasConstraints ? (dialogueAct === "REFINEMENT" ? "REFINE_CRITERIA" : "DISCOVER_ACTIVITIES") : "OTHER"),
    confidence: detailIntent ? 0.88 : (hasConstraints ? 0.85 : 0.4),
    dialogueAct,
    constraints,
    vibes,
    urgency,
  });

  return {
    text,
    constraints,
    hasConstraints,
    detailIntent,
    dialogueAct,
    vibes,
    urgency,
    dto,
  };
}
