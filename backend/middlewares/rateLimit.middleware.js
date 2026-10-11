/**
 * rateLimit.middleware.js
 * Rate Limiter en mémoire pour protéger les endpoints sensibles (authentification, chat).
 */

export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000, // 15 minutes par défaut
  max = 100, // 100 requêtes max par IP
  message = "Trop de requêtes effectuées depuis cette adresse IP. Veuillez réessayer plus tard.",
} = {}) => {
  const requests = new Map();

  // Nettoyage périodique pour libérer la mémoire
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of requests.entries()) {
      const validTimestamps = timestamps.filter((t) => now - t < windowMs);
      if (validTimestamps.length === 0) {
        requests.delete(ip);
      } else {
        requests.set(ip, validTimestamps);
      }
    }
  }, 5 * 60 * 1000);

  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req, res, next) => {
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown_ip";
    const now = Date.now();

    const timestamps = requests.get(ip) || [];
    const recentTimestamps = timestamps.filter((t) => now - t < windowMs);

    if (recentTimestamps.length >= max) {
      return res.status(429).json({
        success: false,
        message,
        retryAfterSeconds: Math.ceil((recentTimestamps[0] + windowMs - now) / 1000),
      });
    }

    recentTimestamps.push(now);
    requests.set(ip, recentTimestamps);

    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - recentTimestamps.length));

    next();
  };
};

// Limiteur pour les routes d'authentification (login, register, google, refresh)
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 30, // 30 requêtes max / 15 min
  message: "Trop de tentatives de connexion ou d'inscription. Veuillez patienter 15 minutes.",
});

// Limiteur pour les requêtes au chatbot IA
export const chatLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 20, // 20 messages / min
  message: "Veuillez ralentir l'envoi de messages au chatbot.",
});
