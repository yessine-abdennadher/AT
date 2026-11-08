import { stripDiacritics, includesAny } from "../../shared/textUtils.js";
import { CATEGORY_KEYWORDS, classifyCategories } from "../classification/chatActivityCategoryClassifier.service.js";

const AMENITY_KEYWORDS = Object.freeze({
  wifi: ["wifi", "internet", "واي فاي"],
  climatisation: ["climatisation", "clim", "مكيف", "تكييف"],
  terrasse: ["terrasse", "plein air", "مع تراس", "تراس", "شرفة", "terrace", "with terrace", "m3a terrasse"],
  power_backup: ["power_backup", "groupe electrogene"],
  vue_mer: ["vue_mer", "vue mer", "vue sur mer", "إطلالة على البحر", "اطلالة على البحر", "vue b7ar", "sea view"],
  parking: ["parking", "باركينغ", "موقف سيارات"],
  calme: ["calme", "cadre calme", "مكان هادئ", "مكان هادي", "quiet", "quiet setting"],
  chicha: ["chicha", "شيشة", "shisha", "hookah"],
  fumeur: ["fumeur", "fumeurs", "tabac", "تدخين"],
});

const NEGATION_REGEX = /(?:sans|pas de|pas d|without|no|blech|balach|men ghir|men 8ir|بدون|بلاش|من غير)\s+([\p{L}\p{N}_]+(?:\s[\p{L}\p{N}_]+)?)/gui;

function detectAmenities(text) {
  return Object.entries(AMENITY_KEYWORDS)
    .filter(([, words]) => includesAny(text, words))
    .map(([amenity]) => amenity);
}

function detectBudget(text) {
  if (
    text.includes("petit budget") ||
    includesAny(text, [
      "pas cher",
      "economique",
      "cheap",
      "cheaper",
      "moins cher",
      "mouch ghali",
      "mouch 8ali",
      "mch ghali",
      "mech ghali",
      "r5is",
      "rkhis",
      "rkhisa",
      "r5isa",
      "ar5as",
      "ارخص",
      "أرخص",
      "مش غالي",
      "مش غالية",
      "رخيص",
      "رخيصة",
    ])
  ) {
    return "low";
  }
  if (text.includes("budget eleve") || includesAny(text, ["luxe", "haut de gamme", "ghali", "8ali", "غالي"])) {
    return "high";
  }
  return null;
}

function detectSituation(text) {
  if (
    includesAny(text, [
      "meteo froid",
      "froid",
      "t9s berd",
      "ta9s berd",
      "berda",
      "bard",
      "il fait froid",
      "طقس بارد",
      "بارد",
      "salon de the cosy",
      "salon de thé cosy",
      "resto chauffe",
      "resto chauffé",
      "صالون شاي دافئ",
      "مطعم مدفأ",
      "cozy tea room",
      "heated restaurant",
    ])
  ) {
    return "cold";
  }
  if (includesAny(text, ["ouvert maintenant", "ouvert tawa", "mahloul tawa", "مفتوح الآن", "مفتوح الان", "open now"])) return "open_now";
  if (includesAny(text, ["pluie", "mtar", "il pleut", "مطر"])) return "rain";
  if (includesAny(text, ["chaleur", "skhouna", "skhoun", "il fait chaud", "سخونة"])) return "hot";
  return null;
}

function detectGroup(text) {
  if (
    includesAny(text, [
      "en couple",
      "couple",
      "dîner romantique",
      "diner romantique",
      "عشاء رومانسي",
      "romantic dinner",
      "s7bti",
      "sahbti",
      "copine",
      "romantique",
      "date",
      "rajli",
      "marti",
      "كبل",
      "صاحبتي",
      "رومانسي",
    ])
  ) {
    return "couple";
  }
  if (
    includesAny(text, [
      "avec mes amis",
      "amis",
      "s7abi",
      "shabi",
      "entre amis",
      "potes",
      "friends",
      "صحابي",
      "أصحابي",
      "lamma",
      "لمة",
      "لمه",
      "قهوة لمة",
      "café lamma",
      "cafe lamma",
      "9ahwa lamma",
      "hangout cafe",
    ])
  ) {
    return "friends";
  }
  if (includesAny(text, ["famille", "family", "enfants", "kids", "عائلة", "عائلي", "3ayli", "familial", "family friendly"])) return "family";
  return null;
}

function detectMood(text) {
  if (
    includesAny(text, [
      "ennui",
      "changer air",
      "faddit",
      "fadda",
      "9la9t",
      "9l9t",
      "9la9",
      "mala fadda",
      "قلق",
      "فديت",
    ])
  ) {
    return "boredom_relief";
  }
  return null;
}

function detectPromo(text) {
  return includesAny(text, [
    "promo",
    "promos",
    "promotion",
    "promotions",
    "offre",
    "offres",
    "offre speciale",
    "offres speciales",
    "reduc",
    "reduction",
    "reductions",
    "happy hour",
    "remise",
    "bon plan",
    "bons plans",
    "pack",
    "soldes",
    "تخفيض",
    "تخفيضات",
    "عروض",
    "عرض خاص",
    "عروض خاصة",
    "برومو",
    "اوفر",
    "3ardh",
    "3roudhat",
  ]);
}

function detectEvening(text) {
  return includesAny(text, [
    "soiree",
    "soirée",
    "ce soir",
    "soir",
    "sehra",
    "sahria",
    "sahra",
    "fil lil",
    "fel lil",
    "el lila",
    "lila",
    "tonight",
    "evening",
    "night",
    "nocturne",
    "سهرة",
    "الليلة",
    "في الليل",
    "سهرة الليلة",
  ]);
}

/**
 * Extrait les contraintes positives et négatives d'un tour.
 * Les négations ("sans wifi", "pas de plage") alimentent `excluded`.
 */
export function extractOutingConstraints({ normalizedText = "", detectedCities = [], detectedNeighborhoods = [] } = {}) {
  const text = stripDiacritics(normalizedText);
  const excluded = { amenities: [], categories: [] };
  let positiveText = text;

  for (const match of text.matchAll(NEGATION_REGEX)) {
    const term = match[1];
    const amenity = detectAmenities(term)[0];
    const category = classifyCategories(term)[0];
    if (amenity) excluded.amenities.push(amenity);
    if (category) excluded.categories.push(category);
    if (amenity || category) positiveText = positiveText.replace(match[0], " ");
  }

  const rawCategories = classifyCategories(positiveText).filter((c) => !excluded.categories.includes(c));
  const amenities = detectAmenities(positiveText).filter((a) => !excluded.amenities.includes(a));

  const isEvening = detectEvening(text);
  const situation = detectSituation(text) || (isEvening ? "night" : null);
  const group = detectGroup(text);
  const mood = detectMood(text);
  const budgetLevel = detectBudget(text);
  const hasPromo = detectPromo(text);

  const categories = [...rawCategories];
  if (group === "couple" && !categories.includes("couple")) {
    if (!categories.length) categories.push("couple");
  }
  if (mood === "boredom_relief" && !categories.length) {
    categories.push("fun");
  }

  return {
    city: detectedCities[0] || null,
    cities: detectedCities,
    neighborhood: detectedNeighborhoods[0] || null,
    neighborhoods: detectedNeighborhoods,
    category: categories[0] || null,
    categories,
    budgetLevel,
    budgetMax: budgetLevel === "low" ? 30 : null,
    situation,
    group,
    mood,
    hasPromo,
    isEvening,
    amenities,
    excluded,
  };
}

export function hasAnyConstraint(constraints = {}) {
  return Boolean(
    constraints.city ||
      constraints.neighborhood ||
      constraints.category ||
      constraints.budgetLevel ||
      constraints.situation ||
      constraints.group ||
      constraints.mood ||
      constraints.hasPromo ||
      constraints.isEvening ||
      constraints.amenities?.length ||
      constraints.excluded?.amenities?.length ||
      constraints.excluded?.categories?.length
  );
}

export const KNOWN_CATEGORIES = Object.keys(CATEGORY_KEYWORDS);

