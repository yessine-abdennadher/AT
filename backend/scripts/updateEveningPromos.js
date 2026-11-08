import mongoose from "mongoose";
import { Activity } from "../models/Activity.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/activitytn_db";

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log("Connecté à MongoDB :", MONGO_URI);

  // 1. Le Moulin Cafe & Lounge (Gremda)
  const res1 = await Activity.updateOne(
    { name: /Le Moulin Cafe/i },
    {
      $set: {
        promotion: {
          isPromo: true,
          promoType: "all",
          discountPercent: 20,
          targetItem: "Boissons & Desserts Soirée",
          promoLabel: "Happy Hour Soirée : -20% sur les boissons de 18h à 21h",
          validUntil: "2026-12-31",
        },
        events: [
          {
            title: "Soirée Acoustique Live Music",
            date: "Vendredi & Samedi soir",
            time: "20:30",
            description: "Ambiance acoustique feutrée en soirée avec artistes locaux",
            category: "music",
            price: 0,
          },
        ],
      },
    }
  );
  console.log("Le Moulin mis à jour :", res1.modifiedCount);

  // 2. Restaurant & Pizzeria Chihia
  const res2 = await Activity.updateOne(
    { name: /Restaurant & Pizzeria Chihia/i },
    {
      $set: {
        promotion: {
          isPromo: true,
          promoType: "item",
          discountPercent: 25,
          targetItem: "Menu Duo Soirée",
          promoLabel: "Offre Soirée Duo : 2 Pizzas au choix + Boissons à 28 DT",
          validUntil: "2026-12-31",
        },
        events: [
          {
            title: "Soirée Pizza & Match Foot",
            date: "Soirs de grands matchs",
            time: "20:00",
            description: "Projection sur grand écran avec formule pizza spéciale",
            category: "party",
            price: 0,
          },
        ],
      },
    }
  );
  console.log("Pizzeria Chihia mise à jour :", res2.modifiedCount);

  // 3. Bowling & Loisirs Mall of Sfax
  const res3 = await Activity.updateOne(
    { name: /Bowling.*Mall of Sfax/i },
    {
      $set: {
        promotion: {
          isPromo: true,
          promoType: "all",
          discountPercent: 30,
          targetItem: "Pack Soirée Bowling & Arcade",
          promoLabel: "Pack Soirée Lamma : 2 parties bowling + 1 partie billard à -30%",
          validUntil: "2026-12-31",
        },
        events: [
          {
            title: "Tournoi Nocturne Bowling & Fun",
            date: "Chaque Jeudi soir",
            time: "21:00",
            description: "Tournoi nocturne amical avec formule boissons incluses",
            category: "party",
            price: 18,
          },
        ],
      },
    }
  );
  console.log("Bowling Mall of Sfax mis à jour :", res3.modifiedCount);

  // 4. مقهى الديوان - أسوار المدينة العتيقة (Café Diwan)
  const res4 = await Activity.updateOne(
    { name: /الديوان|Diwan/i },
    {
      $set: {
        promotion: {
          isPromo: true,
          promoType: "item",
          discountPercent: 15,
          targetItem: "Formule Soirée Médina",
          promoLabel: "Formule Soirée Médina : Thé aux pignons + Pâtisserie à 6 DT",
          validUntil: "2026-12-31",
        },
        events: [
          {
            title: "Soirée Malouf & Patrimoine",
            date: "Samedi soir",
            time: "20:00",
            description: "Chants traditionnels Malouf au cœur de Bab Diwan",
            category: "music",
            price: 0,
          },
        ],
      },
    }
  );
  console.log("Café Diwan mis à jour :", res4.modifiedCount);

  // 5. Restaurant Le Pirate
  const res5 = await Activity.updateOne(
    { name: /Pirate/i },
    {
      $set: {
        promotion: {
          isPromo: true,
          promoType: "all",
          discountPercent: 20,
          targetItem: "Dîner Soirée Fruits de Mer",
          promoLabel: "Soirée Fruits de Mer : Menu complet Duo à 48 DT au lieu de 60 DT",
          validUntil: "2026-12-31",
        },
        events: [
          {
            title: "Soirée Couché de Soleil & Dîner Romantique",
            date: "Tous les soirs",
            time: "19:30",
            description: "Dîner aux chandelles face à la mer avec violoniste en live",
            category: "music",
            price: 0,
          },
        ],
      },
    }
  );
  console.log("Restaurant Le Pirate mis à jour :", res5.modifiedCount);

  await mongoose.disconnect();
  console.log("Terminé avec succès !");
}

main().catch((err) => {
  console.error("Erreur:", err);
  process.exit(1);
});
