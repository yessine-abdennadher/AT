import express from "express";
import {
  getStats,
  getUsers,
  changeUserStatus,
  changeUserRole,
  getActivitiesForModeration,
  setActivityApproval,
  toggleHighlight,
  removeActivity,
  getDiagnostics,
  changePartnerTier,
  changeGlobalElectricityMode,
} from "../controllers/admin.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Toutes les routes admin nécessitent une authentification et le rôle "admin"
router.use(protect);
router.use(authorize("admin"));

// KPI & Métriques & Diagnostics & Mode Alerte Électricité
router.get("/stats", getStats);
router.get("/diagnostics", getDiagnostics);
router.patch("/electricity-mode", changeGlobalElectricityMode);

// Gestion des Utilisateurs & Partenaires
router.get("/users", getUsers);
router.patch("/users/:id/status", changeUserStatus);
router.patch("/users/:id/role", changeUserRole);
router.patch("/partners/:id/tier", changePartnerTier);

// Modération des Activités
router.get("/activities", getActivitiesForModeration);
router.patch("/activities/:id/approve", setActivityApproval);
router.patch("/activities/:id/highlight", toggleHighlight);
router.delete("/activities/:id", removeActivity);

export default router;
