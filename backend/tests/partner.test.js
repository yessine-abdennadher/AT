import assert from "node:assert/strict";
import { authorize } from "../middlewares/auth.middleware.js";
import { updateActivity, deleteActivity } from "../services/activity.service.js";
import { Activity } from "../models/Activity.js";

console.log("🧪 Lancement des tests de validation Partenaire / Établissement (ActivityTN)...");

// Test 1: RBAC Authorize Middleware bloque les utilisateurs standards pour la création d'activité
console.log("  [1/4] Test RBAC : vérification du blocage pour les utilisateurs standards (role: user)...");
const requirePartnerOrAdmin = authorize("admin", "partner");

let blockedStatus = false;
let blockedCode = 0;
const resMock = {
  status: (code) => {
    blockedCode = code;
    return {
      json: () => {
        blockedStatus = true;
      },
    };
  },
};

// Requête venant d'un simple utilisateur
requirePartnerOrAdmin({ user: { role: "user" } }, resMock, () => {
  assert.fail("Un simple utilisateur ne doit pas pouvoir publier d'activité.");
});
assert.equal(blockedStatus, true);
assert.equal(blockedCode, 403, "Le code HTTP doit être 403");
console.log("    ✅ Simple utilisateur bloqué avec code 403");

// Test 2: RBAC Authorize Middleware autorise le rôle "partner"
console.log("  [2/4] Test RBAC : autorisation accordée au rôle 'partner' (restaurateur / pro)...");
let partnerPassed = false;
requirePartnerOrAdmin({ user: { role: "partner" } }, resMock, () => {
  partnerPassed = true;
});
assert.equal(partnerPassed, true, "Le partenaire doit être autorisé.");
console.log("    ✅ Partenaire autorisé avec succès");

// Test 3: Contrôle de propriété (Ownership) - Rejet de modification sur l'activité d'un autre partenaire
console.log("  [3/4] Test Sécurité : tentative de modification d'une activité concurrente...");
async function testOwnershipProtection() {
  const originalFindById = Activity.findById;

  // Mock d'une activité créée par le partenaire A
  Activity.findById = async () => ({
    _id: "6650aaaa1111222233334444",
    name: "Menu Dégustation Fruits de Mer",
    createdBy: "6650aaaa1111222233334444", // Partenaire A
  });

  try {
    // Le partenaire B (ID différent) tente de modifier l'activité du partenaire A
    const maliciousPartnerUser = {
      id: "6650bbbb5555666677778888", // Partenaire B
      role: "partner",
    };

    await updateActivity("6650aaaa1111222233334444", { name: "Menu Hacked" }, maliciousPartnerUser);
    assert.fail("Un partenaire ne doit pas pouvoir modifier l'activité d'un autre partenaire !");
  } catch (err) {
    assert.equal(err.statusCode, 403);
    assert.match(err.message, /vous ne pouvez modifier que vos propres activités/);
    console.log("    ✅ Modification d'une activité concurrente rejetée avec code 403");
  } finally {
    Activity.findById = originalFindById;
  }
}

// Test 4: Contrôle de propriété (Ownership) - Rejet de suppression sur l'activité d'un autre partenaire
console.log("  [4/4] Test Sécurité : tentative de suppression d'une activité concurrente...");
async function testDeleteOwnershipProtection() {
  const originalFindById = Activity.findById;

  Activity.findById = async () => ({
    _id: "6650aaaa1111222233334444",
    name: "Menu Dégustation Fruits de Mer",
    createdBy: "6650aaaa1111222233334444", // Partenaire A
    deleteOne: async () => true,
  });

  try {
    const maliciousPartnerUser = {
      id: "6650bbbb5555666677778888", // Partenaire B
      role: "partner",
    };

    await deleteActivity("6650aaaa1111222233334444", maliciousPartnerUser);
    assert.fail("Un partenaire ne doit pas pouvoir supprimer l'activité d'un autre partenaire !");
  } catch (err) {
    assert.equal(err.statusCode, 403);
    assert.match(err.message, /vous ne pouvez supprimer que vos propres activités/);
    console.log("    ✅ Suppression d'une activité concurrente rejetée avec code 403");
  } finally {
    Activity.findById = originalFindById;
  }
}

await testOwnershipProtection();
await testDeleteOwnershipProtection();

console.log("🎉 TOUS LES TESTS PARTENAIRE / RESTAURANT ONT RÉUSSI AVEC SUCCÈS (4/4) !");
