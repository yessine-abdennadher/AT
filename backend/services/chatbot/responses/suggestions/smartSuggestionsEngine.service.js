/**
 * smartSuggestionsEngine.service.js
 * Moteur de suggestions contextuelles intelligentes (Sfax-First & Progressif).
 *
 * Étape 1 : Zone / Position (Gremda, Chihia, Sakiet Ezzit, Centre-ville, GPS)
 * Étape 2 : Type de sortie (Café, Restaurant, Plein air, Loisirs)
 * Étape 3 : Affinage & Ambiance (Moins cher, Terrasse, Familial, Ouvert)
 * Étape 4 : Détails & Action (Horaires, Menu & Prix, Itinéraire, Autre zone)
 */

const STEP1_ZONES = {
  fr: {
    noGps: ["Activer position 📍", "Gremda", "Chihia", "Sakiet Ezzit", "Centre-ville"],
    withGps: ["Autour de moi 📍", "Gremda", "Chihia", "Sakiet Ezzit", "Centre-ville"],
  },
  derja: {
    noGps: ["Khaddem GPS 📍", "Gremda", "Chihia", "Sakiet Ezzit", "Centre-ville"],
    withGps: ["Ba7dheya 📍", "Gremda", "Chihia", "Sakiet Ezzit", "Centre-ville"],
  },
  ar: {
    noGps: ["تفعيل الموقع 📍", "قرمدة", "الشيحية", "ساقية الزيت", "وسط المدينة"],
    withGps: ["قريب مني 📍", "قرمدة", "الشيحية", "ساقية الزيت", "وسط المدينة"],
  },
  en: {
    noGps: ["Enable GPS 📍", "Gremda", "Chihia", "Sakiet Ezzit", "Downtown"],
    withGps: ["Near me 📍", "Gremda", "Chihia", "Sakiet Ezzit", "Downtown"],
  },
};

const STEP2_CATEGORIES = {
  fr: ["Café", "Restaurant", "Plein air", "Loisirs & Fun"],
  derja: ["9ahwa", "Restaurant", "Hwe ndhif", "Jaw & Loisirs"],
  ar: ["قهوة", "مطعم", "هواء طلق", "ألعاب وترفيه"],
  en: ["Coffee", "Restaurant", "Outdoors", "Fun & Leisure"],
};

const STEP3_REFINEMENTS = {
  fr: ["Moins cher", "Avec terrasse", "Familial", "Ouvert maintenant"],
  derja: ["Ar5as", "M3a terrasse", "3ayli", "Mahloul tawa"],
  ar: ["أرخص", "مع تراس", "عائلي", "مفتوح الآن"],
  en: ["Cheaper", "With terrace", "Family friendly", "Open now"],
};

const CONTEXT_REFINEMENTS = {
  couple: {
    fr: ["Dîner romantique", "Vue sur mer", "Cadre calme", "Moins cher"],
    derja: ["Dîner romantique", "Vue b7ar", "Cadre calme", "Ar5as"],
    ar: ["عشاء رومانسي", "إطلالة على البحر", "مكان هادئ", "أرخص"],
    en: ["Romantic dinner", "Sea view", "Quiet setting", "Cheaper"],
  },
  friends: {
    fr: ["Café lamma", "Gaming & Fun", "Resto sympa", "Moins cher"],
    derja: ["9ahwa lamma", "Gaming & Fun", "Resto behi", "Ar5as"],
    ar: ["قهوة لمة", "ألعاب وترفيه", "مطعم مميز", "أرخص"],
    en: ["Hangout cafe", "Gaming & Fun", "Lively restaurant", "Cheaper"],
  },
  cold: {
    fr: ["Salon de thé cosy", "Resto chauffé", "Cinéma", "Moins cher"],
    derja: ["Salon cosy", "Resto dwefi", "Cinéma", "Ar5as"],
    ar: ["صالون شاي دافئ", "مطعم مدفأ", "سينما", "أرخص"],
    en: ["Cozy tea room", "Heated restaurant", "Cinema", "Cheaper"],
  },
  evening_promo: {
    fr: ["Happy hour ce soir", "Offres de soirée", "Moins cher", "Autre zone"],
    derja: ["Happy hour el lila", "Promo el lila", "Ar5as", "Zone o5ra"],
    ar: ["عروض سهرة الليلة", "تخفيضات سهرة الليلة", "أرخص", "منطقة أخرى"],
    en: ["Happy hour tonight", "Evening promotions", "Cheaper", "Other area"],
  },
  promo: {
    fr: ["Promotions en cours", "Moins cher", "Avec terrasse", "Autre zone"],
    derja: ["Promo el lila", "Ar5as", "M3a terrasse", "Zone o5ra"],
    ar: ["عروض وتخفيضات", "أرخص", "مع تراس", "منطقة أخرى"],
    en: ["Special deals", "Cheaper", "With terrace", "Other area"],
  },
  night: {
    fr: ["Soirée avec promo", "Cadre calme", "Moins cher", "Autre zone"],
    derja: ["Sehra avec promo", "Cadre calme", "Ar5as", "Zone o5ra"],
    ar: ["عروض سهرة الليلة", "مكان هادئ", "أرخص", "منطقة أخرى"],
    en: ["Night out with deals", "Quiet setting", "Cheaper", "Other area"],
  },
  boredom_relief: {
    fr: ["Loisirs & Fun", "Plein air", "Café animé", "Resto sympa"],
    derja: ["Jaw & Loisirs", "Hwe ndhif", "9ahwa mzyena", "Resto"],
    ar: ["ألعاب وترفيه", "هواء طلق", "قهوة مميزة", "مطعم"],
    en: ["Fun & Leisure", "Outdoors", "Lively cafe", "Good restaurant"],
  },
};

const STEP4_ACTIONS = {
  fr: ["Horaires", "Menu & Prix", "Itinéraire", "Autre zone"],
  derja: ["El wa9t", "El menu", "Thneya", "Zone o5ra"],
  ar: ["الأوقات", "المنيو والأسعار", "الموقع والمسار", "منطقة أخرى"],
  en: ["Hours", "Menu & Prices", "Directions", "Other area"],
};

const ZONE_ALTERNATIVES = {
  fr: ["Centre-ville", "Chihia", "Sakiet Ezzit", "Toutes les sorties"],
  derja: ["Centre-ville", "Chihia", "Sakiet Ezzit", "Kol el kharjet"],
  ar: ["وسط المدينة", "الشيحية", "ساقية الزيت", "كل الأنشطة"],
  en: ["Downtown", "Chihia", "Sakiet Ezzit", "All outings"],
};

const PLAN_SUGGESTIONS = {
  fr: ["Valider ce plan", "Changer le café", "Budget total ?", "Autre programme"],
  derja: ["Mwefe9 3la el plan", "Baddel el 9ahwa", "Soum el kol ?", "Programme akher"],
  ar: ["تأكيد البرنامج", "تغيير المقهى", "الميزانية الإجمالية ؟", "برنامج آخر"],
  en: ["Confirm plan", "Change coffee place", "Total budget?", "Another plan"],
};

export function getSmartSuggestions({
  status = "IDLE",
  lang = "fr",
  hasResults = false,
  hasPlan = false,
  hasGps = false,
  pendingField = null,
  isZoneAlternative = false,
  constraints = {},
} = {}) {
  const safeLang = ["fr", "derja", "ar", "en"].includes(lang) ? lang : "fr";

  // Si un plan multi-étapes est actif
  if (hasPlan) {
    return PLAN_SUGGESTIONS[safeLang] || PLAN_SUGGESTIONS.fr;
  }

  // Si l'utilisateur inspecte un établissement précis (Étape 4 : Actions)
  if (status === "INSPECTING_ITEM") {
    return STEP4_ACTIONS[safeLang] || STEP4_ACTIONS.fr;
  }

  // Si une zone vide a basculé sur des alternatives (ex: Gremda vide -> Alternatives Sfax)
  if (isZoneAlternative) {
    return ZONE_ALTERNATIVES[safeLang] || ZONE_ALTERNATIVES.fr;
  }

  // Si une question de slot est en attente
  if (pendingField === "city" || pendingField === "zone") {
    const list = STEP1_ZONES[safeLang] || STEP1_ZONES.fr;
    return hasGps ? list.withGps : list.noGps;
  }

  if (pendingField === "category") {
    return STEP2_CATEGORIES[safeLang] || STEP2_CATEGORIES.fr;
  }

  // Si des résultats sont présentés (Étape 3 : Affinage)
  if (hasResults || status === "RECOMMENDING" || status === "REFINING") {
    if (constraints.hasPromo && (constraints.isEvening || constraints.situation === "night")) {
      return CONTEXT_REFINEMENTS.evening_promo[safeLang] || CONTEXT_REFINEMENTS.evening_promo.fr;
    }
    if (constraints.hasPromo) {
      return CONTEXT_REFINEMENTS.promo[safeLang] || CONTEXT_REFINEMENTS.promo.fr;
    }
    if (constraints.isEvening || constraints.situation === "night") {
      return CONTEXT_REFINEMENTS.night[safeLang] || CONTEXT_REFINEMENTS.night.fr;
    }
    if (constraints.group === "couple" || constraints.category === "couple") {
      return CONTEXT_REFINEMENTS.couple[safeLang] || CONTEXT_REFINEMENTS.couple.fr;
    }
    if (constraints.group === "friends" || constraints.category === "friends") {
      return CONTEXT_REFINEMENTS.friends[safeLang] || CONTEXT_REFINEMENTS.friends.fr;
    }
    if (constraints.situation === "cold") {
      return CONTEXT_REFINEMENTS.cold[safeLang] || CONTEXT_REFINEMENTS.cold.fr;
    }
    if (constraints.mood === "boredom_relief") {
      return CONTEXT_REFINEMENTS.boredom_relief[safeLang] || CONTEXT_REFINEMENTS.boredom_relief.fr;
    }
    return STEP3_REFINEMENTS[safeLang] || STEP3_REFINEMENTS.fr;
  }

  // Étape 2 : Si la zone est déjà connue mais pas la catégorie
  if (constraints.neighborhood || constraints.city) {
    if (!constraints.category && (!constraints.categories || constraints.categories.length === 0)) {
      return STEP2_CATEGORIES[safeLang] || STEP2_CATEGORIES.fr;
    }
  }

  // Étape 1 : Accueil / IDLE (Propose les zones de Sfax et le GPS)
  const step1 = STEP1_ZONES[safeLang] || STEP1_ZONES.fr;
  return hasGps ? step1.withGps : step1.noGps;
}

