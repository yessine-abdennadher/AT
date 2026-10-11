import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/User.js";
import { Activity } from "../models/Activity.js";

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/activitytn_db";

const run = async () => {
  await mongoose.connect(MONGO_URI);
  console.log("Connecté à MongoDB");

  const partner = await User.findOne({ email: "restaurant.pirate@activitytn.tn" });
  if (!partner) {
    console.error("Partner non trouvé");
    process.exit(1);
  }

  const existing = await Activity.find({ createdBy: partner._id });
  if (existing.length > 0) {
    console.log(`Le restaurant a déjà ${existing.length} activités.`);
    process.exit(0);
  }

  const activities = [
    {
      name: "Menu Dégustation Fruits de Mer & Poissons Frais",
      nameFr: "Menu Dégustation Fruits de Mer & Poissons Frais",
      nameAr: "قائمة تذوق فواكه البحر والأسماك الطازجة",
      category: "food",
      type: "restaurant",
      city: "Sfax",
      locationName: "Route Sidi Mansour Km 4, Sfax",
      address: "Route Sidi Mansour Km 4, Sfax",
      phone: "+216 74 200 100",
      whatsapp: "+216 98 200 100",
      description: "Menu gastronomique complet en terrasse avec vue sur mer : soupe de poisson saffaxienne, calamars farcis, loup grillé et dessert traditionnel.",
      price: 45,
      currency: "TND",
      rating: 4.9,
      reviewsCount: 38,
      imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
      isPopular: true,
      isFeatured: true,
      isApproved: true,
      hasAirConditioning: true,
      hasPowerBackup: true,
      createdBy: partner._id,
    },
    {
      name: "Dîner Romantique Couché de Soleil - Restaurant Le Pirate",
      nameFr: "Dîner Romantique Couché de Soleil - Restaurant Le Pirate",
      nameAr: "عشاء رومانسي عند الغروب - مطعم لو بيرات",
      category: "food",
      type: "restaurant",
      city: "Sfax",
      locationName: "Route Sidi Mansour Km 4, Sfax",
      address: "Route Sidi Mansour Km 4, Sfax",
      phone: "+216 74 200 100",
      whatsapp: "+216 98 200 100",
      description: "Table réservée aux chandelles en bord de mer avec menu raffiné pour 2 personnes, musique d'ambiance et service haut de gamme.",
      price: 70,
      currency: "TND",
      rating: 4.8,
      reviewsCount: 24,
      imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
      isPopular: true,
      isFeatured: false,
      isApproved: true,
      hasAirConditioning: true,
      hasPowerBackup: true,
      createdBy: partner._id,
    },
  ];

  await Activity.insertMany(activities);
  console.log("✨ 2 Activités démo insérées pour Restaurant Le Pirate !");
  process.exit(0);
};

run();
