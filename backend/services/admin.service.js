import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Activity } from "../models/Activity.js";
import { Review } from "../models/Review.js";
import { createNotification } from "./notification.service.js";
import { ActivityApprovalAudit } from "../models/ActivityApprovalAudit.js";
import { AdminSecurityAudit } from "../models/AdminSecurityAudit.js";

const writeSecurityAudit = async ({ actorId, targetId, targetType = "user", action, previousValue, newValue, request = {} }) => {
  if (!actorId) return null;
  await AdminSecurityAudit.create({
    actorId,
    targetId,
    targetType,
    action,
    previousValue,
    newValue,
    ipAddress: String(request.ip || "").slice(0, 64),
    userAgent: String(request.userAgent || "").slice(0, 512),
  });
};

export const recordAdminSecurityAudit = writeSecurityAudit;

export const getAdminSecurityAudit = async ({ page = 1, limit = 50 } = {}) => {
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 50));
  const [entries, total] = await Promise.all([
    AdminSecurityAudit.find().sort({ createdAt: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit).lean(),
    AdminSecurityAudit.countDocuments(),
  ]);
  return { entries, total, page: safePage, totalPages: Math.ceil(total / safeLimit) };
};

export const validateApprovalInput = (isApproved) => {
  if (typeof isApproved !== "boolean") {
    const error = new Error("Le statut d'approbation doit être un booléen.");
    error.statusCode = 400;
    throw error;
  }
  return isApproved;
};

/**
 * Calculer les KPI globaux de la plateforme en temps réel
 */
export const getPlatformStats = async () => {
  const [
    totalUsers,
    totalPartners,
    totalAdmins,
    totalActivities,
    pendingActivities,
    totalReviews,
    activitiesByCity,
  ] = await Promise.all([
    User.countDocuments({ role: "user" }),
    User.countDocuments({ role: "partner" }),
    User.countDocuments({ role: "admin" }),
    Activity.countDocuments(),
    Activity.countDocuments({ isApproved: false }),
    Review.countDocuments({ status: { $in: ["approved", null] } }),
    Activity.aggregate([
      { $group: { _id: "$city", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  return {
    users: {
      total: totalUsers + totalPartners + totalAdmins,
      regularUsers: totalUsers,
      partners: totalPartners,
      admins: totalAdmins,
    },
    activities: {
      total: totalActivities,
      pendingApproval: pendingActivities,
      byCity: activitiesByCity.map((c) => ({ city: c._id || "Inconnu", count: c.count })),
    },
    reviews: {
      total: totalReviews,
    },
  };
};

/**
 * Obtenir la liste paginée des utilisateurs avec filtres et recherche
 */
export const getUsersList = async ({
  role,
  status,
  search,
  page = 1,
  limit = 20,
}) => {
  const query = {};

  if (role && ["user", "partner", "admin"].includes(role)) {
    query.role = role;
  }

  if (status !== undefined && status !== "") {
    query.isActive = status === "true" || status === true;
  }

  if (search && search.trim()) {
    const safeRegex = search.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    query.$or = [
      { name: { $regex: safeRegex, $options: "i" } },
      { email: { $regex: safeRegex, $options: "i" } },
      { establishmentName: { $regex: safeRegex, $options: "i" } },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [total, users] = await Promise.all([
    User.countDocuments(query),
    User.find(query)
      .select("-password -refreshTokens")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
  ]);

  return {
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
    users,
  };
};

/**
 * Activer ou suspendre un utilisateur (avec protection anti-auto-suspension)
 */
export const updateUserStatus = async (targetUserId, isActive, adminUserId, request) => {
  if (typeof isActive !== "boolean") {
    const error = new Error("Le statut du compte doit être un booléen.");
    error.statusCode = 400;
    throw error;
  }
  if (targetUserId.toString() === adminUserId.toString()) {
    const error = new Error("Impossible de modifier le statut de votre propre compte administrateur.");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(targetUserId).select("+refreshTokens +activeAccessSessionIds");
  if (!user) {
    const error = new Error("Utilisateur introuvable.");
    error.statusCode = 404;
    throw error;
  }

  if (user.role === "admin" && user.isActive && !isActive) {
    const activeAdminCount = await User.countDocuments({ role: "admin", isActive: true });
    if (activeAdminCount <= 1) {
      const error = new Error("Impossible de suspendre le dernier compte administrateur actif.");
      error.statusCode = 409;
      throw error;
    }
  }

  const previousValue = user.isActive;
  user.isActive = isActive;
  user.refreshTokens = [];
  user.activeAccessSessionIds = [];
  await user.save();
  await writeSecurityAudit({ actorId: adminUserId, targetId: user._id, action: "user.status.changed", previousValue, newValue: isActive, request });

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    isActive: user.isActive,
  };
};

/**
 * Mettre à jour le rôle d'un utilisateur
 */
export const updateUserRole = async (targetUserId, newRole, adminUserId, request) => {
  if (targetUserId.toString() === adminUserId.toString()) {
    const error = new Error("Impossible de modifier le rôle de votre propre compte administrateur.");
    error.statusCode = 400;
    throw error;
  }

  if (!["user", "partner", "admin"].includes(newRole)) {
    const error = new Error("Rôle invalide. Les rôles autorisés sont : user, partner, admin.");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(targetUserId).select("+refreshTokens +activeAccessSessionIds");
  if (!user) {
    const error = new Error("Utilisateur introuvable.");
    error.statusCode = 404;
    throw error;
  }

  if (user.role === "admin" && newRole !== "admin") {
    const activeAdminCount = await User.countDocuments({ role: "admin", isActive: true });
    if (user.isActive && activeAdminCount <= 1) {
      const error = new Error("Impossible de retirer le rôle du dernier compte administrateur actif.");
      error.statusCode = 409;
      throw error;
    }
  }

  const previousValue = user.role;
  user.role = newRole;
  user.refreshTokens = [];
  user.activeAccessSessionIds = [];
  await user.save();
  await writeSecurityAudit({ actorId: adminUserId, targetId: user._id, action: "user.role.changed", previousValue, newValue: newRole, request });

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
};

/**
 * Liste de toutes les activités pour modération
 */
export const getAdminActivities = async ({
  status,
  city,
  category,
  page = 1,
  limit = 20,
}) => {
  const query = {};

  if (status === "pending") query.isApproved = false;
  if (status === "approved") query.isApproved = true;
  if (city) query.city = { $regex: new RegExp(`^${city}$`, "i") };
  if (category) query.category = category;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [total, activities] = await Promise.all([
    Activity.countDocuments(query),
    Activity.find(query)
      .populate("createdBy", "name email role establishmentName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
  ]);

  return {
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
    activities,
  };
};

/**
 * Valider / Approuver ou désapprouver une activité
 */
export const toggleActivityApproval = async (activityId, isApprovedInput, actorUserId) => {
  const isApproved = validateApprovalInput(isApprovedInput);
  if (!actorUserId) {
    const error = new Error("L'administrateur authentifié est obligatoire pour tracer cette action.");
    error.statusCode = 400;
    throw error;
  }

  const session = await mongoose.startSession();
  let activity;
  let transitioned = false;
  try {
    await session.withTransaction(async () => {
      activity = await Activity.findById(activityId).session(session);
      if (!activity) {
        const error = new Error("Activité introuvable.");
        error.statusCode = 404;
        throw error;
      }
      const previousState = Boolean(activity.isApproved);
      if (previousState === isApproved) return;
      activity.isApproved = isApproved;
      await activity.save({ session });
      await ActivityApprovalAudit.create([{
        activity: activity._id,
        actor: actorUserId,
        previousState,
        nextState: isApproved,
      }], { session });
      transitioned = true;
    });
  } finally {
    await session.endSession();
  }

  if (!activity) {
    const error = new Error("Activité introuvable.");
    error.statusCode = 404;
    throw error;
  }

  if (transitioned && activity.isApproved) {
    try {
      await createNotification({
        recipient: activity.createdBy || activity.partnerId || null,
        targetRole: activity.createdBy ? "all" : "partner",
        category: "management",
        type: "approval",
        title: {
          ar: `🎉 تم اعتماد نشاطكم «${activity.name}» بنجاح!`,
          fr: `🎉 Votre établissement « ${activity.name} » est validé !`,
          en: `🎉 Your venue "${activity.name}" is approved!`,
        },
        description: {
          ar: `وافقت إدارة المنصة على نشر نشاطكم. أصبح الآن متاحاً لجميع مستخدمي ActivityTN.`,
          fr: `Votre fiche établissement a été approuvée par l'administration et est désormais visible.`,
          en: `Your listing has been approved by admin and is now live for all visitors.`,
        },
        icon: "checkmark-circle",
        color: "#10B981",
        badgeLabel: "APPROUVÉ ✅",
        ctaText: {
          ar: "عرض النشاط المباشر",
          fr: "Voir ma fiche",
          en: "View listing",
        },
        ctaIcon: "eye-outline",
        actionType: "activity",
        activityId: activity._id,
      });
    } catch (e) {
      console.warn("Échec notif approval:", e.message);
    }
  }

  return activity;
};

/**
 * Mettre en avant (Featured) ou marquer populaire
 */
export const toggleActivityHighlight = async (activityId, field, actorId, request) => {
  if (!["isFeatured", "isPopular"].includes(field)) {
    const error = new Error("Champ invalide. Seuls isFeatured et isPopular sont autorisés.");
    error.statusCode = 400;
    throw error;
  }

  const activity = await Activity.findById(activityId);
  if (!activity) {
    const error = new Error("Activité introuvable.");
    error.statusCode = 404;
    throw error;
  }

  const previousValue = activity[field];
  activity[field] = !activity[field];
  await activity.save();
  await writeSecurityAudit({ actorId, targetId: activity._id, targetType: "activity", action: "activity.highlight.changed", previousValue: { [field]: previousValue }, newValue: { [field]: activity[field] }, request });
  return activity;
};

/**
 * Suppression administrative définitive d'une activité
 */
export const deleteActivityByAdmin = async (activityId, actorId, request) => {
  const activity = await Activity.findById(activityId);
  if (!activity) {
    const error = new Error("Activité introuvable.");
    error.statusCode = 404;
    throw error;
  }

  await Promise.all([
    Activity.findByIdAndDelete(activityId),
    Review.deleteMany({ activity: activityId }),
  ]);
  await writeSecurityAudit({ actorId, targetId: activity._id, targetType: "activity", action: "activity.deleted", previousValue: { name: activity.name, isApproved: activity.isApproved }, newValue: { deleted: true }, request });

  return true;
};

/**
 * Modifier le niveau / tier d'un partenaire (standard ou pro)
 */
export const updatePartnerTier = async (userId, tier, actorId, request) => {
  if (!["standard", "pro", "premium"].includes(tier)) {
    const error = new Error("Tier invalide. Valeurs autorisées : standard, pro, premium");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("Partenaire introuvable.");
    error.statusCode = 404;
    throw error;
  }

  if (user.role !== "partner") {
    const error = new Error("Le compte cible n’est pas un partenaire.");
    error.statusCode = 400;
    throw error;
  }
  const previousValue = user.partnerTier;
  user.partnerTier = tier;
  await user.save();
  await writeSecurityAudit({ actorId, targetId: user._id, action: "partner.tier.changed", previousValue, newValue: tier, request });
  return user;
};

/**
 * Récupérer les données de diagnostic et d'activité des partenaires
 */
export const getPlatformDiagnostics = async () => {
  const { getTelemetryStats } = await import("./telemetry.service.js");
  const { getElectricityAlertStatus } = await import("./systemSetting.service.js");
  const [telemetry, electricityAlertActive] = await Promise.all([
    getTelemetryStats(),
    getElectricityAlertStatus(),
  ]);

  const partners = await User.find({ role: "partner" }).select(
    "name email establishmentName partnerTier requestedTier requestedBillingCycle subscriptionStatus subscriptionStartedAt subscriptionExpiresAt lastLogin lastActivityUpdate createdAt city phone isActive"
  );

  const now = new Date();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

  const partnersStatus = await Promise.all(
    partners.map(async (p) => {
      const activities = await Activity.find({ createdBy: p._id })
        .select("name category price rating isApproved isFeatured isPopular promotion events openingHours address imageUrl")
        .lean();

      const activityCount = activities.length;
      const isInactive = !p.lastLogin || (now.getTime() - new Date(p.lastLogin).getTime() > sevenDaysMs);
      const hasStaleData =
        !p.lastActivityUpdate || (now.getTime() - new Date(p.lastActivityUpdate).getTime() > fourteenDaysMs);

      // Extraire toutes les offres promotionnelles avec leur expiration
      const offers = [];
      activities.forEach((act) => {
        if (act.promotion && (act.promotion.isPromo || act.promotion.discountPercent > 0 || act.promotion.promoLabel)) {
          offers.push({
            activityId: act._id ? act._id.toString() : "",
            activityName: act.name,
            promoLabel: act.promotion.promoLabel || "Promotion spéciale",
            discountPercent: act.promotion.discountPercent || 0,
            targetItem: act.promotion.targetItem || "",
            promoType: act.promotion.promoType || "all",
            validUntil: act.promotion.validUntil || "",
          });
        }
      });

      return {
        id: p._id.toString(),
        name: p.name,
        email: p.email,
        establishmentName: p.establishmentName || p.name,
        partnerTier: p.partnerTier || "standard",
        requestedTier: p.requestedTier || "standard",
        requestedBillingCycle: p.requestedBillingCycle || "monthly",
        subscriptionStatus: p.subscriptionStatus || (p.partnerTier === "premium" || p.partnerTier === "pro" ? "active" : "none"),
        subscriptionStartedAt: p.subscriptionStartedAt || p.createdAt,
        subscriptionExpiresAt: p.subscriptionExpiresAt || null,
        lastLogin: p.lastLogin,
        lastActivityUpdate: p.lastActivityUpdate,
        createdAt: p.createdAt,
        activityCount,
        isInactive,
        hasStaleData,
        city: p.city,
        phone: p.phone,
        isActive: p.isActive,
        activities: activities.map((a) => ({
          id: a._id ? a._id.toString() : "",
          name: a.name,
          category: a.category,
          price: a.price,
          rating: a.rating,
          isApproved: a.isApproved,
          isFeatured: a.isFeatured,
          isPopular: a.isPopular,
          openingHours: a.openingHours,
          promotion: a.promotion,
          eventsCount: Array.isArray(a.events) ? a.events.length : 0,
        })),
        offers,
      };
    })
  );

  return {
    telemetry,
    partnersStatus,
    electricityAlertActive,
  };
};

/**
 * Activer ou désactiver le mode alerte coupure d'électricité au niveau de la plateforme (Admin)
 */
export const updateGlobalElectricityMode = async (active, adminId) => {
  const { setElectricityAlertStatus } = await import("./systemSetting.service.js");
  const status = await setElectricityAlertStatus(active, adminId);
  return status;
};


