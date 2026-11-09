import { buildActivityQuery } from "./activityQueryBuilder.service.js";
import { rankActivities, prioritizeNearby } from "./activityRanker.service.js";

const RELAXATION_STEPS = Object.freeze(["neighborhood", "amenities", "budget", "promo", "city"]);

function isExcludedByCategory(activity, excludedCategories = []) {
  if (!excludedCategories.length) return false;
  const cat = String(activity.category || "").toLowerCase();
  const type = String(activity.type || "").toLowerCase();
  const name = String(activity.name || activity.title || "").toLowerCase();
  for (const ex of excludedCategories) {
    const e = String(ex).toLowerCase();
    if (cat === e || type === e) return true;
    if (e === "cafe" && (name.includes("café") || name.includes("cafe") || name.includes("coffee"))) return true;
    if (e === "restaurant" && (name.includes("restaurant") || name.includes("resto") || name.includes("pizzeria"))) return true;
    if (e === "plage" && (name.includes("plage") || name.includes("beach") || cat === "plage")) return true;
    if (e === "sport" && (cat === "sport" || name.includes("karting") || name.includes("fitness"))) return true;
  }
  return false;
}

/**
 * Recherche stricte puis relâchement progressif (quartier, équipements, budget, puis ville) si 0 résultat.
 * `userCoords` (optionnel) alimente le bonus de proximité quand `constraints.nearMe` est actif.
 */
export async function findWithRelaxation({ repository, constraints, limit = 5, excludeIds = [], userCoords = null }) {
  const exclude = new Set(excludeIds.map(String));
  const excludedCats = constraints.excluded?.categories || [];
  const run = async (skip) => {
    const rows = await repository.find(buildActivityQuery(constraints, { skip }), 40);
    const filtered = rows.filter(
      (a) => !exclude.has(String(a._id ?? a.id)) && !isExcludedByCategory(a, excludedCats)
    );
    const ranked = rankActivities(filtered, constraints, { userCoords });
    const ordered = constraints.nearMe ? prioritizeNearby(ranked, userCoords) : ranked;
    return ordered.slice(0, limit);
  };

  let activities = await run([]);
  if (activities.length) return { activities, relaxed: [] };

  const skip = [];
  for (const step of RELAXATION_STEPS) {
    skip.push(step);
    activities = await run([...skip]);
    if (activities.length) return { activities, relaxed: [...skip] };
  }
  return { activities: [], relaxed: [...skip] };
}
