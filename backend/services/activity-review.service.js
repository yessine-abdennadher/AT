import mongoose from "mongoose";
import { Activity } from "../models/Activity.js";
import { User } from "../models/User.js";
import { Review } from "../models/Review.js";
import { createNotification } from "./notification.service.js";
import { MAX_REACTIONS_PER_REVIEW } from "../constants/review.js";

export { MAX_REACTIONS_PER_REVIEW };
const SUPPORTED_REACTIONS = ["like", "love", "haha", "wow", "sad", "angry"];
// Reviews created before moderation was introduced remain public.
export const publicReviewFilter = (activityId) => ({ activity: activityId, status: { $in: ["approved", null] } });

export const buildReactionTogglePipeline = ({ userId, type, userName = "Utilisateur", userAvatar = "", now = new Date() }) => {
  const reactionType = SUPPORTED_REACTIONS.includes(type) ? type : "like";
  const newReaction = {
    _id: new mongoose.Types.ObjectId(), user: userId, userName, userAvatar,
    type: reactionType, createdAt: now, updatedAt: now,
  };
  return [{
    $set: {
      reactions: {
        $let: {
          vars: {
            current: { $ifNull: ["$reactions", []] },
            mine: { $filter: { input: { $ifNull: ["$reactions", []] }, as: "reaction", cond: { $eq: ["$$reaction.user", userId] } } },
            newReaction,
          },
          in: {
            $cond: [
              { $gt: [{ $size: "$$mine" }, 0] },
              {
                $cond: [
                  { $eq: [{ $arrayElemAt: ["$$mine.type", 0] }, reactionType] },
                  { $filter: { input: "$$current", as: "reaction", cond: { $ne: ["$$reaction.user", userId] } } },
                  { $map: { input: "$$current", as: "reaction", in: { $cond: [{ $eq: ["$$reaction.user", userId] }, { $mergeObjects: ["$$reaction", { type: reactionType, userName, userAvatar, updatedAt: now }] }, "$$reaction"] } } },
                ],
              },
              { $cond: [{ $lt: [{ $size: "$$current" }, MAX_REACTIONS_PER_REVIEW] }, { $concatArrays: ["$$current", ["$$newReaction"]] }, "$$current"] },
            ],
          },
        },
      },
    },
  }];
};

const recalculateActivityRating = async (activityId) => {
  const stats = await Review.aggregate([
    { $match: publicReviewFilter(new mongoose.Types.ObjectId(activityId)) },
    { $group: { _id: "$activity", reviewsCount: { $sum: 1 }, averageRating: { $avg: "$rating" } } },
  ]);
  if (stats.length > 0) {
    const reviewsCount = stats[0].reviewsCount;
    const rating = Number(stats[0].averageRating.toFixed(1));
    await Activity.findByIdAndUpdate(activityId, { rating, reviewsCount });
    return { rating, reviewsCount };
  }
  await Activity.findByIdAndUpdate(activityId, { rating: 0, reviewsCount: 0 });
  return { rating: 0, reviewsCount: 0 };
};

export const getReviews = async (activityId) => {
  const activity = await Activity.findOne({ _id: activityId, isApproved: true });
  if (!activity) {
    const error = new Error("Activité introuvable.");
    error.statusCode = 404;
    throw error;
  }
  const reviews = await Review.find(publicReviewFilter(activityId)).sort({ createdAt: -1 });
  const averageRating = reviews.length ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)) : 0;
  return { reviews, averageRating, reviewsCount: reviews.length };
};

export const addReview = async (activityId, { rating, comment }, userAuth) => {
  const numRating = Number(rating);
  if (!numRating || numRating < 1 || numRating > 5) {
    const error = new Error("La note doit être comprise entre 1 et 5 étoiles.");
    error.statusCode = 400;
    throw error;
  }
  if (!comment || comment.trim().length < 3) {
    const error = new Error("Le commentaire doit contenir au moins 3 caractères.");
    error.statusCode = 400;
    throw error;
  }
  const activity = await Activity.findOne({ _id: activityId, isApproved: true });
  if (!activity) {
    const error = new Error("Activité introuvable.");
    error.statusCode = 404;
    throw error;
  }
  const user = await User.findById(userAuth.id);
  const userName = user ? user.name : (userAuth.name || "Utilisateur");
  const userAvatar = user ? user.avatar : (userAuth.avatar || "");
  await Review.create({ activity: activityId, user: userAuth.id, userName, userAvatar, rating: numRating, comment: comment.trim(), status: "pending", reactions: [] });
  const { reviews, averageRating, reviewsCount } = await getReviews(activityId);
  try {
    await createNotification({
      recipient: null,
      targetRole: "admin",
      category: "offers_reviews", type: "moderation",
      title: {
        ar: `⭐ تقييم بانتظار المراجعة (${numRating}/5) للنشاط «${activity.name}»`,
        fr: `⭐ Avis à modérer (${numRating}/5) sur « ${activity.name} »`,
        en: `⭐ Review awaiting moderation (${numRating}/5) for "${activity.name}"`,
      },
      description: {
        ar: `${userName}: «${comment.trim().slice(0, 90)}»`,
        fr: `${userName} a écrit : « ${comment.trim().slice(0, 90)} »`,
        en: `${userName} wrote: "${comment.trim().slice(0, 90)}"`,
      },
      icon: "star", color: "#F59E0B", badgeLabel: `AVIS ${numRating}/5`,
      ctaText: { ar: "مراجعة التقييم", fr: "Modérer l'avis", en: "Moderate review" },
      ctaIcon: "chatbubbles-outline", actionType: "admin_dashboard", activityId: activity._id,
    });
  } catch (notifErr) {
    console.warn("Échec création notification avis:", notifErr.message);
  }
  return { reviews, averageRating, reviewsCount, pending: true };
};

export const updateReview = async (activityId, reviewId, { rating, comment }, userAuth) => {
  const review = await Review.findOne({ _id: reviewId, activity: activityId });
  if (!review) {
    const error = new Error("Avis introuvable.");
    error.statusCode = 404;
    throw error;
  }
  if (review.user.toString() !== userAuth.id && userAuth.role !== "admin") {
    const error = new Error("Vous n'avez pas le droit de modifier cet avis.");
    error.statusCode = 403;
    throw error;
  }
  if (rating) {
    const numRating = Number(rating);
    if (numRating >= 1 && numRating <= 5) review.rating = numRating;
  }
  if (comment && comment.trim().length >= 3) review.comment = comment.trim();
  review.status = "pending";
  review.moderatedAt = null;
  review.moderatedBy = null;
  await review.save();
  await recalculateActivityRating(activityId);
  return { ...(await getReviews(activityId)), pending: true };
};

export const deleteReview = async (activityId, reviewId, userAuth) => {
  const review = await Review.findOne({ _id: reviewId, activity: activityId });
  if (!review) {
    const error = new Error("Avis introuvable.");
    error.statusCode = 404;
    throw error;
  }
  if (review.user.toString() !== userAuth.id && userAuth.role !== "admin") {
    const error = new Error("Vous n'avez pas le droit de supprimer cet avis.");
    error.statusCode = 403;
    throw error;
  }
  await review.deleteOne();
  await recalculateActivityRating(activityId);
  return getReviews(activityId);
};

export const reactToReview = async (activityId, reviewId, reactionType, userAuth) => {
  const review = await Review.findOne({ _id: reviewId, ...publicReviewFilter(activityId) });
  if (!review) {
    const error = new Error("Avis introuvable.");
    error.statusCode = 404;
    throw error;
  }
  const userId = userAuth._id || userAuth.id || userAuth;
  const updatedReview = await Review.findOneAndUpdate(
    { _id: reviewId, ...publicReviewFilter(activityId) },
    buildReactionTogglePipeline({ userId: new mongoose.Types.ObjectId(userId), type: reactionType, userName: userAuth.name || "Utilisateur", userAvatar: userAuth.avatar || "" }),
    { new: true }
  );
  const persistedReaction = updatedReview.reactions.find((reaction) => reaction.user.toString() === userId.toString());
  const reviews = await Review.find(publicReviewFilter(activityId)).sort({ createdAt: -1 });
  return {
    reviewId,
    userReaction: persistedReaction?.type || null,
    reactionsCount: updatedReview.reactions.length,
    reactions: updatedReview.reactions,
    reviews,
  };
};

export const getReviewsForModeration = async ({ status = "pending", page = 1, limit = 20 } = {}) => {
  if (!["pending", "approved", "rejected"].includes(status)) {
    const error = new Error("Statut d'avis invalide.");
    error.statusCode = 400;
    throw error;
  }
  const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 20));
  const filter = status === "approved" ? { status: { $in: ["approved", null] } } : { status };
  const [total, reviews] = await Promise.all([
    Review.countDocuments(filter),
    Review.find(filter).populate("activity", "name isApproved").sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
  ]);
  return { reviews: reviews.map((review) => ({ ...review, status: review.status ?? "approved" })), total, page: pageNum, totalPages: Math.ceil(total / limitNum) || 1 };
};

export const moderateReview = async (reviewId, status, moderatorId) => {
  if (!["approved", "rejected"].includes(status)) {
    const error = new Error("Décision de modération invalide.");
    error.statusCode = 400;
    throw error;
  }
  const review = await Review.findOneAndUpdate(
    { _id: reviewId, status: { $ne: status } },
    { $set: { status, moderatedAt: new Date(), moderatedBy: moderatorId } },
    { new: true, runValidators: true }
  );
  if (!review) {
    const existing = await Review.findById(reviewId);
    if (existing) return existing;
    const error = new Error("Avis introuvable.");
    error.statusCode = 404;
    throw error;
  }
  await recalculateActivityRating(review.activity);
  return review;
};
