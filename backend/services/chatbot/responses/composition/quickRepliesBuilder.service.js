const LABELS = {
  fr: {
    discover: ["Moins cher", "Avec terrasse", "Avec wifi", "Autre ville"],
    inspect: ["Horaires", "Menu", "Adresse", "Contact"],
    plan: ["Voir les horaires", "Autre programme"],
    idle: ["Un café", "Un restaurant", "Une sortie en famille"],
  },
  en: {
    discover: ["Cheaper", "With terrace", "With wifi", "Another city"],
    inspect: ["Opening hours", "Menu", "Address", "Contact"],
    plan: ["Opening hours", "Another plan"],
    idle: ["A coffee shop", "A restaurant", "A family outing"],
  },
  ar: {
    discover: ["أرخص", "مع تراس", "مع واي فاي", "مدينة أخرى"],
    inspect: ["الأوقات", "المنيو", "العنوان", "التواصل"],
    plan: ["الأوقات", "برنامج آخر"],
    idle: ["قهوة", "مطعم", "خرجة عائلية"],
  },
  derja: {
    discover: ["Ar5as", "M3a terrasse", "M3a wifi", "Ville o5ra"],
    inspect: ["El wa9t", "El menu", "L'adresse", "Contact"],
    plan: ["Chouf el wa9t", "Programme akher"],
    idle: ["9ahwa", "Restaurant", "Kharja m3a el 3ayla"],
  },
};

/**
 * Suggestions contextuelles selon le statut du dialogue.
 * Les langues sans libellés dédiés (derja) utilisent le français.
 */
export function buildQuickReplies({ status, lang = "fr", hasResults = false, hasPlan = false }) {
  const labels = LABELS[lang] || LABELS.fr;
  if (hasPlan) return labels.plan;
  if (status === "INSPECTING_ITEM") return labels.inspect;
  if (hasResults || ["RECOMMENDING", "REFINING"].includes(status)) return labels.discover;
  return labels.idle;
}

