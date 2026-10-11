import mongoose from "mongoose";
import { Activity } from "../models/Activity.js";
import { User } from "../models/User.js";
import { Review } from "../models/Review.js";
import { createNotification } from "./notification.service.js";

// Helper: Recalcul de la note moyenne et du nombre d'avis depuis la collection Review
const recalculateActivityRating = async (activityId) => {
  const stats = await Review.aggregate([
    { $match: { activity: new mongoose.Types.ObjectId(activityId) } },
    {
      $group: {
        _id: "$activity",
        reviewsCount: { $sum: 1 },
        averageRating: { $avg: "$rating" },
      },
    },
  ]);

  if (stats.length > 0) {
    const reviewsCount = stats[0].reviewsCount;
    const rating = Number(stats[0].averageRating.toFixed(1));
    await Activity.findByIdAndUpdate(activityId, { rating, reviewsCount });
    return { rating, reviewsCount };
  } else {
    await Activity.findByIdAndUpdate(activityId, { rating: 0, reviewsCount: 0 });
    return { rating: 0, reviewsCount: 0 };
  }
};

// Helper: Échapper les caractères spéciaux Regex pour prévenir les attaques ReDoS
const escapeRegex = (text) => {
  if (typeof text !== "string") return "";
  return text.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

/**
 * Récupérer la liste des activités avec filtres sécurisés et pagination
 */
export const getAllActivities = async ({ type, city, category, search, page = 1, limit = 50 }) => {
  const filter = {};
  if (type) filter.type = type;
  if (city) {
    const safeCity = escapeRegex(city);
    filter.city = { $regex: safeCity, $options: "i" };
  }
  if (category) filter.category = category;
  if (search && search.trim()) {
    const safeSearch = escapeRegex(search);
    const searchRegex = new RegExp(safeSearch, "i");
    filter.$or = [
      { name: searchRegex },
      { description: searchRegex },
      { locationName: searchRegex },
      { address: searchRegex },
      { tags: { $in: [searchRegex] } },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
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

  return {
    activities,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
    electricityAlertActive,
  };
};

/**
 * Récupérer une activité par son ID
 */
export const getActivityById = async (id) => {
  const activity = await Activity.findById(id).populate("createdBy", "name role establishmentName");
  if (!activity) {
    const error = new Error("Activité introuvable.");
    error.statusCode = 404;
    throw error;
  }
  return activity;
};

/**
 * Créer une activité
 */
export const createActivity = async (data, userId) => {
  const activityData = {
    ...data,
    locationName: data.locationName || data.address || `${data.city || "Tunisie"}`,
    imageUrl:
      data.imageUrl ||
      data.image ||
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    description: data.description || `Offre proposée par ${data.name || "l'établissement"}`,
    isApproved: data.isApproved !== undefined ? data.isApproved : true,
    createdBy: userId,
  };
  return Activity.create(activityData);
};

/**
 * Mettre à jour une activité
 */
export const updateActivity = async (id, data, user) => {
  const activity = await Activity.findById(id);
  if (!activity) {
    const error = new Error("Activité introuvable.");
    error.statusCode = 404;
    throw error;
  }

  // Vérification de la propriété si partenaire
  if (user.role !== "admin" && activity.createdBy?.toString() !== user.id) {
    const error = new Error("Accès refusé : vous ne pouvez modifier que vos propres activités.");
    error.statusCode = 403;
    throw error;
  }

  const updated = await Activity.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

  if (activity.createdBy) {
    await User.findByIdAndUpdate(activity.createdBy, { lastActivityUpdate: new Date() });
  }

  return updated;
};

/**
 * Modifier le mode électricité / lumière garantie en direct
 */
export const updatePowerMode = async (activityId, userId, powerBackupMode) => {
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

  activity.powerBackupMode = Boolean(powerBackupMode);
  await activity.save();
  await User.findByIdAndUpdate(userId, { lastActivityUpdate: new Date() });
  return activity;
};

/**
 * Enregistrer un signalement communautaire (simple utilisateur) sur l'état réel de la lumière / coupure
 */
export const recordPowerReport = async (activityId, userId, hasPower) => {
  const activity = await Activity.findById(activityId);
  if (!activity) {
    const error = new Error("Activité introuvable.");
    error.statusCode = 404;
    throw error;
  }

  activity.powerReports = activity.powerReports || { yesVotes: 0, noVotes: 0, reports: [] };
  activity.powerReports.reports = activity.powerReports.reports || [];

  const existingIndex = activity.powerReports.reports.findIndex(
    (r) => r.user?.toString() === userId.toString()
  );
  const boolVal = Boolean(hasPower);
  let userVote = boolVal ? "yes" : "no";

  if (existingIndex > -1) {
    if (activity.powerReports.reports[existingIndex].hasPower === boolVal) {
      // Annulation du vote si re-cliqué sur la même option
      activity.powerReports.reports.splice(existingIndex, 1);
      userVote = null;
    } else {
      // Changement d'avis (ex: de non à oui)
      activity.powerReports.reports[existingIndex].hasPower = boolVal;
      activity.powerReports.reports[existingIndex].reportedAt = new Date();
    }
  } else {
    // Nouveau vote
    activity.powerReports.reports.push({
      user: userId,
      hasPower: boolVal,
      reportedAt: new Date(),
    });
  }

  const yesCount = activity.powerReports.reports.filter((r) => r.hasPower === true).length;
  const noCount = activity.powerReports.reports.filter((r) => r.hasPower === false).length;

  activity.powerReports.yesVotes = yesCount;
  activity.powerReports.noVotes = noCount;
  activity.powerReports.lastReportAt = new Date();
  activity.powerReports.lastReportStatus = userVote ? (boolVal ? "light_on" : "light_off") : null;

  await activity.save();

  // Si signalement de coupure ou rétablissement de courant
  try {
    if (!boolVal && noCount > 0) {
      await createNotification({
        recipient: activity.createdBy || null,
        targetRole: activity.createdBy ? "all" : "partner",
        category: "alerts",
        type: "power_alert",
        title: {
          ar: `🔌 تنبيه انقطاع تيار لدى «${activity.name}»`,
          fr: `🔌 Coupure signalée chez « ${activity.name} » (${noCount} votes)`,
          en: `🔌 Power Outage reported at "${activity.name}" (${noCount} votes)`,
        },
        description: {
          ar: `أبلغ زوار عن انقطاع تيار كهربائي (${noCount} بلاغات). يرجى تأكيد تشغيل المولد الاحتياطي.`,
          fr: `Des visiteurs signalent une coupure (${noCount} signalements). Vérifiez l'état du générateur.`,
          en: `Visitors reported a power outage (${noCount} reports). Check generator backup.`,
        },
        icon: "flash",
        color: "#EF4444",
        badgeLabel: "ALERTE ÉLEC",
        ctaText: {
          ar: "التحقق من النشاط",
          fr: "Vérifier l'état",
          en: "Check status",
        },
        ctaIcon: "bulb-outline",
        actionType: "activity",
        activityId: activity._id,
      });
    } else if (boolVal && yesCount > 0) {
      await createNotification({
        recipient: null,
        targetRole: "user",
        category: "alerts",
        type: "power_alert",
        title: {
          ar: `💡 إنارة مؤكدة لدى «${activity.name}»`,
          fr: `💡 Électricité confirmée chez « ${activity.name} »`,
          en: `💡 Power confirmed active at "${activity.name}"`,
        },
        description: {
          ar: `أكد الزوار توفر الكهرباء والإنارة بشكل طبيعي. استمتع بأوقاتك!`,
          fr: `Les visiteurs confirment que l'électricité fonctionne parfaitement.`,
          en: `Guests confirmed electricity and lighting are working seamlessly.`,
        },
        icon: "bulb",
        color: "#EAB308",
        badgeLabel: "LUMIÈRE 💡",
        ctaText: {
          ar: "عرض النشاط",
          fr: "Découvrir l'activité",
          en: "Discover activity",
        },
        ctaIcon: "navigate-outline",
        actionType: "activity",
        activityId: activity._id,
      });
    }
  } catch (e) {
    console.warn("Échec notif power report:", e.message);
  }

  return {
    yesVotes: yesCount,
    noVotes: noCount,
    lastReportAt: activity.powerReports.lastReportAt,
    lastReportStatus: activity.powerReports.lastReportStatus,
    userVote,
  };
};

/**
 * Mettre à jour une promotion (Exclusif Partenaire Pro)
 */
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
  if (!creator || creator.partnerTier !== "pro") {
    const error = new Error("Fonctionnalité réservée aux Partenaires Pro : contactez l'administration pour passer Pro.");
    error.statusCode = 403;
    throw error;
  }

  activity.promotion = {
    isPromo: Boolean(promoData.isPromo),
    discountPercent: Number(promoData.discountPercent) || 0,
    promoLabel: promoData.promoLabel || "",
    validUntil: promoData.validUntil || "",
  };

  await activity.save();
  await User.findByIdAndUpdate(userId, { lastActivityUpdate: new Date() });

  // Création d'une notification push/in-app pour les utilisateurs
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
        ctaText: {
          ar: "عرض العرض الترويجي",
          fr: "Voir l'offre",
          en: "View deal",
        },
        ctaIcon: "sparkles",
        actionType: "activity",
        activityId: activity._id,
      });
    } catch (e) {
      console.warn("Échec notif promo:", e.message);
    }
  }

  return activity;
};

/**
 * Ajouter un événement (Exclusif Partenaire Pro)
 */
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
  if (!creator || creator.partnerTier !== "pro") {
    const error = new Error("Fonctionnalité réservée aux Partenaires Pro : contactez l'administration pour passer Pro.");
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
    date: eventData.date || "",
    time: eventData.time || "",
    description: eventData.description || "",
    category: eventData.category || "music",
    price: Number(eventData.price) || 0,
  });

  await activity.save();
  await User.findByIdAndUpdate(userId, { lastActivityUpdate: new Date() });

  // Création d'une notification événement pour les utilisateurs
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
      ctaText: {
        ar: "تفاصيل وحجز",
        fr: "Voir l'événement",
        en: "View event",
      },
      ctaIcon: "calendar-outline",
      actionType: "activity",
      activityId: activity._id,
    });
  } catch (e) {
    console.warn("Échec notif event:", e.message);
  }

  return activity;
};

/**
 * Supprimer une activité
 */
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

/**
 * Algorithme de Recommandations intelligentes
 */
export const getRecommendations = async (filters = {}, sortBy = "rating") => {
  const activities = await Activity.find({})
    .populate("createdBy", "name role establishmentName")
    .lean();

  const scoredActivities = activities
    .map((activity) => {
      let score = 0;

      // Step 1 — Catégorie
      if (filters.category && activity.category === filters.category) score += 4;

      // Step 2 — Budget
      if (filters.budgetMax !== undefined && activity.price !== undefined) {
        if (activity.price <= Number(filters.budgetMax)) score += 4;
      } else if (filters.budget && (activity.priceTag === filters.budget || activity.badge === filters.budget)) {
        score += 3;
      }

      // Step 3 — Durée
      if (filters.durationMin !== undefined || filters.durationMax !== undefined) {
        const mins = activity.durationMinutes ?? 90;
        const minOk = filters.durationMin === undefined || mins >= Number(filters.durationMin);
        const maxOk = filters.durationMax === undefined || mins <= Number(filters.durationMax);
        if (minOk && maxOk) score += 3;
      } else if (filters.duration && activity.duration === filters.duration) {
        score += 2;
      }

      // Step 4 — Distance
      if (filters.distanceMax !== undefined && activity.distanceKm !== undefined) {
        if (activity.distanceKm <= Number(filters.distanceMax)) score += 3;
      } else if (filters.distance && (activity.distance === filters.distance || `${activity.distanceKm} km` === filters.distance)) {
        score += 2;
      }

      // Step 5 — Groupe & SuitableFor
      if (filters.group && Array.isArray(activity.suitableFor) && activity.suitableFor.includes(filters.group)) {
        score += 3;
      }

      // Step 6 — Situation (Contexte réel)
      if (filters.situation) {
        switch (filters.situation) {
          case "powercut":
            if (activity.hasPowerBackup || !activity.isIndoor) score += 5;
            else score -= 10;
            break;
          case "hot":
            if (activity.hasAirConditioning || activity.category === "outdoor") score += 4;
            break;
          case "rain":
            if (activity.isIndoor) score += 5;
            else score -= 8;
            break;
          case "open_now":
            if (activity.isOpenNow !== false) score += 4;
            break;
          case "surprise_me":
            score += Math.floor(Math.random() * 5);
            break;
        }
      }

      return { activity, score };
    })
    .filter((item) => item.score > 0 || Object.keys(filters).length === 0)
    .sort((a, b) => {
      if (sortBy === "price") return (a.activity.price ?? 0) - (b.activity.price ?? 0);
      if (sortBy === "distance") return (a.activity.distanceKm ?? 0) - (b.activity.distanceKm ?? 0);
      return b.score - a.score || (b.activity.rating ?? 0) - (a.activity.rating ?? 0);
    })
    .map((item) => ({
      ...item.activity,
      matchScore: item.score,
    }));

  return scoredActivities;
};

/**
 * Toggle Favori sur une activité
 */
export const toggleActivityFavorite = async (activityId, userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("Utilisateur introuvable.");
    error.statusCode = 404;
    throw error;
  }

  const strFavorites = (user.favorites || []).map((f) => f.toString());
  const isAlreadyFavorite = strFavorites.includes(activityId);

  if (isAlreadyFavorite) {
    user.favorites = user.favorites.filter((f) => f.toString() !== activityId);
  } else {
    user.favorites.push(activityId);
  }

  await user.save({ validateBeforeSave: false });

  return {
    isFavorite: !isAlreadyFavorite,
    favorites: user.favorites.map((f) => f.toString()),
  };
};

/**
 * Récupérer tous les avis d'une activité depuis la collection Review
 */
export const getReviews = async (activityId) => {
  const activity = await Activity.findById(activityId);
  if (!activity) {
    const error = new Error("Activité introuvable.");
    error.statusCode = 404;
    throw error;
  }

  const reviews = await Review.find({ activity: activityId }).sort({ createdAt: -1 });

  return {
    reviews,
    averageRating: activity.rating || 4.5,
    reviewsCount: activity.reviewsCount || reviews.length,
  };
};

/**
 * Ajouter un avis dans la collection Review
 */
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

  await Review.create({
    activity: activityId,
    user: userAuth.id,
    userName,
    userAvatar,
    rating: numRating,
    comment: comment.trim(),
    reactions: [],
  });

  const { rating: updatedRating, reviewsCount } = await recalculateActivityRating(activityId);
  const reviews = await Review.find({ activity: activityId }).sort({ createdAt: -1 });

  // Création dynamique d'une notification pour le responsable de l'activité / partenaires
  try {
    await createNotification({
      recipient: activity.createdBy || activity.partnerId || null,
      targetRole: activity.createdBy ? "all" : "partner",
      category: "offers_reviews",
      type: "review_received",
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
      icon: "star",
      color: "#F59E0B",
      badgeLabel: `AVIS ${numRating}/5`,
      ctaText: {
        ar: "عرض النشاط والتقييم",
        fr: "Voir l'avis",
        en: "View review",
      },
      ctaIcon: "chatbubbles-outline",
      actionType: "activity",
      activityId: activity._id,
    });
  } catch (notifErr) {
    console.warn("Échec création notification avis:", notifErr.message);
  }

  return {
    reviews,
    averageRating: updatedRating,
    reviewsCount,
  };
};

/**
 * Mettre à jour un avis dans la collection Review
 */
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
  if (comment && comment.trim().length >= 3) {
    review.comment = comment.trim();
  }

  await review.save();
  const { rating: updatedRating, reviewsCount } = await recalculateActivityRating(activityId);
  const reviews = await Review.find({ activity: activityId }).sort({ createdAt: -1 });

  return {
    reviews,
    averageRating: updatedRating,
    reviewsCount,
  };
};

/**
 * Supprimer un avis de la collection Review
 */
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

  return {
    reviews,
    averageRating: updatedRating,
    reviewsCount,
  };
};

/**
 * Réagir à un avis (Facebook reaction) sur la collection Review
 */
export const reactToReview = async (activityId, reviewId, reactionType, userAuth) => {
  const validTypes = ["like", "love", "haha", "wow", "sad", "angry"];
  const type = validTypes.includes(reactionType) ? reactionType : "like";

  const review = await Review.findOne({ _id: reviewId, activity: activityId });
  if (!review) {
    const error = new Error("Avis introuvable.");
    error.statusCode = 404;
    throw error;
  }

  review.reactions = review.reactions || [];
  const userIdStr = userAuth._id ? userAuth._id.toString() : userAuth.id ? userAuth.id.toString() : String(userAuth);
  const existingIndex = review.reactions.findIndex(
    (r) => r.user && r.user.toString() === userIdStr
  );

  let userReaction = null;

  if (existingIndex > -1) {
    if (review.reactions[existingIndex].type === type) {
      // Toggle OFF
      review.reactions.splice(existingIndex, 1);
    } else {
      // Switch reaction type
      review.reactions[existingIndex].type = type;
      if (userAuth.name) review.reactions[existingIndex].userName = userAuth.name;
      if (userAuth.avatar) review.reactions[existingIndex].userAvatar = userAuth.avatar;
      userReaction = type;
    }
  } else {
    // New reaction
    review.reactions.push({
      user: userIdStr,
      userName: userAuth.name || "Utilisateur",
      userAvatar: userAuth.avatar || "",
      type,
    });
    userReaction = type;
  }

  await review.save();
  const reviews = await Review.find({ activity: activityId }).sort({ createdAt: -1 });

  return {
    reviewId,
    userReaction,
    reactionsCount: review.reactions.length,
    reactions: review.reactions,
    reviews,
  };
};

/**
 * Récupérer toutes les activités créées par un partenaire avec statistiques
 */
export const getActivitiesByCreator = async (userId) => {
  const activities = await Activity.find({ createdBy: userId })
    .populate("createdBy", "name role establishmentName phone")
    .sort({ createdAt: -1 })
    .lean();

  const total = activities.length;
  const approved = activities.filter((a) => a.isApproved).length;
  const pending = activities.filter((a) => !a.isApproved).length;
  const totalReviews = activities.reduce((acc, curr) => acc + (curr.reviewsCount || 0), 0);
  const avgRatingCalc =
    total > 0
      ? Number((activities.reduce((acc, curr) => acc + (curr.rating || 4.5), 0) / total).toFixed(1))
      : 5.0;

  return {
    activities,
    stats: {
      total,
      approved,
      pending,
      totalReviews,
      averageRating: avgRatingCalc,
    },
  };
};

