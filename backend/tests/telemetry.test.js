import assert from "node:assert";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Telemetry } from "../models/Telemetry.js";
import { User } from "../models/User.js";
import { Activity } from "../models/Activity.js";
import * as telemetryService from "../services/telemetry.service.js";

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/activitytn_db";

async function runTelemetryTests() {
  console.log("🧪 Lancement des tests automatisés Télémétrie & Nouveaux Modèles...");

  try {
    await mongoose.connect(MONGO_URI);

    // 1. Enregistrement d'une session
    const sessionRes = await telemetryService.recordTelemetryEvent({
      sessionId: "session_test_123",
      eventType: "session_start",
      screenName: "home",
      metadata: { platform: "android" },
    });
    assert.strictEqual(sessionRes.eventType, "session_start");
    assert.strictEqual(sessionRes.sessionId, "session_test_123");
    console.log("  ✅ [1/4] Enregistrement d'événement session_start validé");

    // 2. Enregistrement d'une vue d'écran
    const screenRes = await telemetryService.recordTelemetryEvent({
      sessionId: "session_test_123",
      eventType: "screen_view",
      screenName: "recommendation_flow",
    });
    assert.strictEqual(screenRes.screenName, "recommendation_flow");
    console.log("  ✅ [2/4] Enregistrement d'événement screen_view validé");

    // 3. Agrégation des statistiques télémétriques
    const stats = await telemetryService.getTelemetryStats();
    assert(stats.totalSessions >= 1, "Le total des sessions doit être >= 1");
    assert(Array.isArray(stats.screenViews), "screenViews doit être un tableau");
    console.log("  ✅ [3/4] Agrégation des KPIs télémétrie validée");

    // 4. Vérification des champs partnerTier sur User et powerBackupMode sur Activity
    const userSample = new User({
      name: "Test Partner Tier",
      email: "tier.test@activitytn.tn",
      role: "partner",
      partnerTier: "pro",
    });
    assert.strictEqual(userSample.partnerTier, "pro");

    const activitySample = new Activity({
      name: "Test Activity Lighting",
      category: "food",
      city: "صفاقس",
      locationName: "Test Location",
      description: "Description test",
      imageUrl: "https://example.com/pic.jpg",
      createdBy: userSample._id,
      openingTime: "08:00",
      closingTime: "23:00",
      powerBackupMode: true,
      events: [{ title: "Soirée Acoustique", date: "2026-10-15", time: "20:00" }],
      promotion: { isPromo: true, discountPercent: 15, promoLabel: "-15% Étudiants" },
    });
    assert.strictEqual(activitySample.powerBackupMode, true);
    assert.strictEqual(activitySample.openingTime, "08:00");
    assert.strictEqual(activitySample.events.length, 1);
    assert.strictEqual(activitySample.promotion.discountPercent, 15);
    console.log("  ✅ [4/4] Nouveaux champs User (partnerTier) et Activity (lighting, horaires, promo, events) validés");

    // Nettoyage de l'événement de test
    await Telemetry.deleteMany({ sessionId: "session_test_123" });

    console.log("🎉 TOUS LES TESTS TÉLÉMÉTRIE ET MODÈLES ONT RÉUSSI (4/4) !\n");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Échec des tests télémétrie :", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runTelemetryTests();
