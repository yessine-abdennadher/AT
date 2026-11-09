import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { JWT_SECRET } from "../config/jwt.config.js";
import { checkAndHandleExpiration } from "../services/partner-subscription.service.js";

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else {
    const cookies = Object.fromEntries(String(req.headers.cookie || "").split(";").map((part) => {
      const separator = part.indexOf("=");
      return separator < 0 ? ["", ""] : [part.slice(0, separator).trim(), part.slice(separator + 1).trim()];
    }));
    token = cookies.activitytn_access || null;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);

      if (!decoded.sid) {
        return res.status(401).json({ success: false, message: "Session expirée ou non autorisée" });
      }

      req.user = await User.findById(decoded.id).select("-password +activeAccessSessionIds");
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Utilisateur non trouvé ou supprimé" });
      }

      if (!req.user.isActive) {
        return res.status(403).json({ success: false, message: "Votre compte a été désactivé" });
      }

      if (req.user.role === "admin" && decoded.mfa !== true) {
        return res.status(401).json({ success: false, message: "Les administrateurs doivent renouveler leur authentification multifacteur." });
      }

      if (!req.user.activeAccessSessionIds.includes(decoded.sid)) {
        return res.status(401).json({ success: false, message: "Session révoquée ou expirée" });
      }

      req.authSessionId = decoded.sid;

      // Verrou de sécurité : auto-expiration pour les abonnements partenaires échus
      await checkAndHandleExpiration(req.user);

      return next();
    } catch (error) {
      console.error("[AuthMiddleware] Token invalide :", error.message);
      return res.status(401).json({ success: false, message: "Session expirée ou non autorisée" });
    }
  }

  return res.status(401).json({ success: false, message: "Accès refusé : aucun token d'authentification fourni" });
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Accès interdit : le rôle [${req.user?.role}] n'a pas la permission requise.`,
      });
    }
    next();
  };
};

export const authenticateToken = protect;
export const requireAdmin = authorize("admin");

export const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.sid) {
        const user = await User.findById(decoded.id).select("-password +activeAccessSessionIds");
        if (user?.isActive && (user.role !== "admin" || decoded.mfa === true) && user.activeAccessSessionIds.includes(decoded.sid)) {
          req.user = user;
        }
      }
    } catch {
      // Si token invalide ou absent, on continue en mode invité
    }
  }
  next();
};


