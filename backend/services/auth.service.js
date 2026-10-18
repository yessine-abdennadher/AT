import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { JWT_SECRET, JWT_REFRESH_SECRET, JWT_EXPIRE } from "../config/jwt.config.js";

// Génération de tokens JWT
export const generateAccessToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRE || "1h",
  });
};

export const generateRefreshToken = (id) => {
  return jwt.sign({ id }, JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d",
  });
};

// Formateur de données utilisateur sécurisé
export const formatUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  userType: user.userType,
  partnerTier: user.partnerTier || "standard",
  establishmentName: user.establishmentName || "",
  avatar: user.avatar,
  bio: user.bio,
  city: user.city,
  lastLogin: user.lastLogin,
});

/**
 * Inscription d'un nouvel utilisateur
 */
export const registerUser = async ({ name, email, password, role, establishmentName, bio }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error("Cet email est déjà enregistré.");
    error.statusCode = 400;
    throw error;
  }

  // Le rôle admin est strictement interdit à l'inscription publique
  const assignedRole = role === "partner" ? "partner" : "user";

  const user = await User.create({
    name,
    email,
    password,
    role: assignedRole,
    establishmentName: assignedRole === "partner" ? (establishmentName || "") : "",
    bio: bio || "",
  });

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshTokens.push(refreshToken);
  await user.save({ validateBeforeSave: false });

  return {
    accessToken,
    refreshToken,
    user: formatUserResponse(user),
  };
};

/**
 * Connexion avec email & mot de passe
 */
export const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    const error = new Error("Veuillez fournir un email et un mot de passe.");
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email ? email.trim().toLowerCase() : "";
  const user = await User.findOne({ email: normalizedEmail }).select("+password");
  if (!user || !(await user.matchPassword(password))) {
    const error = new Error("Email ou mot de passe incorrect.");
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error("Votre compte est désactivé. Veuillez contacter un administrateur.");
    error.statusCode = 403;
    throw error;
  }

  user.lastLogin = new Date();

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Conserver au maximum 5 sessions actives
  if (user.refreshTokens.length >= 5) {
    user.refreshTokens.shift();
  }
  user.refreshTokens.push(refreshToken);

  await user.save({ validateBeforeSave: false });

  return {
    accessToken,
    refreshToken,
    user: formatUserResponse(user),
  };
};

/**
 * Renouvellement du token d'accès via le refresh token
 */
export const refreshAccessToken = async (tokenFromReq) => {
  if (!tokenFromReq) {
    const error = new Error("Refresh token obligatoire.");
    error.statusCode = 400;
    throw error;
  }

  let decoded;
  try {
    decoded = jwt.verify(tokenFromReq, JWT_REFRESH_SECRET);
  } catch (err) {
    const error = new Error("Refresh token invalide ou expiré.");
    error.statusCode = 401;
    throw error;
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.refreshTokens.includes(tokenFromReq)) {
    const error = new Error("Refresh token non reconnu ou révoqué.");
    error.statusCode = 401;
    throw error;
  }

  const newAccessToken = generateAccessToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);

  // Rotation des tokens
  user.refreshTokens = user.refreshTokens.filter((t) => t !== tokenFromReq);
  user.refreshTokens.push(newRefreshToken);
  await user.save({ validateBeforeSave: false });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

/**
 * Déconnexion / Révocation de session
 */
export const logoutUser = async (userId, refreshToken) => {
  if (userId && refreshToken) {
    const user = await User.findById(userId);
    if (user) {
      user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
      await user.save({ validateBeforeSave: false });
    }
  }
  return true;
};

/**
 * Récupération du profil
 */
export const getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("Utilisateur introuvable.");
    error.statusCode = 404;
    throw error;
  }
  return formatUserResponse(user);
};

/**
 * Mise à jour du profil
 */
export const updateUserProfile = async (userId, { name, bio, avatar, establishmentName }, userRole) => {
  const fieldsToUpdate = {};
  if (name) fieldsToUpdate.name = name;
  if (bio !== undefined) fieldsToUpdate.bio = bio;
  if (avatar) fieldsToUpdate.avatar = avatar;
  if (establishmentName !== undefined && userRole === "partner") {
    fieldsToUpdate.establishmentName = establishmentName;
  }

  const updatedUser = await User.findByIdAndUpdate(userId, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  if (!updatedUser) {
    const error = new Error("Utilisateur introuvable.");
    error.statusCode = 404;
    throw error;
  }

  return formatUserResponse(updatedUser);
};

/**
 * Récupération des favoris
 */
export const getUserFavorites = async (userId) => {
  const user = await User.findById(userId).populate("favorites");
  if (!user) {
    const error = new Error("Utilisateur introuvable.");
    error.statusCode = 404;
    throw error;
  }

  const favoriteIds = (user.favorites || []).map((fav) => fav._id?.toString() || fav.toString());
  return {
    count: user.favorites.length,
    favoriteIds,
    favorites: user.favorites,
  };
};

/**
 * Authentification avec Google OAuth
 */
export const authenticateWithGoogle = async ({
  idToken,
  accessToken: googleAccessToken,
  email,
  name,
  avatar,
  googleId,
}) => {
  let verifiedEmail = email;
  let verifiedName = name;
  let verifiedAvatar = avatar;
  let verifiedGoogleId = googleId;

  // 1. Validation de l'idToken auprès de Google
  if (idToken) {
    try {
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
      if (response.ok) {
        const payload = await response.json();
        if (payload && payload.email) {
          verifiedEmail = payload.email;
          verifiedName = payload.name || verifiedName;
          verifiedAvatar = payload.picture || verifiedAvatar;
          verifiedGoogleId = payload.sub || verifiedGoogleId;
        }
      }
    } catch (tokenErr) {
      console.warn("[AuthService] Erreur validation idToken Google:", tokenErr.message);
    }
  } else if (googleAccessToken) {
    // 2. Validation avec Access Token Google
    try {
      const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${googleAccessToken}` },
      });
      if (response.ok) {
        const payload = await response.json();
        if (payload && payload.email) {
          verifiedEmail = payload.email;
          verifiedName = payload.name || verifiedName;
          verifiedAvatar = payload.picture || verifiedAvatar;
          verifiedGoogleId = payload.sub || verifiedGoogleId;
        }
      }
    } catch (oauthErr) {
      console.warn("[AuthService] Erreur récupération userinfo Google:", oauthErr.message);
    }
  }

  if (!verifiedEmail) {
    const error = new Error("Email Google manquant ou invalide.");
    error.statusCode = 400;
    throw error;
  }

  // 3. Recherche de l'utilisateur dans MongoDB
  const query = verifiedGoogleId
    ? { $or: [{ email: verifiedEmail.toLowerCase() }, { googleId: verifiedGoogleId }] }
    : { email: verifiedEmail.toLowerCase() };

  let user = await User.findOne(query);

  if (user) {
    if (!user.googleId && verifiedGoogleId) {
      user.googleId = verifiedGoogleId;
    }
    if (verifiedAvatar && (!user.avatar || user.avatar.includes("unsplash"))) {
      user.avatar = verifiedAvatar;
    }
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
  } else {
    user = await User.create({
      name: verifiedName || verifiedEmail.split("@")[0],
      email: verifiedEmail.toLowerCase(),
      avatar: verifiedAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
      role: "user",
      provider: "google",
      googleId: verifiedGoogleId || null,
      lastLogin: new Date(),
    });
  }

  // 4. Génération des tokens JWT sécurisés
  const appAccessToken = generateAccessToken(user._id);
  const appRefreshToken = generateRefreshToken(user._id);

  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push(appRefreshToken);
  await user.save({ validateBeforeSave: false });

  return {
    accessToken: appAccessToken,
    refreshToken: appRefreshToken,
    user: formatUserResponse(user),
  };
};
