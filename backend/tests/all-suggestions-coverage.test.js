import test from "node:test";
import assert from "node:assert/strict";
import { createChatMainGateway } from "../services/chatbot/conversations/chatMainGateway.service.js";

const TEST_CHIPS = [
  // ── Zones (FR, Derja, AR, EN) ──
  "Gremda",
  "Chihia",
  "Sakiet Ezzit",
  "Centre-ville",
  "قرمدة",
  "الشيحية",
  "ساقية الزيت",
  "وسط المدينة",
  "Downtown",

  // ── Catégories (FR, Derja, AR, EN) ──
  "Café",
  "Restaurant",
  "Plein air",
  "Loisirs & Fun",
  "9ahwa",
  "Hwe ndhif",
  "Jaw & Loisirs",
  "قهوة",
  "مطعم",
  "هواء طلق",
  "ألعاب وترفيه",
  "Coffee",
  "Outdoors",
  "Fun & Leisure",

  // ── Refinements & Ambiance ──
  "Moins cher",
  "Avec terrasse",
  "Familial",
  "Ouvert maintenant",
  "Ar5as",
  "M3a terrasse",
  "3ayli",
  "Mahloul tawa",
  "أرخص",
  "مع تراس",
  "عائلي",
  "مفتوح الآن",
  "Cheaper",
  "With terrace",
  "Family friendly",
  "Open now",

  // ── Contextuels (Couple, Amis, Froid, Loisirs) ──
  "Dîner romantique",
  "Vue sur mer",
  "Cadre calme",
  "عشاء رومانسي",
  "إطلالة على البحر",
  "مكان هادئ",
  "Romantic dinner",
  "Sea view",
  "Quiet setting",
  "Café lamma",
  "Gaming & Fun",
  "Resto sympa",
  "قهوة لمة",
  "مطعم مميز",
  "Hangout cafe",
  "Lively restaurant",
  "Salon de thé cosy",
  "Resto chauffé",
  "Cinéma",
  "صالون شاي دافئ",
  "مطعم مدفأ",
  "سينما",
  "Cozy tea room",
  "Heated restaurant",
  "Cinema",

  // ── Promotions & Soirées ──
  "Happy hour ce soir",
  "Offres de soirée",
  "Promotions en cours",
  "Soirée avec promo",
  "Happy hour el lila",
  "Promo el lila",
  "Sehra avec promo",
  "عروض سهرة الليلة",
  "تخفيضات سهرة الليلة",
  "عروض وتخفيضات",
  "Happy hour tonight",
  "Evening promotions",
  "Special deals",
  "Night out with deals",

  // ── Actions de détail & Navigation ──
  "Horaires",
  "Menu & Prix",
  "Itinéraire",
  "Autre zone",
  "El wa9t",
  "El menu",
  "Thneya",
  "Zone o5ra",
  "الأوقات",
  "المنيو والأسعار",
  "الموقع والمسار",
  "منطقة أخرى",
  "Hours",
  "Menu & Prices",
  "Directions",
  "Other area",

  // ── Tout afficher / Reset ──
  "Toutes les sorties",
  "Kol el kharjet",
  "كل الأنشطة",
  "All outings",
];

test("Coverage: Chaque puce de suggestion produit une réponse directe sans clarification", async () => {
  const mockRepo = {
    find: async () => [
      {
        id: "act-test-1",
        name: "Café Test Sfax",
        city: "Sfax",
        category: "food",
        type: "cafe",
        price: 8,
        rating: 4.8,
        openingHours: "07:00 - 23:00",
        address: "Route de Chihia Km 6, Sfax",
      },
    ],
    findById: async () => ({
      id: "act-test-1",
      name: "Café Test Sfax",
      city: "Sfax",
      category: "food",
      type: "cafe",
      price: 8,
      rating: 4.8,
      openingHours: "07:00 - 23:00",
      address: "Route de Chihia Km 6, Sfax",
      menu: "Café, Thé, Pâtisserie",
      locationName: "Route de Chihia Km 6, Sfax",
    }),
  };

  const gateway = createChatMainGateway({ repository: mockRepo });
  const failures = [];

  const ACTION_CHIPS = new Set([
    "Horaires",
    "Menu & Prix",
    "Itinéraire",
    "El wa9t",
    "El menu",
    "Thneya",
    "الأوقات",
    "المنيو والأسعار",
    "الموقع والمسار",
    "Hours",
    "Menu & Prices",
    "Directions",
  ]);

  for (const chip of TEST_CHIPS) {
    const sessionId = "chip-cov-" + Math.random().toString(36).slice(2);

    // Pour les puces d'action de détail (Horaires, Menu, etc.), une activité doit être en focus
    if (ACTION_CHIPS.has(chip)) {
      await gateway.handleTurn({
        sessionId,
        text: "Café",
        userContext: { userCity: "Sfax" },
      });
    }

    const reply = await gateway.handleTurn({
      sessionId,
      text: chip,
      userContext: { userCity: "Sfax" },
    });

    const intentKey = reply.metadata?.intentKey || "UNKNOWN";
    const text = reply.text || "";

    const isConfusion =
      intentKey === "UNKNOWN" ||
      text.includes("ما فهمتش") ||
      text.includes("مش متأكد") ||
      text.includes("Je n'ai pas bien compris") ||
      text.includes("Je ne suis pas sûr") ||
      text.includes("Quelle ville");

    if (isConfusion) {
      failures.push({ chip, intentKey, text: text.slice(0, 70) });
    }
  }

  assert.equal(
    failures.length,
    0,
    `Échec pour ${failures.length} puces :\n` +
      failures.map((f) => ` - [${f.chip}] -> intent=${f.intentKey} | text: ${f.text}`).join("\n")
  );
});
