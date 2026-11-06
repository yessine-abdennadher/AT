const esc = (v) => String(v).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const rx = (v) => new RegExp(esc(v), "i");

const CATEGORY_ALIASES = Object.freeze({
  cafe: ["cafe", "café", "coffee", "salon de thé"],
  restaurant: ["restaurant", "resto"],
  plage: ["plage", "beach"],
  parc: ["parc", "park", "jardin", "nature"],
  gaming: ["gaming", "jeux", "game"],
  sport: ["sport", "fitness", "gym"],
  culture: ["culture", "musée", "cinéma", "théâtre"],
  "bien-etre": ["bien-être", "bien-etre", "spa", "wellness"],
});

const categoryRegex = (category) => new RegExp((CATEGORY_ALIASES[category] || [category]).map(esc).join("|"), "i");

function amenityClause(amenity) {
  switch (amenity) {
    case "climatisation": return { $or: [{ hasAirConditioning: true }, { amenities: rx("clim") }] };
    case "power_backup": return { $or: [{ hasPowerBackup: true }, { amenities: rx("backup|electrog|générateur") }] };
    default: return { amenities: rx(amenity.replace("_", " ")) };
  }
}

/**
 * Transforme les contraintes actives en filtre MongoDB. `skip` permet de relâcher des critères.
 */
export function buildActivityQuery(constraints = {}, { skip = [] } = {}) {
  const and = [];
  if (constraints.categories?.length && !skip.includes("category")) {
    and.push({ category: { $in: constraints.categories.map(categoryRegex) } });
  }
  if (constraints.city && !skip.includes("city")) {
    const cityRx = rx(constraints.city);
    and.push({ $or: [{ city: cityRx }, { locationName: cityRx }, { address: cityRx }] });
  }
  if (!skip.includes("amenities")) {
    for (const amenity of constraints.amenities || []) and.push(amenityClause(amenity));
  }
  for (const category of constraints.excluded?.categories || []) {
    and.push({ category: { $not: categoryRegex(category) } });
  }
  return and.length ? { $and: and } : {};
}

