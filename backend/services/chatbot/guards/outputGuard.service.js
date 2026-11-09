import { hallucinationGuard } from "./hallucinationGuard.service.js";
import { privacyLeakGuard } from "./privacyLeakGuard.service.js";
import { roleIsolationGuard } from "./roleIsolationGuard.service.js";

const EMOJI = /\p{Extended_Pictographic}/gu;
const PLACEHOLDER = /\{\w+\}/;
const SAFE_FALLBACK = "Je n'ai pas pu finaliser cette réponse. Pouvez-vous reformuler votre demande ?";

/**
 * Pare-feu final : emojis interdits, placeholders orphelins, PII/secrets, numéros inventés, isolation des rôles.
 *
 * @param {Object} message DTO ou message généré
 * @param {Object} [options]
 * @param {Array} [options.activities=[]] Activités réelles servant de source de vérité
 * @param {string} [options.role="explorer"] Rôle utilisateur courant
 * @returns {Object} Message assaini et tagué
 */
export function outputGuard(message, { activities = [], role = "explorer" } = {}) {
  const flags = [];
  let text = String(message.text || "").replace(EMOJI, "");
  if (PLACEHOLDER.test(text)) {
    flags.push("unresolved_placeholder");
    text = SAFE_FALLBACK;
  }
  const privacy = privacyLeakGuard(text);
  if (privacy.flagged) flags.push("privacy");

  const roleIso = roleIsolationGuard(privacy.text, role);
  if (roleIso.flagged) flags.push("role_isolation");

  const halluc = hallucinationGuard(roleIso.text, activities);
  if (halluc.flagged) flags.push("hallucination");

  return {
    ...message,
    text: halluc.text.trim(),
    metadata: {
      ...message.metadata,
      guardFlags: flags,
    },
  };
}
