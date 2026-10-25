import { Activity } from "../models/Activity.js";
import { User } from "../models/User.js";
import { escapeRegex } from "./activity.utils.js";

const buildPublicActivityFilter = ({ type, city, category, search } = {}) => {
  const filter = { isApproved: true };
  if (type) filter.type = type;
  if (city) filter.city = { $regex: escapeRegex(city), $options: "i" };
  if (category) filter.category = category;
  if (search && search.trim()) {
    const searchRegex = new RegExp(escapeRegex(search), "i");
    filter.$or = [
      { name: searchRegex },
      { description: searchRegex },
      { locationName: searchRegex },
      { address: searchRegex },
      { tags: { $in: [searchRegex] } },
    ];
  }
  return filter;
};

const buildPublicActivityQuery = (id) => ({ _id: id, isApproved: true });

const buildActivityCreationData = (data, userId, userRole) => ({
  ...data,
  locationName: data.locationName || data.address || `${data.city || "Tunisie"}`,
  imageUrl: data.imageUrl || data.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
  description: data.description || `Offre proposée par ${data.name || "l'établissement"}`,
  // Every new activity enters moderation; approval is only changed by the dedicated admin flow.
  isApproved: false,
  createdBy: userId,
});

const buildActivityUpdateData = (data) => {
  const { isApproved: _ignoredApproval, createdBy: _ignoredOwner, ...safeData } = data;
  if (!safeData.imageUrl && safeData.image) {
    safeData.imageUrl = safeData.image;
  }
  return safeData;
};

export const getAllActivities = async ({ type, city, category, search, page = 1, limit = 20 }) => {
  const filter = buildPublicActivityFilter({ type, city, category, search });
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;
  const { getElectricityAlertStatus } = await import("./systemSetting.service.js");
  const [total, activities, electricityAlertActive] = await Promise.all([
    Activity.countDocuments(filter),
    Activity.find(filter)
      .populate("createdBy", "name role establishmentName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    getElectricityAlertStatus(),
  ]);
  const totalPages = Math.ceil(total / limitNum) || 1;
  const hasMore = pageNum < totalPages;
  return {
    activities,
    total,
    page: pageNum,
    totalPages,
    hasMore,
    electricityAlertActive,
  };
};

export const getActivityById = async (id) => {
  const activity = await Activity.findOne(buildPublicActivityQuery(id)).populate("createdBy", "name role establishmentName");
  if (!activity) {
    const error = new Error("Activité introuvable.");
    error.statusCode = 404;
    throw error;
  }
  return activity;
};

export const createActivity = async (data, userId, userRole) => {
  return Activity.create(buildActivityCreationData(data, userId, userRole));
};

export const updateActivity = async (id, data, user) => {
  const activity = await Activity.findById(id);
  if (!activity) {
    const error = new Error("Activité introuvable.");
    error.statusCode = 404;
    throw error;
  }
  if (user.role !== "admin" && activity.createdBy?.toString() !== user.id) {
    const error = new Error("Accès refusé : vous ne pouvez modifier que vos propres activités.");
    error.statusCode = 403;
    throw error;
  }
  const updated = await Activity.findByIdAndUpdate(id, buildActivityUpdateData(data), { new: true, runValidators: true });
  if (activity.createdBy) await User.findByIdAndUpdate(activity.createdBy, { lastActivityUpdate: new Date() });
  return updated;
};

export const deleteActivity = async (id, user) => {
  const activity = await Activity.findById(id);
  if (!activity) {
    const error = new Error("Activité introuvable.");
    error.statusCode = 404;
    throw error;
  }
  if (user.role !== "admin" && activity.createdBy?.toString() !== user.id) {
    const error = new Error("Accès refusé : vous ne pouvez supprimer que vos propres activités.");
    error.statusCode = 403;
    throw error;
  }
  await activity.deleteOne();
  return true;
};

// Stable facade for existing controller imports; implementations live by domain.
export {
  buildPublicActivityFilter,
  buildPublicActivityQuery,
  buildActivityCreationData,
  buildActivityUpdateData,
};
export {
  getRecommendations,
  getRecommendationWindow,
  getStableSurpriseScore,
  buildRecommendationQuery,
} from "./activity-recommendation.service.js";
export {
  getReviews,
  addReview,
  updateReview,
  deleteReview,
  reactToReview,
  buildReactionTogglePipeline,
  MAX_REACTIONS_PER_REVIEW,
} from "./activity-review.service.js";
export { toggleActivityFavorite } from "./activity-favorite.service.js";
export {
  getActivitiesByCreator,
  updateActivityPromotion,
  addActivityEvent,
} from "./activity-partner.service.js";
export { updatePowerMode, recordPowerReport } from "./activity-power.service.js";
