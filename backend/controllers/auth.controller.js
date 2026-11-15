import * as authService from "../services/auth.service.js";

const readCookie = (req, name) => {
  const item = String(req.headers.cookie || "").split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return item ? item.slice(name.length + 1) : null;
};

const setBrowserSession = (req, res, result) => {
  const origin = req.get("origin");
  const allowedOrigins = req.app.locals.allowedOrigins || [];
  if (!origin || !allowedOrigins.includes(origin)) return false;
  const secure = process.env.NODE_ENV === "production";
  const sameSite = secure ? "none" : "lax";
  res.cookie("activitytn_access", result.accessToken, {
    httpOnly: true, secure, sameSite, path: "/api", maxAge: 15 * 60 * 1000,
  });
  res.cookie("activitytn_refresh", result.refreshToken, {
    httpOnly: true, secure, sameSite, path: "/api/auth", maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return true;
};

const clearBrowserSession = (res) => {
  const secure = process.env.NODE_ENV === "production";
  const sameSite = secure ? "none" : "lax";
  res.clearCookie("activitytn_access", { httpOnly: true, secure, sameSite, path: "/api" });
  res.clearCookie("activitytn_refresh", { httpOnly: true, secure, sameSite, path: "/api/auth" });
};

// @desc    Inscription d'un nouvel utilisateur (user ou partner)
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);
    const browserSession = setBrowserSession(req, res, result);
    res.status(201).json({
      success: true,
      message: "Compte créé avec succès",
      ...(!browserSession ? { token: result.accessToken, accessToken: result.accessToken, refreshToken: result.refreshToken } : {}),
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Connexion utilisateur
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body);
    if (result.mfaRequired) {
      return res.status(202).json({ success: true, mfaRequired: true, challengeId: result.challengeId, maskedEmail: result.maskedEmail });
    }
    const browserSession = setBrowserSession(req, res, result);
    res.json({
      success: true,
      message: "Connexion réussie",
      ...(!browserSession ? { token: result.accessToken, accessToken: result.accessToken, refreshToken: result.refreshToken } : {}),
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyAdminLoginOtp = async (req, res, next) => {
  try {
    const result = await authService.verifyAdminLoginOtp(req.body);
    const browserSession = setBrowserSession(req, res, result);
    res.json({
      success: true,
      message: "Authentification administrateur confirmée.",
      ...(!browserSession ? { accessToken: result.accessToken, refreshToken: result.refreshToken } : {}),
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Rafraîchissement du token d'accès via le refresh token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshToken = async (req, res, next) => {
  try {
    const result = await authService.refreshAccessToken(req.body?.refreshToken || readCookie(req, "activitytn_refresh"));
    if (setBrowserSession(req, res, result)) {
      return res.json({ success: true });
    }
    res.json({
      success: true,
      token: result.accessToken,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Déconnexion / Révocation du Refresh Token
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = async (req, res, next) => {
  try {
    await authService.logoutUser(null, req.body?.refreshToken || readCookie(req, "activitytn_refresh"));
    clearBrowserSession(res);
    res.json({ success: true, message: "Déconnexion réussie." });
  } catch (error) {
    clearBrowserSession(res);
    next(error);
  }
};

// @desc    Obtenir le profil de l'utilisateur connecté
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await authService.getUserProfile(req.user.id);
    res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mettre à jour son propre profil
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const updatedUser = await authService.updateUserProfile(
      req.user.id,
      req.body,
      req.user.role
    );
    res.json({
      success: true,
      message: "Profil mis à jour avec succès",
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir la liste des activités favorites de l'utilisateur connecté
// @route   GET /api/auth/favorites
// @access  Private
export const getFavorites = async (req, res, next) => {
  try {
    const result = await authService.getUserFavorites(req.user.id);
    res.json({
      success: true,
      count: result.count,
      favoriteIds: result.favoriteIds,
      favorites: result.favorites,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authentification / Connexion avec Google OAuth
// @route   POST /api/auth/google
// @access  Public
export const googleAuth = async (req, res, next) => {
  try {
    const result = await authService.authenticateWithGoogle(req.body);
    const browserSession = setBrowserSession(req, res, result);
    res.status(200).json({
      success: true,
      ...(!browserSession ? { token: result.accessToken, accessToken: result.accessToken, refreshToken: result.refreshToken } : {}),
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Étape 1 : Initialiser l'onboarding partenaire et envoyer le code OTP
// @route   POST /api/auth/partner/send-otp
// @access  Public
export const sendPartnerOtp = async (req, res, next) => {
  try {
    const result = await authService.sendPartnerOtp(req.body);
    res.status(200).json({
      success: true,
      message: `Code de sécurité envoyé à l'adresse ${result.email}`,
      email: result.email,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Étape 2 : Vérifier le code OTP et finaliser la création du compte partenaire
// @route   POST /api/auth/partner/verify-otp
// @access  Public
export const verifyPartnerOtp = async (req, res, next) => {
  try {
    const result = await authService.verifyPartnerOtp(req.body);
    const browserSession = setBrowserSession(req, res, result);
    res.status(201).json({
      success: true,
      message: "Adresse email vérifiée et Espace Partenaire créé avec succès.",
      ...(!browserSession ? { token: result.accessToken, accessToken: result.accessToken, refreshToken: result.refreshToken } : {}),
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Demande d'envoi de code de réinitialisation de mot de passe
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.sendPasswordResetOtp(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Vérification intermédiaire du code OTP avant changement de mot de passe
// @route   POST /api/auth/verify-reset-otp
// @access  Public
export const verifyResetOtp = async (req, res, next) => {
  try {
    const result = await authService.verifyPasswordResetOtp(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Validation du code et mise à jour du mot de passe
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPasswordWithOtp(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
