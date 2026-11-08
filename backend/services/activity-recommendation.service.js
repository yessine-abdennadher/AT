import { Activity } from "../models/Activity.js";
import "../models/User.js";
import { escapeRegex } from "./activity.utils.js";

export const getRecommendationWindow = ({ page = 1, limit = 20 } = {}) => {
  const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 20));
  return { page: pageNum, limit: limitNum, candidateLimit: limitNum * 10 };
};

export const getStableSurpriseScore = (id) => {
  let hash = 0;
  for (const character of String(id)) hash = (Math.imul(hash, 31) + character.charCodeAt(0)) | 0;
  return Math.abs(hash) % 5;
};

export const buildRecommendationQuery = (filters = {}) => {
  const query = { isApproved: true };
  if (typeof filters.city === "string" && filters.city.trim()) {
    query.city = { $regex: escapeRegex(filters.city), $options: "i" };
  }
  const possibleMatches = [];
  if (filters.category) possibleMatches.push({ category: filters.category });
  if (filters.type) possibleMatches.push({ type: filters.type });
  if (filters.budgetMax !== undefined && Number.isFinite(Number(filters.budgetMax))) {
    possibleMatches.push({ price: { $lte: Number(filters.budgetMax) } });
  } else if (filters.budget) {
    possibleMatches.push({ $or: [{ priceTag: filters.budget }, { badge: filters.budget }] });
  }
  if (filters.durationMin !== undefined || filters.durationMax !== undefined) {
    const duration = {};
    if (Number.isFinite(Number(filters.durationMin))) duration.$gte = Number(filters.durationMin);
    if (Number.isFinite(Number(filters.durationMax))) duration.$lte = Number(filters.durationMax);
    if (Object.keys(duration).length) possibleMatches.push({ durationMinutes: duration });
  } else if (filters.duration) possibleMatches.push({ duration: filters.duration });
  if (filters.distanceMax !== undefined && Number.isFinite(Number(filters.distanceMax))) {
    possibleMatches.push({ distanceKm: { $lte: Number(filters.distanceMax) } });
  } else if (filters.distance) possibleMatches.push({ distance: filters.distance });
  if (filters.group) possibleMatches.push({ suitableFor: filters.group });
  if (filters.situation === "powercut") possibleMatches.push({ $or: [{ hasPowerBackup: true }, { isIndoor: false }] });
  if (filters.situation === "hot") possibleMatches.push({ $or: [{ hasAirConditioning: true }, { category: "outdoor" }] });
  if (filters.situation === "rain") possibleMatches.push({ isIndoor: true });
  if (filters.situation === "open_now") possibleMatches.push({ isOpenNow: { $ne: false } });
  if (filters.hasPromo) possibleMatches.push({ "promotion.isPromo": true });
  if (filters.situation === "night" || filters.isEvening) {
    possibleMatches.push({
      $or: [
        { "events.0": { $exists: true } },
        { "promotion.isPromo": true },
        { closingTime: { $gte: "21:00" } },
      ],
    });
  }
  if (possibleMatches.length) query.$and = [{ $or: possibleMatches }];
  return query;
};

/** Rank only a bounded candidate set; ordering is deterministic for equal scores. */
export const getRecommendations = async (filters = {}, sortBy = "rating", pagination = {}) => {
  const { page, limit, candidateLimit } = getRecommendationWindow(pagination);
  const activities = await Activity.find(buildRecommendationQuery(filters))
    .populate("createdBy", "name role establishmentName")
    .sort({ rating: -1, _id: 1 })
    .limit(candidateLimit)
    .lean();

  const scoredActivities = activities
    .map((activity) => {
      let score = 0;
      if (filters.type && activity.type === filters.type) score += 6;
      if (filters.category && activity.category === filters.category) score += 4;
      if (filters.budgetMax !== undefined && activity.price !== undefined) {
        if (activity.price <= Number(filters.budgetMax)) score += 4;
      } else if (filters.budget && (activity.priceTag === filters.budget || activity.badge === filters.budget)) score += 3;
      if (filters.durationMin !== undefined || filters.durationMax !== undefined) {
        const minutes = activity.durationMinutes ?? 90;
        const minOk = filters.durationMin === undefined || minutes >= Number(filters.durationMin);
        const maxOk = filters.durationMax === undefined || minutes <= Number(filters.durationMax);
        if (minOk && maxOk) score += 3;
      } else if (filters.duration && activity.duration === filters.duration) score += 2;
      if (filters.distanceMax !== undefined && activity.distanceKm !== undefined) {
        if (activity.distanceKm <= Number(filters.distanceMax)) score += 3;
      } else if (filters.distance && (activity.distance === filters.distance || `${activity.distanceKm} km` === filters.distance)) score += 2;
      if (filters.group && Array.isArray(activity.suitableFor) && activity.suitableFor.includes(filters.group)) score += 3;
      if (filters.situation) {
        switch (filters.situation) {
          case "powercut": score += activity.hasPowerBackup || !activity.isIndoor ? 5 : -10; break;
          case "hot": if (activity.hasAirConditioning || activity.category === "outdoor") score += 4; break;
          case "rain": score += activity.isIndoor ? 5 : -8; break;
          case "open_now": if (activity.isOpenNow !== false) score += 4; break;
          case "night": if (activity.events?.length || activity.promotion?.isPromo) score += 6; break;
          case "surprise_me": score += getStableSurpriseScore(activity._id); break;
        }
      }
      if (filters.hasPromo && activity.promotion?.isPromo) score += 8;
      if (filters.isEvening && (activity.events?.length || activity.promotion?.isPromo)) score += 6;
      return { activity, score };
    })
    .filter(({ score }) => score > 0 || Object.keys(filters).length === 0 || Boolean(filters.city))
    .sort((a, b) => {
      let order;
      if (sortBy === "price") order = (a.activity.price ?? 0) - (b.activity.price ?? 0);
      else if (sortBy === "distance") order = (a.activity.distanceKm ?? 0) - (b.activity.distanceKm ?? 0);
      else order = b.score - a.score || (b.activity.rating ?? 0) - (a.activity.rating ?? 0);
      return order || String(a.activity._id).localeCompare(String(b.activity._id));
    })
    .map(({ activity, score }) => ({ ...activity, matchScore: score }));

  const offset = (page - 1) * limit;
  return {
    activities: scoredActivities.slice(offset, offset + limit),
    page,
    limit,
    hasMore: scoredActivities.length > offset + limit || activities.length === candidateLimit,
  };
};
