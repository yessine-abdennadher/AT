import { stripDiacritics, includesAny } from "../../shared/textUtils.js";
import { CATEGORY_KEYWORDS, classifyCategories } from "../classification/chatActivityCategoryClassifier.service.js";

const AMENITY_KEYWORDS = Object.freeze({
  wifi: ["wifi", "internet"],
  climatisation: ["climatisation", "clim"],
  terrasse: ["terrasse", "plein air"],
  power_backup: ["power_backup", "groupe electrogene"],
  vue_mer: ["vue_mer", "vue mer"],
  parking: ["parking"],
});

const NEGATION_REGEX = /(?:sans|pas de|pas d|no|pas)\s+([\p{L}\p{N}_]+(?:\s[\p{L}\p{N}_]+)?)/gu;

function detectAmenities(text) {
  return Object.entries(AMENITY_KEYWORDS)
    .filter(([, words]) => includesAny(text, words))
    .map(([amenity]) => amenity);
}

function detectBudget(text) {
  if (text.includes("petit budget") || includesAny(text, ["pas cher", "economique", "cheap"])) return "low";
  if (text.includes("budget eleve") || includesAny(text, ["luxe", "haut de gamme"])) return "high";
  return null;
}

/**
 * Extrait les contraintes positives et négatives d'un tour.
 * Les négations ("sans wifi", "pas de plage") alimentent `excluded`.
 */
export function extractOutingConstraints({ normalizedText = "", detectedCities = [] } = {}) {
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

  const categories = classifyCategories(positiveText).filter((c) => !excluded.categories.includes(c));
  const amenities = detectAmenities(positiveText).filter((a) => !excluded.amenities.includes(a));

  return {
    city: detectedCities[0] || null,
    cities: detectedCities,
    category: categories[0] || null,
    categories,
    budgetLevel: detectBudget(text),
    amenities,
    excluded,
  };
}

export function hasAnyConstraint(constraints = {}) {
  return Boolean(
    constraints.city ||
      constraints.category ||
      constraints.budgetLevel ||
      constraints.amenities?.length ||
      constraints.excluded?.amenities?.length ||
      constraints.excluded?.categories?.length
  );
}

export const KNOWN_CATEGORIES = Object.keys(CATEGORY_KEYWORDS);

