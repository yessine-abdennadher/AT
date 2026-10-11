import assert from "node:assert/strict";
import { authorize } from "../middlewares/auth.middleware.js";
import {
  updateUserStatus,
  updateUserRole,
  toggleActivityHighlight,
} from "../services/admin.service.js";

console.log("🧪 Lancement des tests de validation Admin (ActivityTN Backend)...");

// Test 1: RBAC Authorize Middleware bloque les rôles non autorisés (ex: "user" ou "partner")
console.log("  [1/6] Test RBAC : vérification du blocage pour les non-admins...");
const requireAdmin = authorize("admin");

let statusBlocked = false;
let blockedCode = 0;
let blockedMessage = "";

const resForbidden = {
  status: (code) => {
    blockedCode = code;
    return {
      json: (payload) => {
        statusBlocked = true;
        blockedMessage = payload.message;
      },
    };
  },
};

// Utilisateur avec rôle 'user'
requireAdmin({ user: { role: "user" } }, resForbidden, () => {
  assert.fail("Un utilisateur avec le rôle 'user' ne doit jamais passer requireAdmin");
});
assert.equal(statusBlocked, true, "Le rôle 'user' doit être bloqué");
assert.equal(blockedCode, 403, "Le code HTTP retourné doit être 403");

// Utilisateur avec rôle 'partner'
statusBlocked = false;
requireAdmin({ user: { role: "partner" } }, resForbidden, () => {
  assert.fail("Un partenaire ne doit pas accéder aux routes admin");
});
assert.equal(statusBlocked, true, "Le rôle 'partner' doit être bloqué");
assert.equal(blockedCode, 403);
console.log("    ✅ Accès refusé aux rôles 'user' et 'partner' avec code 403");

// Test 2: RBAC Authorize Middleware autorise le rôle "admin"
console.log("  [2/6] Test RBAC : autorisation accordée au rôle 'admin'...");
let adminPassed = false;
requireAdmin({ user: { role: "admin" } }, resForbidden, () => {
  adminPassed = true;
});
assert.equal(adminPassed, true, "L'administrateur doit passer avec succès");
console.log("    ✅ Rôle 'admin' autorisé avec succès");

// Test 3: Protection anti-auto-suspension d'un administrateur
console.log("  [3/6] Test Service : protection anti-auto-suspension...");
async function testSelfSuspension() {
  const adminId = "6650a1234567890abcdef123";
  try {
    await updateUserStatus(adminId, false, adminId);
    assert.fail("L'administrateur ne doit pas pouvoir s'auto-suspendre");
  } catch (err) {
    assert.equal(err.statusCode, 400);
    assert.match(err.message, /Impossible de modifier le statut de votre propre compte/);
    console.log("    ✅ Auto-suspension bloquée avec erreur 400");
  }
}

// Test 4: Protection anti-auto-rétrogradation de rôle
console.log("  [4/6] Test Service : protection anti-auto-rétrogradation...");
async function testSelfDemotion() {
  const adminId = "6650a1234567890abcdef123";
  try {
    await updateUserRole(adminId, "user", adminId);
    assert.fail("L'administrateur ne doit pas pouvoir rétrograder son propre compte");
  } catch (err) {
    assert.equal(err.statusCode, 400);
    assert.match(err.message, /Impossible de modifier le rôle de votre propre compte/);
    console.log("    ✅ Auto-rétrogradation bloquée avec erreur 400");
  }
}

// Test 5: Validation des rôles autorisés (user, partner, admin)
console.log("  [5/6] Test Service : rejet des rôles invalides...");
async function testInvalidRole() {
  const adminId = "6650a1234567890abcdef123";
  const targetId = "6650a9999999990abcdef999";
  try {
    await updateUserRole(targetId, "super_hacker", adminId);
    assert.fail("Un rôle non conforme doit être rejeté");
  } catch (err) {
    assert.equal(err.statusCode, 400);
    assert.match(err.message, /Rôle invalide/);
    console.log("    ✅ Rôle invalide rejeté avec erreur 400");
  }
}

// Test 6: Validation des champs de mise en avant (isFeatured, isPopular uniquement)
console.log("  [6/6] Test Service : validation des champs de highlight...");
async function testInvalidHighlightField() {
  const activityId = "6650a7777777770abcdef777";
  try {
    await toggleActivityHighlight(activityId, "isHacked");
    assert.fail("Un champ de highlight non autorisé doit être rejeté");
  } catch (err) {
    assert.equal(err.statusCode, 400);
    assert.match(err.message, /Champ invalide/);
    console.log("    ✅ Champ de highlight non autorisé rejeté avec erreur 400");
  }
}

await testSelfSuspension();
await testSelfDemotion();
await testInvalidRole();
await testInvalidHighlightField();

console.log("🎉 TOUS LES TESTS ADMIN ONT RÉUSSI AVEC SUCCÈS (6/6) !");
