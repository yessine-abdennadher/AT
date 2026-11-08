import { buildActivityQuery } from "./activityQueryBuilder.service.js";
import { rankActivities } from "./activityRanker.service.js";

const RELAXATION_STEPS = Object.freeze(["neighborhood", "amenities", "city"]);

/**
 * Recherche stricte puis relâchement progressif (équipements, puis ville) si 0 résultat.
 */
export async function findWithRelaxation({ repository, constraints, limit = 5, excludeIds = [] }) {
  const exclude = new Set(excludeIds.map(String));
  const run = async (skip) => {
    const rows = await repository.find(buildActivityQuery(constraints, { skip }), 40);
    return rankActivities(rows.filter((a) => !exclude.has(String(a._id ?? a.id))), constraints).slice(0, limit);
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

