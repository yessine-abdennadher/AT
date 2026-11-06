/**
 * Test unitaire de validation de la logique d'abonnement et d'expiration partenaire
 */
import test from "node:test";
import assert from "node:assert/strict";
import { getSubscriptionDetails } from "../services/partner-subscription.service.js";

test("getSubscriptionDetails calcule correctement les jours restants et les alertes", () => {
  const now = new Date();
  const in25Days = new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000);
  const in2Days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const expiredDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  // Cas 1 : Abonnement Pro actif (25 jours restants)
  const user1 = {
    role: "partner",
    partnerTier: "pro",
    requestedTier: "pro",
    requestedBillingCycle: "monthly",
    subscriptionStatus: "active",
    subscriptionExpiresAt: in25Days,
  };
  const details1 = getSubscriptionDetails(user1);
  assert.equal(details1.tier, "pro");
  assert.equal(details1.status, "active");
  assert.equal(details1.daysRemaining, 25);
  assert.equal(details1.isExpiringSoon, false);

  // Cas 2 : Abonnement expirant bientôt (2 jours restants) -> Alerte orange
  const user2 = {
    role: "partner",
    partnerTier: "premium",
    subscriptionStatus: "active",
    subscriptionExpiresAt: in2Days,
  };
  const details2 = getSubscriptionDetails(user2);
  assert.equal(details2.daysRemaining, 2);
  assert.equal(details2.isExpiringSoon, true);

  // Cas 3 : Abonnement échu
  const user3 = {
    role: "partner",
    partnerTier: "pro",
    subscriptionStatus: "active",
    subscriptionExpiresAt: expiredDate,
  };
  const details3 = getSubscriptionDetails(user3);
  assert.equal(details3.daysRemaining, 0);
  assert.equal(details3.isExpiringSoon, false);
});

