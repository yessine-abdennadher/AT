import { describe, it } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import { createChatMainGateway } from "../services/chatbot/conversations/chatMainGateway.service.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/activitytn_db";

describe("Promotions & Soirées Scenarios - Real MongoDB Validation", () => {
  let gateway;

  it("initialise la connexion MongoDB et le Gateway du chatbot", async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(MONGO_URI);
    }
    gateway = createChatMainGateway();
    assert.ok(gateway, "Gateway initialisé");
  });

  it("Scénario 1 - Derja : 'fama promo el lila ?' détecte la promo soirée et renvoie des lieux réels avec promo", async () => {
    const res = await gateway.handleTurn({
      sessionId: `test_promo_derja_${Date.now()}`,
      text: "fama promo el lila ?",
      userContext: { userCity: "Sfax" },
    });

    assert.ok(res.text, "Le texte de réponse doit être présent");
    assert.doesNotMatch(res.text, /ما فهمتش|مش متأكد|Quelle ville/i);

    const cards = res.metadata?.cards || [];
    assert.ok(cards.length > 0, "Doit retourner au moins un lieu");

    // Au moins une activité avec promotion
    const hasPromoCard = cards.some((c) => c.promotion && c.promotion.isPromo);
    assert.ok(hasPromoCard, "Au moins une activité doit avoir une promotion active attachée");
  });

  it("Scénario 2 - Français : 'propose moi des promos pour ce soir à sfax'", async () => {
    const res = await gateway.handleTurn({
      sessionId: `test_promo_fr_${Date.now()}`,
      text: "propose moi des promos pour ce soir à sfax",
      userContext: { userCity: "Sfax" },
    });

    assert.ok(res.text);
    assert.doesNotMatch(res.text, /Quelle ville|Désolé/i);
    const cards = res.metadata?.cards || [];
    assert.ok(cards.length > 0, "Doit retourner des cartes");
    const hasPromo = cards.some((c) => c.promotion?.isPromo);
    assert.ok(hasPromo, "Doit inclure des cartes en promotion");
  });

  it("Scénario 3 - Arabe : 'فما عروض خاصة في سهرة الليلة ؟'", async () => {
    const res = await gateway.handleTurn({
      sessionId: `test_promo_ar_${Date.now()}`,
      text: "فما عروض خاصة في سهرة الليلة ؟",
      userContext: { userCity: "Sfax" },
    });

    assert.ok(res.text);
    assert.doesNotMatch(res.text, /ما فهمتش|مش متأكد/i);
    const cards = res.metadata?.cards || [];
    assert.ok(cards.length > 0);
  });

  it("Scénario 4 - Happy Hour : 'fama happy hour ce soir ?'", async () => {
    const res = await gateway.handleTurn({
      sessionId: `test_happy_hour_${Date.now()}`,
      text: "fama happy hour ce soir ?",
      userContext: { userCity: "Sfax" },
    });

    assert.ok(res.text);
    const cards = res.metadata?.cards || [];
    assert.ok(cards.length > 0);
    const happyHourSpot = cards.find((c) => c.promotion?.promoLabel?.toLowerCase().includes("happy hour"));
    assert.ok(happyHourSpot, "Doit recommander un établissement proposant un Happy Hour (ex: Le Moulin)");
  });
});
