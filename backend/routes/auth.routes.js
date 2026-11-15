import express from "express";
import {
  registerUser,
  loginUser,
  verifyAdminLoginOtp,
  refreshToken,
  logoutUser,
  getMe,
  updateProfile,
  getFavorites,
  googleAuth,
  sendPartnerOtp,
  verifyPartnerOtp,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
} from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { authLimiter, otpVerifyLimiter } from "../middlewares/rateLimit.middleware.js";

const router = express.Router();

// Onboarding Partenaire sécurisé avec OTP 2FA (Resend)
router.post("/partner/send-otp", authLimiter, sendPartnerOtp);
router.post("/partner/verify-otp", otpVerifyLimiter, verifyPartnerOtp);

router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/verify-reset-otp", otpVerifyLimiter, verifyResetOtp);
router.post("/reset-password", otpVerifyLimiter, resetPassword);
router.post("/admin/mfa/verify", authLimiter, verifyAdminLoginOtp);
router.post("/google", authLimiter, googleAuth);
router.post("/refresh", authLimiter, refreshToken);
router.post("/logout", authLimiter, logoutUser);
router.get("/me", protect, getMe);
router.get("/favorites", protect, getFavorites);
router.put("/profile", protect, updateProfile);
router.patch("/profile", protect, updateProfile);

export default router;
