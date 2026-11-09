import { User } from "../models/User.js";
import { recordAdminSecurityAudit } from "./admin-security-audit.service.js";

/**
 * Calcule les métriques d'abonnement pour un partenaire
 */
export function getSubscriptionDetails(user) {
  if (!user || user.role !== "partner") {
    return {
      tier: "standard",
      status: "none",
      daysRemaining: 0,
      isExpiringSoon: false,
    };
  }

  const now = new Date().getTime();
  let daysRemaining = 0;
  let isExpiringSoon = false;

  if (user.subscriptionExpiresAt) {
    const expires = new Date(user.subscriptionExpiresAt).getTime();
    const diff = expires - now;
    daysRemaining = diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
    isExpiringSoon = daysRemaining > 0 && daysRemaining <= 3;
  }

  return {
    tier: user.partnerTier || "standard",
    requestedTier: user.requestedTier || "standard",
    billingCycle: user.requestedBillingCycle || "monthly",
    status: user.subscriptionStatus || "none",
    startedAt: user.subscriptionStartedAt,
    expiresAt: user.subscriptionExpiresAt,
    daysRemaining,
    isExpiringSoon,
  };
}

/**
 * Action Administrateur : Valider, Prolonger ou Rejeter un abonnement
 * @param {string} partnerId ID de l'utilisateur partenaire
 * @param {Object} options { action: 'approve' | 'extend' | 'reject', duration: 'monthly' | 'yearly' | number, tier: string }
 */
export async function updatePartnerSubscription(partnerId, { action, duration, tier }, adminId, request) {
  const user = await User.findById(partnerId);
  if (!user) {
    throw new Error("Partenaire non trouvé");
  }

  if (user.role !== "partner") {
    throw new Error("Cet utilisateur n'est pas un compte partenaire");
  }

  if (!["approve", "extend", "reject"].includes(action)) {
    const error = new Error("Action d’abonnement invalide.");
    error.statusCode = 400;
    throw error;
  }
  if (tier !== undefined && !["standard", "pro", "premium"].includes(tier)) {
    const error = new Error("Niveau d’abonnement invalide.");
    error.statusCode = 400;
    throw error;
  }
  if (action === "extend" && !(duration === "monthly" || duration === "yearly" || (Number.isInteger(duration) && duration >= 1 && duration <= 365))) {
    const error = new Error("La prolongation doit être comprise entre 1 et 365 jours.");
    error.statusCode = 400;
    throw error;
  }
  if (action === "approve" && duration !== undefined && !["monthly", "yearly"].includes(duration)) {
    const error = new Error("La durée d’approbation doit être mensuelle ou annuelle.");
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();
  const previousValue = { partnerTier: user.partnerTier, subscriptionStatus: user.subscriptionStatus, subscriptionExpiresAt: user.subscriptionExpiresAt };

  if (action === "approve") {
    const chosenTier = tier || user.requestedTier || "pro";
    const cycle = duration || user.requestedBillingCycle || "monthly";
    const durationDays = cycle === "yearly" ? 365 : 30;

    user.partnerTier = chosenTier;
    user.subscriptionStatus = "active";
    user.subscriptionStartedAt = now;
    user.subscriptionExpiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    await user.save();
    await recordAdminSecurityAudit({ actorId: adminId, targetId: user._id, action: "partner.subscription.changed", previousValue, newValue: { partnerTier: user.partnerTier, subscriptionStatus: user.subscriptionStatus, subscriptionExpiresAt: user.subscriptionExpiresAt }, request });

    return {
      success: true,
      message: `Abonnement Pack ${chosenTier.toUpperCase()} activé pour ${durationDays} jours.`,
      subscription: getSubscriptionDetails(user),
    };
  }

  if (action === "extend") {
    const daysToAdd = duration === "yearly" ? 365 : duration === "monthly" || duration === undefined ? 30 : duration;
    const baseDate = user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > now
      ? new Date(user.subscriptionExpiresAt)
      : now;

    user.subscriptionExpiresAt = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    user.subscriptionStatus = "active";
    await user.save();
    await recordAdminSecurityAudit({ actorId: adminId, targetId: user._id, action: "partner.subscription.changed", previousValue, newValue: { partnerTier: user.partnerTier, subscriptionStatus: user.subscriptionStatus, subscriptionExpiresAt: user.subscriptionExpiresAt }, request });

    return {
      success: true,
      message: `Abonnement prolongé de ${daysToAdd} jours.`,
      subscription: getSubscriptionDetails(user),
    };
  }

  if (action === "reject") {
    user.partnerTier = "standard";
    user.subscriptionStatus = "cancelled";
    user.subscriptionExpiresAt = null;
    await user.save();
    await recordAdminSecurityAudit({ actorId: adminId, targetId: user._id, action: "partner.subscription.changed", previousValue, newValue: { partnerTier: user.partnerTier, subscriptionStatus: user.subscriptionStatus, subscriptionExpiresAt: user.subscriptionExpiresAt }, request });

    return {
      success: true,
      message: "Demande d'abonnement rejetée. Compte maintenu en Standard (0 DT).",
      subscription: getSubscriptionDetails(user),
    };
  }

  throw new Error("Action non reconnue (attendu: approve, extend, reject)");
}

/**
 * Verrou automatique de sécurité : Rétrograde un abonnement expiré
 */
export async function checkAndHandleExpiration(user) {
  if (
    user &&
    user.role === "partner" &&
    user.partnerTier !== "standard" &&
    user.subscriptionExpiresAt &&
    new Date() > new Date(user.subscriptionExpiresAt)
  ) {
    console.log(`[Auto-Downgrade] Abonnement expiré pour l'établissement : ${user.establishmentName || user.email}`);
    user.partnerTier = "standard";
    user.subscriptionStatus = "expired";
    await user.save();
    return true;
  }
  return false;
}

