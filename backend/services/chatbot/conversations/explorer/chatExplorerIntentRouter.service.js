const STATIC_INTENTS = new Set(["GREETING", "THANKS", "GOODBYE", "HELP_GENERAL", "UNKNOWN", "RESET_SEARCH"]);
const DETAIL_INTENTS = new Set(["ASK_OPENING_HOURS", "ASK_MENU_OR_PRICE", "ASK_LOCATION_OR_MAPS", "ASK_CONTACT_OR_SOCIAL"]);
const DISCOVER_INTENTS = new Set(["DISCOVER_ACTIVITIES", "REFINE_CRITERIA", "CONFIRM_PENDING"]);

/**
 * Route une intention vers un gestionnaire de l'orchestrateur Explorateur.
 * Les intentions partenaire ne sont pas gérées ici (parcours utilisateur simple uniquement).
 */
export function routeExplorerIntent(intent) {
  if (STATIC_INTENTS.has(intent)) return "static";
  if (DISCOVER_INTENTS.has(intent)) return "discover";
  if (DETAIL_INTENTS.has(intent)) return "detail";
  if (intent === "PLAN_MULTI_STEP_OUTING") return "plan";
  return "static";
}

export const STATIC_INTENT_KEYS = Object.freeze({
  GREETING: "GREETING",
  THANKS: "THANKS",
  GOODBYE: "GOODBYE",
  HELP_GENERAL: "HELP_GENERAL",
  UNKNOWN: "UNKNOWN",
  RESET_SEARCH: "RESET_DONE",
});

