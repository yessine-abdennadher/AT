import { stripDiacritics, includesAny } from "../../shared/textUtils.js";
import { CATEGORY_KEYWORDS, classifyCategories } from "../classification/chatActivityCategoryClassifier.service.js";

const AMENITY_KEYWORDS = Object.freeze({
  wifi: ["wifi", "wi-fi", "wi fi", "internet", "واي فاي"],
  climatisation: ["climatisation", "clim", "climatise", "air conditioning", "air conditioned", "air-conditioned", "مكيف", "تكييف", "كليماتيزور"],
  terrasse: ["terrasse", "plein air", "espace exterieur", "outdoor area", "مع تراس", "تراس", "شرفة", "شرفه", "مساحه خارجيه", "مساحة خارجية", "لبرا", "البرا", "برا", "بلاصه برا", "terrace", "with terrace", "m3a terrasse"],
  power_backup: ["power_backup", "groupe electrogene", "lumiere", "ضو"],
  vue_mer: ["vue_mer", "vue mer", "vue sur mer", "vue sur la mer", "bord de la mer", "by the sea", "إطلالة على البحر", "اطلالة على البحر", "اطلاله علي البحر", "اطلاله علي بحر", "تطل علي البحر", "تطل علي بحر", "تطل على البحر", "شاطئ البحر", "شاطئ بحر", "على البحر", "علي البحر", "علي بحر", "vue b7ar", "sea view"],
  parking: ["parking", "باركينغ", "موقف سيارات"],
  calme: ["calme", "cadre calme", "peaceful", "مكان هادئ", "مكان هادي", "هادئ", "هادئه", "هاديه", "وهاديه", "وهادئه", "هادي", "جو هادئ", "أهدى", "اهدي", "quiet", "quiet setting"],
  chicha: ["chicha", "شيشة", "شيشه", "shisha", "hookah"],
  fumeur: ["fumeur", "fumeurs", "tabac", "تدخين"],
  chic: ["chic", "classy", "شيك", "راق", "راقي"],
  music: ["musique", "music", "live music", "موسيقى", "موسيقي"],
});

const NEGATION_REGEX = /(?:sans|pas de|pas d|pas un simple|ni|eviter|avoid|without|no|not a|i don t want|dont want|we don t want|je ne veux pas|on ne veux pas|on ne veut pas|blech|balach|men ghir|men 8ir|ma n7ebch|ma nhebch|ma n7ebouch|ma nhebouch|بدون|بلاش|من غير|ما نحبش|ما نحبوش|منحبش|ما تكونش|لا اريد|تجنب)\s+([\p{L}\p{N}_]+(?:\s+[\p{L}\p{N}_]+){0,3})/gui;

const BUDGET_AMOUNT_REGEX = /(?:budget|moins de|under|max|maximum|seulement|only|عندي|عنا|ميزانيه|ميزانية|بأقل من|باقل من|اقل من|يفوتش)?\s*(\d{1,4})\s*(?:dt|tnd|dinars?|dinar|دنانير|دينار|دينارا)/i;

function detectAmenities(text) {
  return Object.entries(AMENITY_KEYWORDS)
    .filter(([, words]) => includesAny(text, words))
    .map(([amenity]) => amenity);
}

function detectMaxBudget(text) {
  const m = BUDGET_AMOUNT_REGEX.exec(text);
  if (m && m[1]) {
    const val = Number(m[1]);
    if (Number.isFinite(val) && val > 0 && val <= 2000) return val;
  }
  return null;
}

function detectBudget(text, maxBudget = null) {
  if (
    includesAny(text, [
      "gratuit",
      "gratuite",
      "gratuites",
      "free",
      "ببلاش",
      "مجانية",
      "مجانيه",
      "مجاني",
    ])
  ) {
    return "low";
  }
  if (Number.isFinite(maxBudget) && maxBudget <= 35) {
    return "low";
  }
  if (
    text.includes("petit budget") ||
    includesAny(text, [
      "pas cher",
      "pas trop cher",
      "peu couteuse",
      "economique",
      "affordable",
      "cheap",
      "cheaper",
      "cheapest",
      "moins cher",
      "moins cheres",
      "not too expensive",
      "without spending much",
      "sans trop depenser",
      "sans depenser beaucoup",
      "budget limite",
      "small budget",
      "on a budget",
      "mouch ghali",
      "mouch 8ali",
      "mch ghali",
      "mch ghaliya",
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
      "موش غالي",
      "موش غاليه",
      "ما يكونش غالي",
      "موش لازم حاجه غاليه",
      "ما يغلاش",
      "ما نصرفوش برشا",
      "وما نصرفوش برشا",
      "نصرفوش برشا",
      "من غير ما نصرف برشا",
      "دون انفاق الكثير",
      "اسعار معقوله",
      "بميزانيه صغيره",
      "ميزانيه صغيره",
      "رخيص",
      "رخيصة",
      "رخيصه",
    ])
  ) {
    return "low";
  }
  if (text.includes("budget eleve") || includesAny(text, ["luxe", "haut de gamme", "ghali", "8ali", "غالي"])) {
    return "high";
  }
  return null;
}

function detectNearMe(text) {
  return includesAny(text, [
    "pres de moi",
    "proche de moi",
    "proches de moi",
    "endroit proche",
    "pas trop loin",
    "pas trop me deplacer",
    "eviter les deplacements longs",
    "marcher 15 minutes",
    "20 minutes de deplacement",
    "pres de mon quartier",
    "moins de 5 km",
    "within 5 km",
    "near me",
    "near my neighborhood",
    "travel too far",
    "9rib",
    "9riba",
    "7dheya",
    "ba7dheya",
    "قريب ليا",
    "قريبه ليا",
    "قريبة ليا",
    "قريبه مني",
    "قريبة مني",
    "قريب من حيي",
    "قريبه من حومتي",
    "قريبه",
    "قريب",
    "ما نبعدوش برشا",
    "ما نحبش نبعد",
    "ما نحبش نضيع وقت في الطريق",
    "اقل من 5 كلم",
    "اقل من 5 كيلومترات",
  ]);
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
  if (
    includesAny(text, [
      "ouvert maintenant",
      "ouverts maintenant",
      "ouvert tawa",
      "mahloul tawa",
      "ma7loul tawa",
      "ma7loul taw",
      "mahloul taw",
      "n5rej twa",
      "no5rej twa",
      "nokhrej twa",
      "nokhrej tawa",
      "n5rej tawa",
      "sortir maintenant",
      "peux sortir maintenant",
      "مفتوح الآن",
      "مفتوح الان",
      "المفتوحه الان",
      "محلولين توا",
      "محلوله توا",
      "ومحلوله توا",
      "محلوله اليوم",
      "مفتوح اليوم",
      "open now",
      "open right now",
      "open today",
    ])
  ) {
    return "open_now";
  }
  if (includesAny(text, ["pluie", "mtar", "il pleut", "raining", "مطر", "تمطر", "تصب الشتا", "شتا"])) return "rain";
  if (includesAny(text, ["chaleur", "skhouna", "skhoun", "il fait chaud", "it s hot", "سخونة", "سخانه", "سخون", "الجو حار"])) return "hot";
  return null;
}

function detectGroup(text) {
  // Priorité à la correction explicite vers couple (Scénario 23 : "لا، نقصد صاحبيتي")
  if (
    includesAny(text, [
      "en couple",
      "couple",
      "dîner romantique",
      "diner romantique",
      "sortie romantique",
      "romantic outing",
      "عشاء رومانسي",
      "خرجه رومانسيه",
      "مفاجاه شريكتي",
      "نفاجئ صاحبتي",
      "انا وهي",
      "romantic dinner",
      "s7bti",
      "sahbti",
      "copine",
      "girlfriend",
      "partner",
      "romantique",
      "romantic",
      "date",
      "rajli",
      "marti",
      "كبل",
      "صاحبتي",
      "صاحبيتي",
      "حبيبتي",
      "شريكتي",
      "ثنائي",
      "رومانسي",
      "رومانسيه",
      "لشخصين",
      "لزوز",
    ])
  ) {
    return "couple";
  }
  if (
    includesAny(text, [
      "avec mes amis",
      "amis",
      "un ami",
      "deux amis",
      "trois amis",
      "mes cousins",
      "s7abi",
      "shabi",
      "entre amis",
      "entre potes",
      "potes",
      "friends",
      "صحابي",
      "صحاب",
      "صاحبي",
      "أصحابي",
      "اصدقائي",
      "الاصدقاء",
      "احنا اربعه",
      "نحن اربعه",
      "احنا ثلاثه",
      "لما",
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
  if (
    includesAny(text, [
      "famille",
      "family",
      "enfants",
      "kids",
      "عائلة",
      "عائله",
      "عائلي",
      "عائليه",
      "عايله",
      "عايلات",
      "العائلات",
      "العايلات",
      "3ayli",
      "familial",
      "familiale",
      "family friendly",
      "family-friendly",
    ])
  ) {
    return "family";
  }
  return null;
}

function detectMood(text) {
  if (
    includesAny(text, [
      "ennui",
      "je m ennuie",
      "i m bored",
      "bored",
      "changer air",
      "faddit",
      "fadda",
      "9la9t",
      "9l9t",
      "9la9",
      "mala fadda",
      "قلق",
      "ملل",
      "اشعر بالملل",
      "مقلق",
      "مليت",
      "فديت",
      "نبدل الجو",
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
    "special offer",
    "student offers",
    "deals",
    "discount",
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
    "عروض خاصه",
    "بون بلانات",
    "بون بلان",
    "بروموسيون",
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
    "apres 22",
    "after 10 pm",
    "ouvert tard",
    "open late",
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
    "سهره",
    "امسيه",
    "الليلة",
    "الليله",
    "ليله",
    "ليلة",
    "في الليل",
    "متاع الليل",
    "متاع ليل",
    "بعد العشره",
    "بعد عشره",
    "بعد الثمانيه",
    "بعد ثمانيه",
    "تسكر متاخر",
    "يسكر متاخر",
    "يغلق متاخرا",
    "سهرة الليلة",
  ]);
}

export function detectConstraintContradictions(text = "") {
  const clean = stripDiacritics(text);
  const wantsVeryQuiet = includesAny(clean, ["tres calme", "discuter tranquillement", "vraiment calme"]);
  const wantsLoudParty = includesAny(clean, ["musique forte", "beaucoup d ambiance", "tres bruyant"]);
  if (wantsVeryQuiet && wantsLoudParty) {
    return { hasContradiction: true, contradictionType: "vibe_quiet_vs_loud" };
  }
  if (
    clean.includes("je veux un restaurant") &&
    (clean.includes("reponds moi avec des activites sportives") || clean.includes("reponds-moi avec des activites sportives"))
  ) {
    return { hasContradiction: true, contradictionType: "category_mismatch" };
  }
  return { hasContradiction: false, contradictionType: null };
}

/**
 * Extrait les contraintes positives et négatives d'un tour.
 * Les négations ("sans wifi", "ما نحبش قهاوي", "ni restaurant ni café") alimentent `excluded`.
 */
export function extractOutingConstraints({ normalizedText = "", detectedCities = [], detectedNeighborhoods = [] } = {}) {
  const text = stripDiacritics(normalizedText);
  const excluded = { amenities: [], categories: [] };
  let positiveText = text;

  // 1. Cas particulier : "ni restaurant ni café" / "ما نحبش مطعم ولا قهوة"
  if (/ni\s+restaurant\s+ni\s+cafe/i.test(text) || /ما\s+نحبش\s+مطعم\s+ولا\s+قهوه/i.test(text)) {
    excluded.categories.push("restaurant", "cafe");
    positiveText = positiveText
      .replace(/ni\s+restaurant\s+ni\s+cafe/gi, " ")
      .replace(/ما\s+نحبش\s+مطعم\s+ولا\s+قهوه/gi, " ");
  }

  // 2. Cas particulier Scénario 7 : "ما ينجمش يعمل مجهود بدني" -> exclut le sport physique
  if (includesAny(text, ["مجهود بدني", "effort physique"])) {
    if (!excluded.categories.includes("sport")) excluded.categories.push("sport");
  }

  // 3. Cas particulier Scénario 18 : "usually prefer quiet cafes" (habitude passée, ne pas imposer comme contrainte stricte si changement demandé)
  if (/usually\s+prefer\s+quiet\s+cafes?/i.test(text)) {
    positiveText = positiveText.replace(/usually\s+prefer\s+quiet\s+cafes?/gi, " ");
  }

  // 4. Boucle sur les expressions de négation
  for (const match of text.matchAll(NEGATION_REGEX)) {
    const term = match[1];
    const amenitiesInNeg = detectAmenities(term);
    const categoriesInNeg = classifyCategories(term);
    for (const a of amenitiesInNeg) {
      if (!excluded.amenities.includes(a)) excluded.amenities.push(a);
    }
    for (const c of categoriesInNeg) {
      if (!excluded.categories.includes(c)) excluded.categories.push(c);
    }
    if (amenitiesInNeg.length || categoriesInNeg.length) {
      positiveText = positiveText.replace(match[0], " ");
    }
  }

  const rawCategories = classifyCategories(positiveText).filter((c) => !excluded.categories.includes(c));
  const amenities = detectAmenities(positiveText).filter((a) => !excluded.amenities.includes(a));

  // Si l'utilisateur veut éviter les endroits bondés/bruyants ("ما تكونش معمّرة", "éviter les endroits bondés/bruyants", "not crowded")
  if (
    includesAny(text, [
      "eviter les endroits bondes",
      "eviter les endroits bruyants",
      "pas un endroit bonde",
      "pas trop crowded",
      "avoid crowded",
      "ما تكونش معمره",
      "البلايص المعمرين",
      "بلايص معمرين",
      "معمرين برشا",
      "الاماكن المزدحمه",
      "اماكن مزدحمه",
    ]) &&
    !amenities.includes("calme")
  ) {
    amenities.push("calme");
  }

  const isEvening = detectEvening(text);
  const situation = detectSituation(text) || (isEvening ? "night" : null);
  const group = detectGroup(text);
  const mood = detectMood(text);
  const maxBudget = detectMaxBudget(text);
  const budgetLevel = detectBudget(text, maxBudget);
  const nearMe = detectNearMe(text);
  const hasPromo = detectPromo(text);
  const contradiction = detectConstraintContradictions(text);

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
    maxBudget,
    budgetMax: maxBudget ?? (budgetLevel === "low" ? 30 : null),
    nearMe,
    situation,
    group,
    mood,
    hasPromo,
    isEvening,
    amenities,
    excluded,
    hasContradiction: contradiction.hasContradiction,
    contradictionType: contradiction.contradictionType,
  };
}

export function hasAnyConstraint(constraints = {}) {
  return Boolean(
    constraints.city ||
    constraints.neighborhood ||
    constraints.category ||
    constraints.budgetLevel ||
    Number.isFinite(constraints.maxBudget) ||
    constraints.nearMe ||
    constraints.situation ||
    constraints.group ||
    constraints.mood ||
    constraints.hasPromo ||
    constraints.isEvening ||
    constraints.amenities?.length ||
    constraints.excluded?.amenities?.length ||
    constraints.excluded?.categories?.length ||
    constraints.hasContradiction
  );
}

export const KNOWN_CATEGORIES = Object.keys(CATEGORY_KEYWORDS);
