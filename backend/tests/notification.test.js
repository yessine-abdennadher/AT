import assert from "assert";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Notification } from "../models/Notification.js";
import {
  getNotificationsForUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  createNotification,
} from "../services/notification.service.js";

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/activitytn";

async function runNotificationTests() {
  console.log("🧪 Lancement des tests automatisés du Service Notifications Backend...");

  try {
    await mongoose.connect(MONGO_URI);

    // 1. Test auto-seed & récupération pour rôle "user"
    console.log("  [1/4] Test récupération notifications pour rôle 'user'...");
    const userNotifs = await getNotificationsForUser(null, "user", "fr");
    assert(Array.isArray(userNotifs), "Les notifications doivent être un tableau");
    assert(userNotifs.length > 0, "Doit contenir des notifications pour simple utilisateur");
    const userCategories = userNotifs.map((n) => n.category);
    assert(userCategories.includes("alerts") || userCategories.includes("offers_reviews"), "Doit inclure des alertes ou offres");
    console.log(`    ✅ Récupéré ${userNotifs.length} notifications utilisateur avec succès`);

    // 2. Test récupération pour rôle "partner"
    console.log("  [2/4] Test récupération notifications pour rôle 'partner'...");
    const partnerNotifs = await getNotificationsForUser(null, "partner", "fr");
    assert(partnerNotifs.length > 0, "Doit contenir des notifications pour partenaire");
    console.log(`    ✅ Récupéré ${partnerNotifs.length} notifications partenaire avec succès`);

    // 3. Test récupération pour rôle "admin"
    console.log("  [3/4] Test récupération notifications pour rôle 'admin'...");
    const adminNotifs = await getNotificationsForUser(null, "admin", "fr");
    assert(adminNotifs.length > 0, "Doit contenir des notifications pour admin");
    console.log(`    ✅ Récupéré ${adminNotifs.length} notifications administrateur avec succès`);

    // 4. Test création, marquage comme lu et suppression
    console.log("  [4/4] Test cycle de vie d'une notification (création, lecture, suppression)...");
    const testNotif = await createNotification({
      targetRole: "user",
      category: "alerts",
      type: "power_alert",
      title: { ar: "اختبار", fr: "Test Lumière", en: "Light Test" },
      description: { ar: "وصف", fr: "Description de test", en: "Test desc" },
      icon: "bulb",
      color: "#F59E0B",
    });
    assert.strictEqual(testNotif.read, false, "Nouvelle notification doit être non lue");

    const readRes = await markNotificationAsRead(testNotif._id);
    assert.strictEqual(readRes.read, true, "La notification doit être marquée comme lue");

    await deleteNotification(testNotif._id);
    const deletedCheck = await Notification.findById(testNotif._id);
    assert.strictEqual(deletedCheck, null, "La notification doit être supprimée");
    console.log("    ✅ Cycle de vie complet validé (création, lu, suppression)");

    console.log("\n🎉 TOUS LES TESTS NOTIFICATIONS ONT RÉUSSI (4/4) !\n");
  } catch (error) {
    console.error("❌ Échec des tests notifications :", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runNotificationTests();
