import dotenv from "dotenv";
dotenv.config();

const DEFAULT_DEV_SECRET = "activitytn_secret_jwt_key_2026";
const DEFAULT_DEV_REFRESH_SECRET = "activitytn_refresh_secret_dev_only_2026";

export const getJwtSecrets = (env = process.env) => {
  const accessSecret = env.JWT_SECRET || DEFAULT_DEV_SECRET;
  const refreshSecret = env.JWT_REFRESH_SECRET || DEFAULT_DEV_REFRESH_SECRET;
  if (env.NODE_ENV === "production") {
    if (!env.JWT_SECRET || !env.JWT_REFRESH_SECRET || accessSecret.length < 32 || refreshSecret.length < 32 || accessSecret === refreshSecret) {
      throw new Error("JWT_SECRET et JWT_REFRESH_SECRET doivent être définis, distincts et contenir au moins 32 caractères en production.");
    }
  }
  return { accessSecret, refreshSecret };
};

const configuredSecrets = getJwtSecrets();
export const JWT_SECRET = configuredSecrets.accessSecret;
export const JWT_REFRESH_SECRET = configuredSecrets.refreshSecret;
export const JWT_EXPIRE = process.env.JWT_EXPIRE || "30d";
