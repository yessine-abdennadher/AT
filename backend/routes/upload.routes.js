import express from "express";
import { uploadImage } from "../controllers/upload.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Route protégée : seuls les utilisateurs authentifiés peuvent uploader des images
router.post("/image", protect, uploadImage);

export default router;
