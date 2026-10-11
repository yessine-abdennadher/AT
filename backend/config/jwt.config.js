import dotenv from "dotenv";
dotenv.config();

const DEFAULT_DEV_SECRET = "activitytn_secret_jwt_key_2026";

// En production, interdiction absolue d'utiliser le secret par défaut
if (process.env.NODE_ENV === "production") {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === DEFAULT_DEV_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error("❌ [SÉCURITÉ CRITIQUE] JWT_SECRET manquant, trop court ou utilisant la clé de développement en production !");
    process.exit(1);
  }
}

export const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_DEV_SECRET;
export const JWT_EXPIRE = process.env.JWT_EXPIRE || "30d";
