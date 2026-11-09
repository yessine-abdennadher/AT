const toMinutes = (hhmm) => {
  const match = /^(\d{1,2}):(\d{2})/.exec(String(hhmm || ""));
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

export function isOpenNow(activity, now = new Date()) {
  const open = toMinutes(activity.openingTime);
  const close = toMinutes(activity.closingTime);
  if (open === null || close === null) return null;
  const current = now.getHours() * 60 + now.getMinutes();
  return open <= close ? current >= open && current < close : current >= open || current < close;
}

/** Rayon de proximité par défaut (km) pour `nearMe`. */
export const NEAR_ME_RADIUS_KM = 5;

const EARTH_RADIUS_KM = 6371;
const toRad = (deg) => (deg * Math.PI) / 180;

/** Normalise des coordonnées { latitude, longitude } | { lat, lng } | { lat, lon }. */
export function normalizeCoords(coords) {
  if (!coords || typeof coords !== "object") return null;
  const latitude = Number(coords.latitude ?? coords.lat);
  const longitude = Number(coords.longitude ?? coords.lng ?? coords.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude };
}

/** Distance Haversine en km entre deux points, ou null si une coordonnée est invalide. */
export function haversineKm(a, b) {
  const p1 = normalizeCoords(a);
  const p2 = normalizeCoords(b);
  if (!p1 || !p2) return null;
  const dLat = toRad(p2.latitude - p1.latitude);
  const dLon = toRad(p2.longitude - p1.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(p1.latitude)) * Math.cos(toRad(p2.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function distanceFromUserKm(activity, userCoords) {
  return haversineKm(userCoords, activity?.coordinates);
}

/**
 * Score composite (échelle "note" 0-5 : la note moyenne sert de base, les bonus/malus s'y ajoutent).
 */
export function scoreActivity(activity, constraints = {}, { now = new Date(), userCoords = null } = {}) {
  let score = Number(activity.rating) || 0;
  if (activity.promotion) score += 0.6;
  const amenities = (activity.amenities || []).map((a) => String(a).toLowerCase());
  for (const wanted of constraints.amenities || []) {
    if (amenities.some((a) => a.includes(wanted.replace("_", " ")))) score += 0.5;
  }

  // Ouverture immédiate (situation "open_now" ou urgence "now") : lieu fermé fortement pénalisé.
  const wantsOpenNow = constraints.urgency === "now" || constraints.situation === "open_now";
  const open = wantsOpenNow ? isOpenNow(activity, now) : null;
  if (wantsOpenNow && open === false) score -= 3;
  else if (constraints.situation === "open_now" && open === true) score += 1;

  // Audience : bonus si le type de groupe demandé correspond à l'établissement.
  if (constraints.group) {
    const suitable = (activity.suitableFor || []).map((s) => String(s).toLowerCase());
    if (suitable.includes(String(constraints.group).toLowerCase())) score += 1;
  }

  const price = Number(activity.price);
  if (Number.isFinite(price) && price > 0) {
    if (Number.isFinite(constraints.maxBudget)) score += price <= constraints.maxBudget ? 0.8 : -1.5;
    else if (constraints.budgetLevel === "low") score += price <= 30 ? 0.8 : -0.4;
    if (constraints.budgetLevel === "high") score += price >= 80 ? 0.5 : 0;
  }

  // Proximité : bonus dégressif jusqu'au rayon `nearMe`.
  if (constraints.nearMe && userCoords) {
    const dist = distanceFromUserKm(activity, userCoords);
    if (dist !== null && dist <= NEAR_ME_RADIUS_KM) score += 1.5 * (1 - dist / NEAR_ME_RADIUS_KM);
  }

  return score;
}

export function rankActivities(activities, constraints, options) {
  return [...activities]
    .map((activity) => ({ activity, score: scoreActivity(activity, constraints, options) }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.activity);
}

/**
 * Pour `nearMe` avec coordonnées : place d'abord les lieux dans le rayon (du plus proche au plus lointain),
 * puis les autres dans leur ordre actuel. Ne retire jamais de résultat (zéro impasse).
 */
export function prioritizeNearby(activities, userCoords, radiusKm = NEAR_ME_RADIUS_KM) {
  if (!normalizeCoords(userCoords)) return activities;
  const withDistance = activities.map((activity, index) => ({ activity, index, dist: distanceFromUserKm(activity, userCoords) }));
  const near = withDistance.filter((x) => x.dist !== null && x.dist <= radiusKm).sort((a, b) => a.dist - b.dist || a.index - b.index);
  const far = withDistance.filter((x) => !(x.dist !== null && x.dist <= radiusKm));
  return [...near, ...far].map((x) => x.activity);
}
