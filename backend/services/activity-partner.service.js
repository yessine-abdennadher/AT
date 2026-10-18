import { Activity } from "../models/Activity.js";
import { User } from "../models/User.js";
import { createNotification } from "./notification.service.js";

/** List a partner's activities and account-level activity statistics. */
export const getActivitiesByCreator = async (userId) => {
  const activities = await Activity.find({ createdBy: userId })
    .populate("createdBy", "name role establishmentName phone")
    .sort({ createdAt: -1 })
    .lean();
  const total = activities.length;
  const approved = activities.filter((activity) => activity.isApproved).length;
  const pending = activities.filter((activity) => !activity.isApproved).length;
  const totalReviews = activities.reduce((sum, activity) => sum + (activity.reviewsCount || 0), 0);
  const averageRating = total
    ? Number((activities.reduce((sum, activity) => sum + (activity.rating || 4.5), 0) / total).toFixed(1))
    : 5.0;
  return { activities, stats: { total, approved, pending, totalReviews, averageRating } };
};

/** Manage a promotion owned by a Pro/Premium partner. */
export const updateActivityPromotion = async (activityId, userId, promoData) => {
  const activity = await Activity.findById(activityId);
  if (!activity) {
    const error = new Error("Activité introuvable.");
    error.statusCode = 404;
    throw error;
  }
  if (activity.createdBy?.toString() !== userId.toString()) {
    const error = new Error("Accès refusé : vous n'êtes pas le propriétaire de cet établissement.");
    error.statusCode = 403;
    throw error;
  }
  const creator = await User.findById(userId);
  if (!creator || !["pro", "premium"].includes(creator.partnerTier)) {
    const error = new Error("Fonctionnalité réservée aux Partenaires Pro ou Premium : contactez l'administration.");
    error.statusCode = 403;
    throw error;
  }
  activity.promotion = {
    isPromo: Boolean(promoData.isPromo),
    promoType: promoData.promoType === "item" ? "item" : "all",
    discountPercent: Number(promoData.discountPercent) || 0,
    targetItem: promoData.targetItem || "",
    promoLabel: promoData.promoLabel || "",
    validUntil: promoData.validUntil || "",
  };
  await activity.save();
  await User.findByIdAndUpdate(userId, { lastActivityUpdate: new Date() });
  if (activity.promotion.isPromo) {
    try {
      await createNotification({
        recipient: null,
        targetRole: "user",
        category: "offers_reviews",
        type: "promo",
        title: {
          ar: `🔥 تخفيض حصري ${activity.promotion.discountPercent}% لدى «${activity.name}»!`,
          fr: `🔥 Promo -${activity.promotion.discountPercent}% chez « ${activity.name} » !`,
          en: `🔥 -${activity.promotion.discountPercent}% Promo at "${activity.name}"!`,
        },
        description: {
          ar: `عرض خاص: ${activity.promotion.promoLabel || "تخفيض فوري"}. احجز مباشرة عبر ActivityTN.`,
          fr: `Offre spéciale : ${activity.promotion.promoLabel || "Remise immédiate"}. Réservez directement !`,
          en: `Special deal: ${activity.promotion.promoLabel || "Instant discount"}. Book directly now!`,
        },
        icon: "pricetag",
        color: "#EF4444",
        badgeLabel: `PROMO -${activity.promotion.discountPercent}%`,
        ctaText: { ar: "عرض العرض الترويجي", fr: "Voir l'offre", en: "View deal" },
        ctaIcon: "sparkles",
        actionType: "activity",
        activityId: activity._id,
      });
    } catch (error) {
      console.warn("Échec notif promo:", error.message);
    }
  }
  return activity;
};

/** Add an event owned by a Pro/Premium partner. */
export const addActivityEvent = async (activityId, userId, eventData) => {
  const activity = await Activity.findById(activityId);
  if (!activity) {
    const error = new Error("Activité introuvable.");
    error.statusCode = 404;
    throw error;
  }
  if (activity.createdBy?.toString() !== userId.toString()) {
    const error = new Error("Accès refusé : vous n'êtes pas le propriétaire de cet établissement.");
    error.statusCode = 403;
    throw error;
  }
  const creator = await User.findById(userId);
  if (!creator || !["pro", "premium"].includes(creator.partnerTier)) {
    const error = new Error("Fonctionnalité réservée aux Partenaires Premium ou Pro : contactez l'administration pour activer l'option.");
    error.statusCode = 403;
    throw error;
  }
  if (!eventData.title) {
    const error = new Error("Le titre de l'événement est obligatoire.");
    error.statusCode = 400;
    throw error;
  }
  activity.events.push({
    title: eventData.title,
    image: eventData.image || "",
    date: eventData.date || "",
    time: eventData.time || "",
    description: eventData.description || "",
    category: eventData.category || "music",
    price: Number(eventData.price) || 0,
  });
  await activity.save();
  await User.findByIdAndUpdate(userId, { lastActivityUpdate: new Date() });
  try {
    await createNotification({
      recipient: null,
      targetRole: "user",
      category: "offers_reviews",
      type: "event",
      title: {
        ar: `🎶 سهرة وحدث جديد: «${eventData.title}» لدى «${activity.name}»!`,
        fr: `🎶 Événement live : « ${eventData.title} » chez « ${activity.name} » !`,
        en: `🎶 Live Event: "${eventData.title}" at "${activity.name}"!`,
      },
      description: {
        ar: `موعدكم يوم ${eventData.date || "القريب"} الساعة ${eventData.time || "المساء"}. سارع بالحجز!`,
        fr: `Rendez-vous le ${eventData.date || "ce soir"} à ${eventData.time || "21:00"}. Réservez votre place !`,
        en: `Join on ${eventData.date || "tonight"} at ${eventData.time || "21:00"}. Book your spot!`,
      },
      icon: "musical-notes",
      color: "#8B5CF6",
      badgeLabel: "ÉVÉNEMENT",
      ctaText: { ar: "تفاصيل وحجز", fr: "Voir l'événement", en: "View event" },
      ctaIcon: "calendar-outline",
      actionType: "activity",
      activityId: activity._id,
    });
  } catch (error) {
    console.warn("Échec notif event:", error.message);
  }
  return activity;
};
