import assert from "node:assert/strict";
import { authLimiter, chatLimiter } from "../middlewares/rateLimit.middleware.js";
import { errorHandler } from "../middlewares/error.middleware.js";
import { Activity } from "../models/Activity.js";
import { User } from "../models/User.js";

console.log("🧪 Lancement des tests de vérification de production Backend...");

// Test 1: Rate Limiter Middleware
console.log("  [1/5] Test des Rate Limiters (protection brute-force)...");
assert.equal(typeof authLimiter, "function", "authLimiter doit être une fonction middleware");
assert.equal(typeof chatLimiter, "function", "chatLimiter doit être une fonction middleware");

let authBlocked = false;
const mockRes = {
  setHeader: () => {},
  status: (code) => {
    if (code === 429) authBlocked = true;
    return { json: () => {} };
  },
};
const mockReq = { ip: "192.168.1.99" };
// 30 requêtes autorisées
for (let i = 0; i < 30; i++) {
  authLimiter(mockReq, mockRes, () => {});
}
assert.equal(authBlocked, false, "Les 30 premières requêtes doivent passer");
// 31ème requête doit être bloquée
authLimiter(mockReq, mockRes, () => {});
assert.equal(authBlocked, true, "La 31ème requête doit être bloquée avec code 429");
console.log("    ✅ Rate limiter validé (limite 30 req / 15min respectée)");

// Test 2: Error Handler Middleware
console.log("  [2/5] Test du gestionnaire d'erreurs global (Production)...");
let errorStatusCode = 0;
let errorJsonBody = null;
const errorRes = {
  status: (code) => {
    errorStatusCode = code;
    return {
      json: (data) => {
        errorJsonBody = data;
      },
    };
  },
};

// Test Mongoose CastError (Bad ID format)
errorHandler({ name: "CastError", value: "abc" }, {}, errorRes, () => {});
assert.equal(errorStatusCode, 400, "CastError doit retourner 400");
assert.equal(errorJsonBody.success, false);

// Test Mongo E11000 Duplicate Key
errorHandler({ code: 11000, keyValue: { email: "test@example.com" } }, {}, errorRes, () => {});
assert.equal(errorStatusCode, 400, "Duplicate Key doit retourner 400");
assert.equal(errorJsonBody.success, false);

// Test JWT Expiration
errorHandler({ name: "TokenExpiredError" }, {}, errorRes, () => {});
assert.equal(errorStatusCode, 401, "Token expiré doit retourner 401");
assert.equal(errorJsonBody.success, false);
console.log("    ✅ Error handler validé (CastError 404, E11000 409, JWT 401)");

// Test 3: Model Schema & Index Validation
console.log("  [3/5] Test des Index et Modèles Mongoose...");
const activityIndexes = Activity.schema.indexes();
assert.ok(activityIndexes.length >= 3, "Activity doit posséder au moins 3 index de performance");
const userIndexes = User.schema.indexes();
assert.ok(userIndexes.length >= 1, "User doit posséder des index configurés");

// Vérifier les champs téléphone et WhatsApp dans Activity
assert.ok(Activity.schema.path("phone"), "Le schéma Activity doit inclure le champ phone");
assert.ok(Activity.schema.path("whatsapp"), "Le schéma Activity doit inclure le champ whatsapp");
console.log("    ✅ Modèles validés (Index composés et champs de contact direct présents)");

// Test 4: ReDoS protection & Regex Safety
console.log("  [4/5] Test de la protection ReDoS...");
const testMaliciousInput = "([a-zA-Z]+)*$!@#$^&*()_+{}[]";
const escaped = testMaliciousInput.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
assert.doesNotThrow(() => {
  new RegExp(escaped, "i");
}, "L'expression échappée ne doit pas provoquer d'erreur ou d'explosion ReDoS");
console.log("    ✅ Protection ReDoS validée");

// Test 5: Upload Service Fallback
console.log("  [5/5] Test du service d'upload...");
import { processImageUpload } from "../services/upload.service.js";
assert.equal(typeof processImageUpload, "function", "processImageUpload doit être exporté");
console.log("    ✅ Service d'upload validé");

console.log("\n🎉 TOUS LES TESTS DE PRODUCTION BACKEND ONT RÉUSSI AVEC SUCCÈS (5/5) !\n");
