import express from "express";
import {
  listActivities,
  getActivity,
  getRecommendations,
  toggleFavorite,
  createActivity,
  updateActivity,
  deleteActivity,
  getActivityReviews,
  addReview,
  updateReview,
  deleteReview,
  reactToReview,
  getPartnerActivities,
  setPowerMode,
  setPromotion,
  createEvent,
  getSystemStatus,
  getSearchSuggestions,
  postPowerReport,
} from "../controllers/activity.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/system-status", getSystemStatus);
router.get("/suggestions", getSearchSuggestions);
router.get("/", listActivities);
router.post("/recommendations", getRecommendations);

// Signalement communautaire de l'état du courant / lumière
router.post("/:id/power-report", protect, postPowerReport);

// Espace Partenaire : Mes activités créées, mode électricité, promotions et événements
router.get("/partner/my-activities", protect, authorize("admin", "partner"), getPartnerActivities);
router.patch("/partner/:id/power-mode", protect, authorize("admin", "partner"), setPowerMode);
router.patch("/partner/:id/promotion", protect, authorize("admin", "partner"), setPromotion);
router.post("/partner/:id/events", protect, authorize("admin", "partner"), createEvent);

router.post("/:id/favorite", protect, toggleFavorite);
router.get("/:id", getActivity);

// ── Routes des Avis & Réactions ─────────────────────────────────────────────
router.get("/:id/reviews", getActivityReviews);
router.post("/:id/reviews", protect, addReview);
router.put("/:id/reviews/:reviewId", protect, updateReview);
router.delete("/:id/reviews/:reviewId", protect, deleteReview);
router.post("/:id/reviews/:reviewId/react", protect, reactToReview);

// ── Routes d'administration et partenaires ──────────────────────────────────
router.post("/", protect, authorize("admin", "partner"), createActivity);
router.put("/:id", protect, authorize("admin", "partner"), updateActivity);
router.delete("/:id", protect, authorize("admin", "partner"), deleteActivity);

export default router;
