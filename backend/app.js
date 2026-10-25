import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
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
import { parseAllowedOrigins, parseTrustProxyHops } from "./config/runtimeConfig.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const createApp = ({ connectionState = mongoose.connection, env = process.env } = {}) => {
  const app = express();
  const proxyHops = parseTrustProxyHops(env.TRUST_PROXY_HOPS);
  if (proxyHops !== undefined) app.set("trust proxy", proxyHops);
  const allowedOrigins = parseAllowedOrigins({ nodeEnv: env.NODE_ENV, corsOrigin: env.CORS_ORIGIN });

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Accès bloqué par la politique CORS de sécurité."));
    },
    credentials: true,
  }));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));
  if (env.NODE_ENV !== "production") app.use(morgan("dev"));

  app.get("/health/live", (req, res) => res.json({ status: "ok", service: "Tfarhida API", timestamp: new Date().toISOString() }));
  const readiness = (req, res) => {
    const ready = connectionState.readyState === 1;
    return res.status(ready ? 200 : 503).json({ status: ready ? "ready" : "not_ready", service: "Tfarhida API" });
  };
  app.get("/health/ready", readiness);
  app.get("/health", readiness);

  app.use("/api/auth", authRoutes);
  app.use("/api/users", authRoutes);
  app.use("/api/chat", chatRoutes);
  app.use("/api/activities", activityRoutes);
  app.use("/api/cities", cityRoutes);
  app.use("/api/categories", categoryRoutes);
  app.use("/api/upload", uploadRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/telemetry", telemetryRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use((req, res) => res.status(404).json({ success: false, message: `Route introuvable : ${req.method} ${req.originalUrl}` }));
  app.use(errorHandler);
  return app;
};
