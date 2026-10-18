import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import activityRoutes from "./routes/activity.routes.js";
import cityRoutes from "./routes/city.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import telemetryRoutes from "./routes/telemetry.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import { autoSeedIfEmpty } from "./seeders/autoSeed.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Connect to MongoDB & Auto-seed sécurisé (uniquement hors production)
connectDB().then(() => {
  if (process.env.NODE_ENV !== "production" || process.env.AUTO_SEED === "true") {
    autoSeedIfEmpty();
  } else {
    console.log("🔒 [Security] Auto-seed désactivé en mode production.");
  }
});

const app = express();

if (process.env.TRUST_PROXY_HOPS !== undefined) {
  const rawProxyHops = process.env.TRUST_PROXY_HOPS.trim();
  const proxyHops = Number(rawProxyHops);
  if (!/^\d+$/.test(rawProxyHops) || !Number.isSafeInteger(proxyHops) || proxyHops > 5) {
    throw new Error("TRUST_PROXY_HOPS doit être un entier compris entre 0 et 5.");
  }
  app.set("trust proxy", proxyHops);
}

// Security and Logging Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Configuration CORS sécurisée
const rawOrigins = process.env.CORS_ORIGIN || "";
const allowedOrigins = rawOrigins
  ? rawOrigins.split(",").map((s) => s.trim())
  : ["http://localhost:5173", "http://localhost:4173", "http://localhost:8081", "http://localhost:8082"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Requêtes sans origin (applications mobiles React Native, curl, cron)
      if (!origin) return callback(null, true);
      if (
        process.env.NODE_ENV !== "production" ||
        allowedOrigins.includes("*") ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error("Accès bloqué par la politique CORS de sécurité."));
    },
    credentials: true,
  })
);

// Limites de taille de corps de requête sécurisées (2 Mo par défaut pour prévenir le DoS)
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// Servir les fichiers uploadés publiquement
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "ActivityTN MongoDB Backend API",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/cities", cityRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/telemetry", telemetryRoutes);
app.use("/api/notifications", notificationRoutes);

// 404 Handler pour les routes non trouvées
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route introuvable : ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler Middleware
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 [Server] Serveur backend démarré sur http://0.0.0.0:${PORT} (${process.env.NODE_ENV || "development"})`);
});
