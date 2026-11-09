const union = (a = [], b = []) => [...new Set([...a, ...b])];

/**
 * Deep Merge additif : les scalaires non nuls remplacent, les listes s'unissent,
 * une exclusion retire l'élément correspondant des critères positifs (et inversement).
 */
export function deepMergeConstraints(previous, incoming = {}) {
  const prev = previous || {};
  const inc = incoming || {};
  const excludedAmenities = union(prev.excluded?.amenities, inc.excluded?.amenities);
  const excludedCategories = union(prev.excluded?.categories, inc.excluded?.categories)
    .filter((c) => !(inc.categories || []).includes(c));

  const newAmenities = inc.amenities || [];
  const cleanedExcludedAmenities = excludedAmenities.filter((a) => !newAmenities.includes(a));
  const amenities = union(prev.amenities, newAmenities).filter((a) => !cleanedExcludedAmenities.includes(a));

  let categories = inc.categories?.length
    ? inc.categories.filter((c) => !excludedCategories.includes(c))
    : (prev.categories || []).filter((c) => !excludedCategories.includes(c));

  const group = inc.group || prev.group || null;
  if (inc.group === "couple" && prev.group === "friends") {
    categories = categories.filter((c) => c !== "friends");
    if (!categories.length) categories = ["couple"];
  }

  const neighborhoods = inc.neighborhoods?.length
    ? union(inc.neighborhoods, prev.neighborhoods)
    : (prev.neighborhoods || []);

  const maxBudget = Number.isFinite(inc.maxBudget)
    ? inc.maxBudget
    : Number.isFinite(prev.maxBudget)
    ? prev.maxBudget
    : null;

  const budgetLevel = inc.budgetLevel || prev.budgetLevel || (Number.isFinite(maxBudget) && maxBudget <= 35 ? "low" : null);

  const vibes = union(prev.vibes, inc.vibes);
  const hasVibeConflict = VibesConflict(amenities, vibes);

  return {
    city: inc.city || prev.city || null,
    neighborhood: inc.neighborhood || prev.neighborhood || neighborhoods[0] || null,
    neighborhoods,
    category: categories[0] || null,
    categories,
    budgetLevel,
    maxBudget,
    budgetMax: maxBudget ?? (budgetLevel === "low" ? 30 : null),
    nearMe: Boolean(inc.nearMe || prev.nearMe),
    situation: inc.situation || prev.situation || null,
    group,
    mood: inc.mood || prev.mood || null,
    hasPromo: Boolean(inc.hasPromo || prev.hasPromo),
    isEvening: Boolean(inc.isEvening || prev.isEvening),
    amenities,
    vibes,
    urgency: inc.urgency || prev.urgency || null,
    excluded: { amenities: cleanedExcludedAmenities, categories: excludedCategories },
    hasContradiction: Boolean(inc.hasContradiction || prev.hasContradiction || hasVibeConflict),
    contradictionType: inc.contradictionType || prev.contradictionType || (hasVibeConflict ? "vibe_quiet_vs_loud" : null),
  };
}

function VibesConflict(amenities = [], vibes = []) {
  return amenities.includes("calme") && amenities.includes("music") && vibes.includes("festif");
}

// Store en mémoire (remplaçable par un store Mongo/Redis via l'interface get/set).
export function createInMemoryStateStore({ maxSessions = 5000, ttlMs = 6 * 60 * 60 * 1000 } = {}) {
  const map = new Map();
  const sweep = () => {
    const now = Date.now();
    for (const [key, entry] of map) if (now - entry.at > ttlMs) map.delete(key);
    while (map.size > maxSessions) map.delete(map.keys().next().value);
  };
  return {
    get: async (sessionId) => map.get(sessionId)?.state || null,
    set: async (sessionId, state) => {
      map.set(sessionId, { state, at: Date.now() });
      sweep();
    },
    delete: async (sessionId) => map.delete(sessionId),
  };
}
