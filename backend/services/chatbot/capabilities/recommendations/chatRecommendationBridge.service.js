/**
 * chatRecommendationBridge.service.js
 * Pont centralisé reliant l'orchestrateur de dialogue du chatbot au moteur
 * de recommandation principal de la plateforme (activity-recommendation.service.js).
 */

import mongoose from "mongoose";
import { Activity } from "../../../../models/Activity.js";
import { formatActivityCards } from "./chatCardFormatter.service.js";
import { findWithRelaxation } from "./fallbackRelaxation.service.js";

const CATEGORY_CANONICAL_MAP = {
  restaurant: "food",
  resto: "food",
  cafe: "food",
  food: "food",
  sport: "sport",
  outdoor: "outdoor",
  fun: "fun",
  divertissement: "fun",
  creative: "creative",
  culture: "creative",
};

/**
 * Traduit les contraintes NLU en filtres pour le moteur centralisé de recommandation.
 */
export function buildCentralRecommendationFilters(constraints = {}) {
  const filters = {};

  if (typeof constraints.city === "string" && constraints.city.trim()) {
    filters.city = constraints.city.trim();
  }

  const cat =
    constraints.category ||
    (Array.isArray(constraints.categories) && constraints.categories[0] ? constraints.categories[0] : null);
  if (cat && typeof cat === "string") {
    const rawCat = cat.toLowerCase().trim();
    filters.category = CATEGORY_CANONICAL_MAP[rawCat] || rawCat;
    if (rawCat === "cafe" || rawCat === "café" || rawCat === "9ahwa" || rawCat === "coffee") {
      filters.type = "cafe";
    } else if (rawCat === "restaurant" || rawCat === "resto" || rawCat === "ftour") {
      filters.type = "restaurant";
    }
  }

  if (constraints.budgetMax !== null && constraints.budgetMax !== undefined && Number.isFinite(Number(constraints.budgetMax))) {
    filters.budgetMax = Number(constraints.budgetMax);
  } else if (constraints.budgetLevel === "low") {
    filters.budgetMax = 35;
  } else if (constraints.budget) {
    filters.budget = constraints.budget;
  }

  if (constraints.group && typeof constraints.group === "string") {
    filters.group = constraints.group;
  }

  if (constraints.situation && typeof constraints.situation === "string") {
    filters.situation = constraints.situation === "cold" ? "rain" : constraints.situation;
  }

  if (constraints.mood && typeof constraints.mood === "string") {
    filters.mood = constraints.mood;
  }

  if (constraints.hasPromo) {
    filters.hasPromo = true;
  }

  if (constraints.isEvening || constraints.situation === "night") {
    filters.isEvening = true;
    filters.situation = "night";
  }

  if (constraints.durationMin !== undefined || constraints.durationMax !== undefined) {
    if (constraints.durationMin !== undefined) filters.durationMin = constraints.durationMin;
    if (constraints.durationMax !== undefined) filters.durationMax = constraints.durationMax;
  }

  return filters;
}

/**
 * Exécute une recherche de recommandations centralisée avec fallback gracieux.
 */
export async function findChatRecommendations({
  repository,
  constraints = {},
  limit = 5,
  excludeIds = [],
} = {}) {
  const exclude = new Set(excludeIds.map(String));
  const targetNeighborhood = constraints.neighborhood || (constraints.neighborhoods?.[0]);
  let isZoneAlternative = false;
  let requestedZone = targetNeighborhood || null;

  // 1. En environnement réel avec Mongo actif : exploiter le moteur centralisé de recommandations
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const { getRecommendations } = await import("../../../activity-recommendation.service.js");
      const filters = buildCentralRecommendationFilters(constraints);

      let activities = [];
      let relaxed = [];

      // Si un quartier/délégation précis de Sfax est demandé (ex: Gremda, Chihia)
      if (targetNeighborhood) {
        const esc = targetNeighborhood.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const neighRx = new RegExp(esc, "i");
        const neighQuery = {
          isApproved: true,
          $or: [{ address: neighRx }, { locationName: neighRx }, { name: neighRx }, { description: neighRx }],
        };
        if (filters.type) {
          neighQuery.type = filters.type;
        } else if (filters.category) {
          neighQuery.category = filters.category;
        }
        if (filters.city) neighQuery.city = new RegExp(filters.city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

        let directHits = await Activity.find(neighQuery)
          .populate("createdBy", "name role establishmentName")
          .sort({ rating: -1, _id: 1 })
          .limit(limit + exclude.size)
          .lean();

        // Si aucun résultat avec type strict (ex: café spécifique), essayer la catégorie plus large (ex: food)
        if (!directHits.length && filters.type && filters.category) {
          delete neighQuery.type;
          neighQuery.category = filters.category;
          directHits = await Activity.find(neighQuery)
            .populate("createdBy", "name role establishmentName")
            .sort({ rating: -1, _id: 1 })
            .limit(limit + exclude.size)
            .lean();
        }

        activities = directHits.filter((a) => !exclude.has(String(a._id ?? a.id)));

        // Si aucun lieu n'est encore enregistré dans cette délégation précise,
        // on bascule automatiquement vers les meilleures alternatives à Sfax !
        if (!activities.length) {
          isZoneAlternative = true;
          relaxed.push("quartier");
        }
      }

      // Si pas de quartier demandé OU si 0 résultat dans le quartier -> recommandation globale Sfax / critères
      if (!activities.length) {
        const result = await getRecommendations(filters, "rating", { page: 1, limit: limit + exclude.size });
        activities = (result.activities || []).filter((a) => !exclude.has(String(a._id ?? a.id)));

        // Si 0 résultat avec filtres stricts, tenter un relâchement progressif en cascade
        if (!activities.length && (filters.situation || filters.budgetMax || filters.category || filters.city)) {
          const relaxedFilters = { ...filters };
          if (relaxedFilters.situation) {
            delete relaxedFilters.situation;
            relaxed.push("situation");
          }
          if (relaxedFilters.budgetMax) {
            relaxedFilters.budgetMax = relaxedFilters.budgetMax * 1.4;
            relaxed.push("budget");
          }
          let relaxedResult = await getRecommendations(relaxedFilters, "rating", { page: 1, limit });
          activities = (relaxedResult.activities || []).filter((a) => !exclude.has(String(a._id ?? a.id)));

          // Relâcher la catégorie dans la ville si toujours vide
          if (!activities.length && relaxedFilters.category) {
            delete relaxedFilters.category;
            relaxed.push("catégorie");
            relaxedResult = await getRecommendations(relaxedFilters, "rating", { page: 1, limit });
            activities = (relaxedResult.activities || []).filter((a) => !exclude.has(String(a._id ?? a.id)));
          }

          // Relâcher la ville si toujours vide
          if (!activities.length && relaxedFilters.city) {
            delete relaxedFilters.city;
            relaxed.push("ville");
            relaxedResult = await getRecommendations(relaxedFilters, "rating", { page: 1, limit });
            activities = (relaxedResult.activities || []).filter((a) => !exclude.has(String(a._id ?? a.id)));
          }
        }
      }

      const topActivities = activities.slice(0, limit);
      const cards = formatActivityCards(topActivities);
      return {
        activities: topActivities,
        cards,
        relaxed,
        isZoneAlternative,
        requestedZone,
      };
    } catch {
      // Repli sur le fallback repository en cas d'erreur de moteur
    }
  }

  // 2. Mode mock / test / hors-ligne : délégation au fallback avec le repository fourni
  const { activities, relaxed } = await findWithRelaxation({
    repository,
    constraints,
    limit,
    excludeIds,
  });

  if (targetNeighborhood && relaxed.includes("neighborhood")) {
    isZoneAlternative = true;
  }

  const cards = formatActivityCards(activities);
  return {
    activities,
    cards,
    relaxed,
    isZoneAlternative,
    requestedZone,
  };
}

