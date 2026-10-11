import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/User.js";

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/activitytn_db";

const demoUsers = [
  {
    name: "Administrateur ActivityTN",
    email: "admin@activitytn.tn",
    password: "Admin123456!",
    role: "admin",
    city: "تونس (Tunis)",
    bio: "Gestionnaire système et modérateur officiel de la plateforme ActivityTN.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
  },
  {
    name: "Le Moulin Cafe & Lounge",
    email: "partner.moulin@activitytn.tn",
    password: "Partner123456!",
    role: "partner",
    establishmentName: "Le Moulin Cafe & Lounge",
    city: "صفاقس (Sfax)",
    bio: "Espace café gourmand, lounge convivial et organisation de soirées acoustiques.",
    avatar: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=200",
  },
  {
    name: "Chef Amine (Restaurant Le Pirate)",
    email: "restaurant.pirate@activitytn.tn",
    password: "Partner123456!",
    role: "partner",
    establishmentName: "Restaurant Le Pirate",
    city: "صفاقس (Sfax)",
    phone: "+216 74 200 100",
    bio: "Restaurant gastronomique en bord de mer, spécialités poissons frais, dorade royale et cuisine méditerranéenne.",
    avatar: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=200",
  },
  {
    name: "Youssef Sfaxi",
    email: "user.sfax@activitytn.tn",
    password: "User123456!",
    role: "user",
    city: "صفاقس (Sfax)",
    bio: "Passionné d'activités outdoor, de sorties entre amis et de bons cafés à Sfax.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
  },
];

const seedUsers = async () => {
  try {
    console.log("🔌 [Seeder] Connexion à MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ [Seeder] Connecté à MongoDB.");

    for (const userData of demoUsers) {
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        console.log(`ℹ️ [Seeder] L'utilisateur ${userData.email} (${userData.role}) existe déjà.`);
      } else {
        await User.create(userData);
        console.log(`✨ [Seeder] Utilisateur créé : ${userData.email} [Rôle: ${userData.role}]`);
      }
    }

    console.log("\n🎉 [Seeder] Initialisation des utilisateurs terminée avec succès !");
    console.log("---------------------------------------------------------------");
    console.log("👑 Admin       : admin@activitytn.tn / Admin123456!");
    console.log("🍽️ Restaurant  : restaurant.pirate@activitytn.tn / Partner123456!");
    console.log("☕ Café Lounge : partner.moulin@activitytn.tn / Partner123456!");
    console.log("👤 Utilisateur : user.sfax@activitytn.tn / User123456!");
    console.log("---------------------------------------------------------------\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ [Seeder] Erreur lors du seeding :", error);
    process.exit(1);
  }
};

seedUsers();
