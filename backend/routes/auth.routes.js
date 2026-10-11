import express from "express";
import {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  getMe,
  updateProfile,
  getFavorites,
  googleAuth,
} from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { authLimiter } from "../middlewares/rateLimit.middleware.js";

const router = express.Router();

router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);
router.post("/google", authLimiter, googleAuth);
router.post("/refresh", authLimiter, refreshToken);
router.post("/logout", protect, logoutUser);
router.get("/me", protect, getMe);
router.get("/favorites", protect, getFavorites);
router.put("/profile", protect, updateProfile);

export default router;
