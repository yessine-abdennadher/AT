import { incrementRateLimitCounter } from "../services/rateLimitStore.service.js";

export const createRateLimiter = ({
  scope = "api",
  windowMs = 15 * 60 * 1000,
  max = 100,
  message = "Trop de requêtes effectuées depuis cette adresse IP. Veuillez réessayer plus tard.",
  incrementCounter = incrementRateLimitCounter,
  now = Date.now,
} = {}) => async (req, res, next) => {
  const route = req.route?.path || req.baseUrl || "/";
  const key = `${scope}:${req.method || "GET"}:${route}:${req.ip || "unknown_ip"}`;
  let counter;

  try {
    counter = await incrementCounter({ key, windowMs, now: now() });
  } catch {
    return res.status(503).json({
      success: false,
      message: "Le contrôle de débit est temporairement indisponible.",
    });
  }

  const remaining = Math.max(0, max - counter.count);
  const retryAfterSeconds = Math.max(1, Math.ceil((counter.resetAt - now()) / 1000));
  res.setHeader("RateLimit-Limit", max);
  res.setHeader("RateLimit-Remaining", remaining);
  res.setHeader("RateLimit-Reset", Math.ceil(counter.resetAt / 1000));
  res.setHeader("X-RateLimit-Limit", max);
  res.setHeader("X-RateLimit-Remaining", remaining);
  res.setHeader("X-RateLimit-Reset", Math.ceil(counter.resetAt / 1000));

  if (counter.count > max) {
    res.setHeader("Retry-After", retryAfterSeconds);
    return res.status(429).json({ success: false, message, retryAfterSeconds });
  }

  return next();
};

export const authLimiter = createRateLimiter({
  scope: "auth",
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Trop de tentatives de connexion ou d'inscription. Veuillez patienter 15 minutes.",
});

export const chatSessionLimiter = createRateLimiter({
  scope: "chat-session",
  windowMs: 60 * 1000,
  max: 20,
  message: "Trop de conversations créées. Veuillez réessayer plus tard.",
});

export const chatLimiter = createRateLimiter({
  scope: "chat-message",
  windowMs: 60 * 1000,
  max: 20,
  message: "Veuillez ralentir l'envoi de messages au chatbot.",
});
