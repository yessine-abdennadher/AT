import mongoose from "mongoose";
import { Activity } from "../models/Activity.js";
import { Review } from "../models/Review.js";
import { createNotification } from "./notification.service.js";
import { MAX_REACTIONS_PER_REVIEW } from "../constants/review.js";

export { MAX_REACTIONS_PER_REVIEW };
const SUPPORTED_REACTIONS = ["like", "love", "haha", "wow", "sad", "angry"];

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
    { $match: { activity: new mongoose.Types.ObjectId(activityId) } },
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
  const activity = await Activity.findById(activityId);
  if (!activity) {
    const error = new Error("Activité introuvable.");
    error.statusCode = 404;
    throw error;
  }
  const reviews = await Review.find({ activity: activityId }).sort({ createdAt: -1 });
  return { reviews, averageRating: activity.rating || 4.5, reviewsCount: activity.reviewsCount || reviews.length };
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
  const activity = await Activity.findById(activityId);
  if (!activity) {
    const error = new Error("Activité introuvable.");
    error.statusCode = 404;
    throw error;
  }
  const user = await User.findById(userAuth.id);
  const userName = user ? user.name : (userAuth.name || "Utilisateur");
  const userAvatar = user ? user.avatar : (userAuth.avatar || "");
  await Review.create({ activity: activityId, user: userAuth.id, userName, userAvatar, rating: numRating, comment: comment.trim(), reactions: [] });
  const { rating: updatedRating, reviewsCount } = await recalculateActivityRating(activityId);
  const reviews = await Review.find({ activity: activityId }).sort({ createdAt: -1 });
  try {
    await createNotification({
      recipient: activity.createdBy || activity.partnerId || null,
      targetRole: activity.createdBy ? "all" : "partner",
      category: "offers_reviews", type: "review_received",
      title: {
        ar: `⭐ تقييم جديد (${numRating}/5) لنشاط «${activity.name}»!`,
        fr: `⭐ Nouvel avis (${numRating}/5) sur « ${activity.name} » !`,
        en: `⭐ New review (${numRating}/5) for "${activity.name}"!`,
      },
      description: {
        ar: `${userName}: «${comment.trim().slice(0, 90)}»`,
        fr: `${userName} a écrit : « ${comment.trim().slice(0, 90)} »`,
        en: `${userName} wrote: "${comment.trim().slice(0, 90)}"`,
      },
      icon: "star", color: "#F59E0B", badgeLabel: `AVIS ${numRating}/5`,
      ctaText: { ar: "عرض النشاط والتقييم", fr: "Voir l'avis", en: "View review" },
      ctaIcon: "chatbubbles-outline", actionType: "activity", activityId: activity._id,
    });
  } catch (notifErr) {
    console.warn("Échec création notification avis:", notifErr.message);
  }
  return { reviews, averageRating: updatedRating, reviewsCount };
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
  await review.save();
  const { rating: updatedRating, reviewsCount } = await recalculateActivityRating(activityId);
  const reviews = await Review.find({ activity: activityId }).sort({ createdAt: -1 });
  return { reviews, averageRating: updatedRating, reviewsCount };
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
  const { rating: updatedRating, reviewsCount } = await recalculateActivityRating(activityId);
  const reviews = await Review.find({ activity: activityId }).sort({ createdAt: -1 });
  return { reviews, averageRating: updatedRating, reviewsCount };
};

export const reactToReview = async (activityId, reviewId, reactionType, userAuth) => {
  const review = await Review.findOne({ _id: reviewId, activity: activityId });
  if (!review) {
    const error = new Error("Avis introuvable.");
    error.statusCode = 404;
    throw error;
  }
  const userId = userAuth._id || userAuth.id || userAuth;
  const updatedReview = await Review.findOneAndUpdate(
    { _id: reviewId, activity: activityId },
    buildReactionTogglePipeline({ userId: new mongoose.Types.ObjectId(userId), type: reactionType, userName: userAuth.name || "Utilisateur", userAvatar: userAuth.avatar || "" }),
    { new: true }
  );
  const persistedReaction = updatedReview.reactions.find((reaction) => reaction.user.toString() === userId.toString());
  const reviews = await Review.find({ activity: activityId }).sort({ createdAt: -1 });
  return {
    reviewId,
    userReaction: persistedReaction?.type || null,
    reactionsCount: updatedReview.reactions.length,
    reactions: updatedReview.reactions,
    reviews,
  };
};
