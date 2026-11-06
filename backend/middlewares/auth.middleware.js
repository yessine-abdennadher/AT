import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { JWT_SECRET } from "../config/jwt.config.js";
import { checkAndHandleExpiration } from "../services/partner-subscription.service.js";

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Utilisateur non trouvé ou supprimé" });
      }

      if (!req.user.isActive) {
        return res.status(403).json({ success: false, message: "Votre compte a été désactivé" });
      }

      // Verrou de sécurité : auto-expiration pour les abonnements partenaires échus
      await checkAndHandleExpiration(req.user);

      return next();
    } catch (error) {
      console.error("[AuthMiddleware] Token invalide :", error.message);
      return res.status(401).json({ success: false, message: "Session expirée ou non autorisée" });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Accès refusé : aucun token d'authentification fourni" });
  }
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
      req.user = await User.findById(decoded.id).select("-password");
    } catch {
      // Si token invalide ou absent, on continue en mode invité
    }
  }
  next();
};


