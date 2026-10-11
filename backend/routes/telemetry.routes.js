import express from "express";
import { trackEvent } from "../controllers/telemetry.controller.js";
import { optionalAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/track", optionalAuth, trackEvent);

export default router;
