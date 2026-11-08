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

  const categories = inc.categories?.length ? inc.categories : (prev.categories || []).filter((c) => !excludedCategories.includes(c));

  const neighborhoods = union(prev.neighborhoods, inc.neighborhoods);

  return {
    city: inc.city || prev.city || null,
    neighborhood: inc.neighborhood || prev.neighborhood || neighborhoods[0] || null,
    neighborhoods,
    category: categories[0] || null,
    categories,
    budgetLevel: inc.budgetLevel || prev.budgetLevel || null,
    situation: inc.situation || prev.situation || null,
    group: inc.group || prev.group || null,
    mood: inc.mood || prev.mood || null,
    amenities,
    vibes: union(prev.vibes, inc.vibes),
    urgency: inc.urgency || prev.urgency || null,
    excluded: { amenities: cleanedExcludedAmenities, categories: excludedCategories },
  };
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

