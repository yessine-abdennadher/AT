import * as authService from "../services/auth.service.js";

// @desc    Inscription d'un nouvel utilisateur (user ou partner)
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json({
      success: true,
      message: "Compte créé avec succès",
      token: result.accessToken,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
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
    res.json({
      success: true,
      message: "Connexion réussie",
      token: result.accessToken,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
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
    const result = await authService.refreshAccessToken(req.body.refreshToken);
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
    await authService.logoutUser(req.user?.id, req.body.refreshToken);
    res.json({ success: true, message: "Déconnexion réussie." });
  } catch (error) {
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
    res.status(200).json({
      success: true,
      token: result.accessToken,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};
