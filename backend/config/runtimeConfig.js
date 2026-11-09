const DEVELOPMENT_ORIGINS = [
  "http://localhost:5173", "http://localhost:4173", "http://localhost:8081", "http://localhost:8082",
];

export const parseAllowedOrigins = ({ nodeEnv = "development", corsOrigin = "" } = {}) => {
  const raw = String(corsOrigin || "").trim();
  if (!raw) {
    if (nodeEnv === "production") throw new Error("CORS_ORIGIN est obligatoire en production.");
    return DEVELOPMENT_ORIGINS;
  }
  const origins = raw.split(",").map((item) => item.trim());
  if (origins.some((origin) => !origin)) throw new Error("CORS_ORIGIN contient une origine vide.");
  return origins.map((origin) => {
    let parsed;
    try { parsed = new URL(origin); } catch { throw new Error(`Origine CORS invalide : ${origin}`); }
    if (nodeEnv === "production" && parsed.protocol !== "https:") {
      throw new Error(`CORS_ORIGIN doit utiliser HTTPS en production : ${origin}`);
    }
    if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password ||
      parsed.pathname !== "/" || parsed.search || parsed.hash || parsed.origin === "null") {
      throw new Error(`CORS_ORIGIN doit contenir uniquement des origines HTTP(S) : ${origin}`);
    }
    return parsed.origin;
  });
};

export const parseTrustProxyHops = (raw) => {
  if (raw === undefined) return undefined;
  const value = String(raw).trim();
  const hops = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(hops) || hops > 5) {
    throw new Error("TRUST_PROXY_HOPS doit être un entier compris entre 0 et 5.");
  }
  return hops;
};

export const resolveMongoUri = ({ nodeEnv = "development", mongoUri = "" } = {}) => {
  const configured = String(mongoUri || "").trim();
  if (configured) return configured;
  if (nodeEnv === "production") throw new Error("MONGODB_URI est obligatoire en production.");
  return "mongodb://127.0.0.1:27017/activitytn_db";
};
