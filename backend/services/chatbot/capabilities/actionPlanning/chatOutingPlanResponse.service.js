/**
 * Constructeur de réponses et suggestions localisées pour les plans de sortie (FR / Derja / Arabe).
 */

const PLAN_SUGGESTIONS = Object.freeze({
  fr: {
    paused: ["Reprendre le programme", "Voir la suite", "Autre sortie"],
    active: ["Voir les horaires", "Autre programme", "Tout recommencer"],
  },
  derja: {
    paused: ["Kamel el programme", "Chouf el be9i", "Kharja o5ra"],
    active: ["Chouf el wa9t", "Programme akher", "3awed men jdid"],
  },
  ar: {
    paused: ["واصل البرنامج", "شوف البقية", "خرجة أخرى"],
    active: ["شوف الأوقات", "برنامج آخر", "نعاودو من جديد"],
  },
  en: {
    paused: ["Resume plan", "See next step", "Another outing"],
    active: ["Opening hours", "Another plan", "Start over"],
  },
});

const RESUME_ACK_TEXTS = Object.freeze({
  fr: "Parfait ! On reprend votre programme de sortie. Voici la suite :",
  derja: "Behi barcha ! Nkammlou el programme mte3 el kharja. Haw el be9i :",
  ar: "ممتاز! نواصلو في برنامج الخرجة متاعك. هاو البقية :",
  en: "Great! Resuming your outing plan. Here is the next step:",
});

export function getOutingPlanSuggestions({ status = "active", lang = "fr" } = {}) {
  const dict = PLAN_SUGGESTIONS[lang] || PLAN_SUGGESTIONS.fr;
  return status === "paused" ? dict.paused : dict.active;
}

export function getOutingPlanResumeAck(lang = "fr") {
  return RESUME_ACK_TEXTS[lang] || RESUME_ACK_TEXTS.fr;
}

