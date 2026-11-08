import { getSmartSuggestions } from "../suggestions/smartSuggestionsEngine.service.js";

/**
 * Suggestions contextuelles intelligentes selon le statut du dialogue,
 * la disponibilité GPS, la zone demandée et le niveau d'avancement (workflow par étapes).
 */
export function buildQuickReplies({
  status = "IDLE",
  lang = "fr",
  hasResults = false,
  hasPlan = false,
  hasGps = false,
  pendingField = null,
  isZoneAlternative = false,
  constraints = {},
} = {}) {
  return getSmartSuggestions({
    status,
    lang,
    hasResults,
    hasPlan,
    hasGps,
    pendingField,
    isZoneAlternative,
    constraints,
  });
}

