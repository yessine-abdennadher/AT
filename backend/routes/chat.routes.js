import express from "express";
import { getOrCreateSession, sendMessage, getHistory } from "../controllers/chat.controller.js";
import { chatLimiter, chatSessionLimiter } from "../middlewares/rateLimit.middleware.js";

const router = express.Router();

router.post("/session", chatSessionLimiter, getOrCreateSession);
router.post("/send", chatLimiter, sendMessage);
router.get("/history/:sessionId", getHistory);

export default router;
