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
    const catClauses = constraints.categories.map((c) => {
      if (c === "cafe") {
        return { $or: [{ type: "cafe" }, { name: rx("café|cafe|coffee|lounge") }, { category: "food" }] };
      }
      if (c === "restaurant") {
        return { $or: [{ type: "restaurant" }, { name: rx("restaurant|resto|pizzeria") }, { category: "food" }] };
      }
      return { category: categoryRegex(c) };
    });
    and.push({ $or: catClauses });
  }
  if (constraints.city && !skip.includes("city")) {
    const cityRx = rx(constraints.city);
    and.push({ $or: [{ city: cityRx }, { locationName: cityRx }, { address: cityRx }] });
  }
  const neighborhood = constraints.neighborhood || (constraints.neighborhoods?.[0]);
  if (neighborhood && !skip.includes("neighborhood")) {
    const neighRx = rx(neighborhood);
    and.push({ $or: [{ address: neighRx }, { locationName: neighRx }, { name: neighRx }, { description: neighRx }] });
  }
  if (!skip.includes("budget")) {
    // Un montant explicite ("moins de 20 dt") prime sur le palier générique "low".
    if (Number.isFinite(constraints.maxBudget) && constraints.maxBudget > 0) {
      and.push({ price: { $lte: constraints.maxBudget } });
    } else if (constraints.budgetLevel === "low") {
      and.push({ price: { $lte: 35 } });
    }
  }
  if ((constraints.situation === "cold" || constraints.situation === "rain") && !skip.includes("situation")) {
    and.push({ $or: [{ isIndoor: true }, { category: { $ne: "outdoor" } }] });
  }
  if (constraints.group && !skip.includes("group")) {
    and.push({
      $or: [
        { suitableFor: constraints.group },
        { category: constraints.group },
        { name: rx(constraints.group) },
        { description: rx(constraints.group) },
      ],
    });
  }
  if (constraints.hasPromo && !skip.includes("promo")) {
    and.push({ "promotion.isPromo": true });
  }
  if (!skip.includes("amenities")) {
    for (const amenity of constraints.amenities || []) and.push(amenityClause(amenity));
  }
  for (const category of constraints.excluded?.categories || []) {
    if (category === "cafe") {
      and.push({
        type: { $not: rx("cafe|café") },
        name: { $not: rx("café|cafe|coffee|salon de thé") },
        category: { $not: categoryRegex("cafe") },
      });
    } else if (category === "restaurant") {
      and.push({
        type: { $not: rx("restaurant|resto") },
        name: { $not: rx("restaurant|resto|pizzeria") },
        category: { $not: categoryRegex("restaurant") },
      });
    } else {
      and.push({
        category: { $not: categoryRegex(category) },
        name: { $not: categoryRegex(category) },
      });
    }
  }
  return and.length ? { $and: and } : {};
}

