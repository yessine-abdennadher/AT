import { stripDiacritics, includesAny } from "../../shared/textUtils.js";

const DETAIL_KEYWORDS = Object.freeze({
  ASK_OPENING_HOURS: ["horaires", "ouvert", "ferme", "ouvre", "heure d ouverture", "opening hours"],
  ASK_MENU_OR_PRICE: ["menu", "prix", "tarif", "tarifs", "coute", "carte", "voir menu"],
  ASK_LOCATION_OR_MAPS: ["adresse", "ou se trouve", "localisation", "maps", "itineraire"],
  ASK_CONTACT_OR_SOCIAL: ["numero", "telephone", "whatsapp", "instagram", "contact", "appeler"],
});

const AFFIRMATIONS = ["oui", "ok", "d accord", "dac", "yes", "ouais", "parfait"];
const REFUSALS = ["non", "no", "pas du tout", "nope"];
const RESET_WORDS = ["recommencer", "nouvelle recherche", "reinitialiser", "tout effacer", "changer tout"];
const DISCOVERY_HINTS = ["sortir", "sortie", "idee", "ou aller", "faire un tour", "endroit", "place", "kharja", "5arja", "nokhrej", "nokhrjou"];

export function classifyDetailIntent(rawText = "") {
  const text = stripDiacritics(rawText);
  for (const [intent, words] of Object.entries(DETAIL_KEYWORDS)) {
    if (includesAny(text, words)) return intent;
  }
  return null;
}

export function classifyDialogueAct({ text = "", hasConstraints = false, hasActiveSearch = false } = {}) {
  const stripped = stripDiacritics(text);
  if (includesAny(stripped, RESET_WORDS)) return "RESET";
  if (classifyDetailIntent(stripped)) return "DETAIL_QUESTION";
  if (hasConstraints) return hasActiveSearch ? "REFINEMENT" : "SEARCH_REQUEST";
  if (includesAny(stripped, DISCOVERY_HINTS)) return "SEARCH_REQUEST";
  if (REFUSALS.includes(stripped)) return "REFUSAL";
  if (AFFIRMATIONS.includes(stripped)) return "AFFIRMATION";
  return "OTHER";
}

