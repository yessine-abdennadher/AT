import express from "express";
import {
  getNotifications,
  markAsRead,
  markAllRead,
  deleteNotif,
} from "../controllers/notification.controller.js";
import { optionalAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Récupérer les notifications selon le rôle et l'utilisateur
router.get("/", optionalAuth, getNotifications);

// Marquer une notification comme lue
router.patch("/:id/read", optionalAuth, markAsRead);

// Marquer toutes les notifications comme lues
router.patch("/read-all", optionalAuth, markAllRead);

// Supprimer une notification
router.delete("/:id", optionalAuth, deleteNotif);

export default router;
