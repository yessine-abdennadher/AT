import assert from "node:assert";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/User.js";
import { Activity } from "../models/Activity.js";
import * as adminService from "../services/admin.service.js";
import * as activityService from "../services/activity.service.js";

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/activitytn_db";

async function runAdminDiagnosticsTests() {
  console.log("🧪 Lancement des tests automatisés Admin Diagnostics & Tier Pro...");

  try {
    await mongoose.connect(MONGO_URI);

    // 1. Création d'un partenaire test standard
    const standardPartner = await User.create({
      name: "Partner Standard Test",
      email: `test.partner.standard.${Date.now()}@activitytn.tn`,
      password: "Partner123456!",
      role: "partner",
      partnerTier: "standard",
    });

    // 2. Création d'une activité pour ce partenaire
    const activity = await Activity.create({
      name: "Café Test Standard",
      category: "food",
      type: "cafe",
      city: "صفاقس",
      locationName: "Test Sfax",
      description: "Test description",
      imageUrl: "https://example.com/test.jpg",
      createdBy: standardPartner._id,
      powerBackupMode: false,
    });

    // 3. Test Toggle Power Backup Mode
    const updatedAct = await activityService.updatePowerMode(activity._id, standardPartner._id, true);
    assert.strictEqual(updatedAct.powerBackupMode, true);
    console.log("  ✅ [1/5] Toggle Power Backup Mode (Lumière/Électricité) validé");

    // 4. Test Restriction Pro : tentative d'ajout d'une promo par un compte standard -> Doit échouer avec code 403
    let promoErrorThrown = false;
    try {
      await activityService.updateActivityPromotion(activity._id, standardPartner._id, {
        isPromo: true,
        discountPercent: 20,
        promoLabel: "Soirée Happy Hour",
      });
    } catch (err) {
      promoErrorThrown = true;
      assert.strictEqual(err.statusCode, 403);
    }
    assert.strictEqual(promoErrorThrown, true, "L'ajout de promotion doit être rejeté pour un partenaire non-pro");
    console.log("  ✅ [2/5] Blocage RBAC Promo pour partenaire standard validé (403 Forbidden)");

    // 5. Test Admin : Attribution du Tier Pro par l'admin
    const upgradedPartner = await adminService.updatePartnerTier(standardPartner._id, "pro");
    assert.strictEqual(upgradedPartner.partnerTier, "pro");
    console.log("  ✅ [3/5] Attribution du Tier Pro par l'admin validée");

    // 6. Test Réussite : maintenant que le partenaire est Pro, l'ajout d'événement et promo fonctionne
    const promoSuccess = await activityService.updateActivityPromotion(activity._id, standardPartner._id, {
      isPromo: true,
      discountPercent: 25,
      promoLabel: "Promo VIP Pro",
    });
    assert.strictEqual(promoSuccess.promotion.isPromo, true);
    assert.strictEqual(promoSuccess.promotion.discountPercent, 25);

    const eventSuccess = await activityService.addActivityEvent(activity._id, standardPartner._id, {
      title: "Soirée Musique Live",
      date: "2026-10-20",
      time: "21:00",
      description: "Ambiance acoustique guitare",
      category: "music",
    });
    assert.strictEqual(eventSuccess.events.length, 1);
    assert.strictEqual(eventSuccess.events[0].title, "Soirée Musique Live");
    console.log("  ✅ [4/5] Ajout d'événement et promotion pour Partenaire Pro validé");

    // 7. Test Diagnostics Admin
    const diagnostics = await adminService.getPlatformDiagnostics();
    assert(diagnostics.partnersStatus !== undefined, "diagnostics doit inclure partnersStatus");
    assert(Array.isArray(diagnostics.partnersStatus), "partnersStatus doit être un tableau");
    console.log("  ✅ [5/6] Récupération des diagnostics et statut d'inactivité partenaires validée");

    // 8. Test Contrôle Global du Mode Électricité par l'Admin
    const statusOn = await adminService.updateGlobalElectricityMode(true, standardPartner._id);
    assert.strictEqual(statusOn, true, "Le mode électricité doit être activé par l'admin");
    const diagAfter = await adminService.getPlatformDiagnostics();
    assert.strictEqual(diagAfter.electricityAlertActive, true, "diagnostics doit refléter le mode électricité activé");

    const statusOff = await adminService.updateGlobalElectricityMode(false, standardPartner._id);
    assert.strictEqual(statusOff, false, "Le mode électricité doit être désactivé par l'admin");
    console.log("  ✅ [6/7] Contrôle Global du Mode Électricité par l'Administrateur validé");

    // 9. Test Signalement Communautaire par un simple utilisateur
    const reportYes = await activityService.recordPowerReport(activity._id, standardPartner._id, true);
    assert.strictEqual(reportYes.yesVotes, 1, "yesVotes doit être 1");
    assert.strictEqual(reportYes.noVotes, 0, "noVotes doit être 0");
    assert.strictEqual(reportYes.userVote, "yes");
    assert.strictEqual(reportYes.lastReportStatus, "light_on");

    // Changement d'avis : vote non
    const reportNo = await activityService.recordPowerReport(activity._id, standardPartner._id, false);
    assert.strictEqual(reportNo.yesVotes, 0, "yesVotes doit passer à 0 après bascule");
    assert.strictEqual(reportNo.noVotes, 1, "noVotes doit être 1");
    assert.strictEqual(reportNo.userVote, "no");
    assert.strictEqual(reportNo.lastReportStatus, "light_off");
    console.log("  ✅ [7/7] Signalement communautaire de la lumière par un simple utilisateur validé");

    // Nettoyage
    await Activity.deleteOne({ _id: activity._id });
    await User.deleteOne({ _id: standardPartner._id });

    console.log("🎉 TOUS LES TESTS ADMIN DIAGNOSTICS, PARTNER PRO & SIGNALEMENT COMMUNAUTAIRE ONT RÉUSSI (7/7) !\n");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Échec des tests admin diagnostics :", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runAdminDiagnosticsTests();
