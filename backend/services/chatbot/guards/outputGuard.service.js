import { hallucinationGuard } from "./hallucinationGuard.service.js";
import { privacyLeakGuard } from "./privacyLeakGuard.service.js";

const EMOJI = /\p{Extended_Pictographic}/gu;
const PLACEHOLDER = /\{\w+\}/;
const SAFE_FALLBACK = "Je n'ai pas pu finaliser cette réponse. Pouvez-vous reformuler votre demande ?";

/**
 * Pare-feu final : emojis interdits, placeholders orphelins, PII, numéros inventés.
 */
export function outputGuard(message, { activities = [] } = {}) {
  const flags = [];
  let text = String(message.text || "").replace(EMOJI, "");
  if (PLACEHOLDER.test(text)) { flags.push("unresolved_placeholder"); text = SAFE_FALLBACK; }
  const privacy = privacyLeakGuard(text);
  if (privacy.flagged) flags.push("privacy");
  const halluc = hallucinationGuard(privacy.text, activities);
  if (halluc.flagged) flags.push("hallucination");
  return { ...message, text: halluc.text.trim(), metadata: { ...message.metadata, guardFlags: flags } };
}
