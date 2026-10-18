import dotenv from "dotenv";
import { createApp } from "./app.js";
import { connectDB } from "./config/db.js";
import { autoSeedIfEmpty } from "./seeders/autoSeed.js";

dotenv.config();

export const startServer = async ({
  port = process.env.PORT || 5000,
  listen = (app, value) => app.listen(value, "0.0.0.0"),
  connect = connectDB,
  seed = autoSeedIfEmpty,
  appFactory = createApp,
  env = process.env,
} = {}) => {
  const app = appFactory({ env });
  await connect();
  if (env.NODE_ENV !== "production" || env.AUTO_SEED === "true") {
    await seed();
  } else {
    console.log("🔒 [Security] Auto-seed désactivé en mode production.");
  }
  const server = listen(app, port);
  console.log(`🚀 [Server] Serveur backend démarré sur http://0.0.0.0:${port} (${env.NODE_ENV || "development"})`);
  return server;
};

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1].replaceAll("\\", "/")}`).href) {
  startServer().catch((error) => {
    console.error(`❌ [Server] Démarrage impossible : ${error.message}`);
    process.exitCode = 1;
  });
}
