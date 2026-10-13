import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Activity } from "../models/Activity.js";
import { Review } from "../models/Review.js";
import { createNotification } from "./notification.service.js";

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
    Review.countDocuments(),
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
export const updateUserStatus = async (targetUserId, isActive, adminUserId) => {
  if (targetUserId.toString() === adminUserId.toString()) {
    const error = new Error("Impossible de modifier le statut de votre propre compte administrateur.");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(targetUserId);
  if (!user) {
    const error = new Error("Utilisateur introuvable.");
    error.statusCode = 404;
    throw error;
  }

  user.isActive = Boolean(isActive);
  await user.save();

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
export const updateUserRole = async (targetUserId, newRole, adminUserId) => {
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

  const user = await User.findById(targetUserId);
  if (!user) {
    const error = new Error("Utilisateur introuvable.");
    error.statusCode = 404;
    throw error;
  }

  user.role = newRole;
  await user.save();

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
export const toggleActivityApproval = async (activityId, isApproved) => {
  const activity = await Activity.findById(activityId);
  if (!activity) {
    const error = new Error("Activité introuvable.");
    error.statusCode = 404;
    throw error;
  }

  activity.isApproved = Boolean(isApproved);
  await activity.save();

  if (activity.isApproved) {
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
export const toggleActivityHighlight = async (activityId, field) => {
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

  activity[field] = !activity[field];
  await activity.save();
  return activity;
};

/**
 * Suppression administrative définitive d'une activité
 */
export const deleteActivityByAdmin = async (activityId) => {
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

  return true;
};

/**
 * Modifier le niveau / tier d'un partenaire (standard ou pro)
 */
export const updatePartnerTier = async (userId, tier) => {
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

  user.partnerTier = tier;
  await user.save();
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
    "name email establishmentName partnerTier lastLogin lastActivityUpdate createdAt city phone"
  );

  const now = new Date();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

  const partnersStatus = await Promise.all(
    partners.map(async (p) => {
      const activityCount = await Activity.countDocuments({ createdBy: p._id });
      const isInactive = !p.lastLogin || (now.getTime() - new Date(p.lastLogin).getTime() > sevenDaysMs);
      const hasStaleData =
        !p.lastActivityUpdate || (now.getTime() - new Date(p.lastActivityUpdate).getTime() > fourteenDaysMs);

      return {
        id: p._id,
        name: p.name,
        email: p.email,
        establishmentName: p.establishmentName || p.name,
        partnerTier: p.partnerTier || "standard",
        lastLogin: p.lastLogin,
        lastActivityUpdate: p.lastActivityUpdate,
        activityCount,
        isInactive,
        hasStaleData,
        city: p.city,
        phone: p.phone,
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


