/**
 * chatCardFormatter.service.js
 * Formateur DTO partagé pour convertir les activités Mongoose ou objets en cartes
 * de recommandation riches pour le client (mobile & web).
 */

export function formatActivityCard(activity = {}) {
  if (!activity) return null;

  const id = String(activity._id ?? activity.id ?? "");
  const name = String(activity.name ?? "");
  const category = String(activity.category ?? "");
  const city = String(activity.city ?? "");

  let imageUrl = "";
  if (Array.isArray(activity.photos) && activity.photos.length > 0 && typeof activity.photos[0] === "string") {
    imageUrl = activity.photos[0];
  } else if (typeof activity.imageUrl === "string" && activity.imageUrl.trim()) {
    imageUrl = activity.imageUrl.trim();
  } else if (typeof activity.image === "string" && activity.image.trim()) {
    imageUrl = activity.image.trim();
  }

  let priceLevel = "";
  if (typeof activity.priceTag === "string" && activity.priceTag.trim()) {
    priceLevel = activity.priceTag.trim();
  } else if (activity.price !== undefined && activity.price !== null && Number.isFinite(Number(activity.price))) {
    priceLevel = `${Number(activity.price)} DT`;
  } else if (typeof activity.badge === "string" && activity.badge.trim()) {
    priceLevel = activity.badge.trim();
  }

  const rating =
    activity.rating !== undefined && activity.rating !== null && Number.isFinite(Number(activity.rating))
      ? Number(activity.rating)
      : 4.5;

  const address = typeof activity.address === "string" ? activity.address.trim() : "";
  const amenities = Array.isArray(activity.amenities)
    ? activity.amenities.map(String)
    : [];

  const promotion = activity.promotion?.isPromo
    ? {
        isPromo: true,
        promoLabel: activity.promotion.promoLabel || "",
        discountPercent: activity.promotion.discountPercent || 0,
        targetItem: activity.promotion.targetItem || "",
      }
    : null;

  const events = Array.isArray(activity.events) && activity.events.length > 0
    ? activity.events.map((e) => ({
        title: e.title || "",
        date: e.date || "",
        time: e.time || "",
        category: e.category || "music",
      }))
    : [];

  return {
    id,
    name,
    category,
    city,
    rating,
    imageUrl,
    priceLevel,
    address,
    amenities,
    promotion,
    events,
    matchScore: activity.matchScore ?? 0,
  };
}

export function formatActivityCards(activities = []) {
  if (!Array.isArray(activities)) return [];
  return activities
    .map(formatActivityCard)
    .filter((card) => card && card.id && card.name);
}

