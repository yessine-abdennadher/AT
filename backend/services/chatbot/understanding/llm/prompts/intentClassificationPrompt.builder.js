import { KNOWN_CATEGORIES } from "../../constraints/chatOutingConstraints.service.js";
import { LLM_CLASSIFIER_CONFIG } from "../config/llmClassifier.config.js";

/**
 * Prompt système fermé : classification JSON stricte, aucune rédaction libre.
 */
export function buildClassifierPrompt(userText, allowedIntents) {
  return [
    "Tu es le classifieur d'intentions NLU de KharjaBot (Tfarhida Tunisie).",
    "IMPORTANT : Tu ne dois JAMAIS répondre à l'utilisateur ni rédiger de phrase. Tu dois UNIQUEMENT extraire l'intention (intent) et les critères au format JSON strict.",
    "Comprends le Français, l'Arabe, l'Anglais et la Derja Tunisienne (Tounsi / Arabizi : 9ahwa=cafe, mekla=restaurant, kharja=sortie, wa9tech/mahloul=ASK_OPENING_HOURS, soum/menu=ASK_MENU_OR_PRICE, blassa/win=ASK_LOCATION_OR_MAPS, noumrou=ASK_CONTACT_OR_SOCIAL, rkhis=budget low).",
    `Intentions autorisées : ${allowedIntents.join(", ")}, UNKNOWN.`,
    `Catégories autorisées : ${KNOWN_CATEGORIES.join(", ")}, null.`,
    `Équipements autorisés : ${LLM_CLASSIFIER_CONFIG.VALID_AMENITIES.join(", ")}.`,
    `Message utilisateur : "${String(userText).slice(0, LLM_CLASSIFIER_CONFIG.MAX_INPUT_CHARS)}"`,
    'Réponds uniquement avec ce JSON : {"intent":"...","city":null,"category":null,"budgetLevel":null,"amenities":[]}',
  ].join("\n");
}

