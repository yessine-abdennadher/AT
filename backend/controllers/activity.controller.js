import * as activityService from "../services/activity.service.js";

// @desc    Obtenir la liste de toutes les activités
// @route   GET /api/activities
// @access  Public
export const listActivities = async (req, res, next) => {
  try {
    const result = await activityService.getAllActivities(req.query);
    res.json({
      success: true,
      count: result.activities.length,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      hasMore: result.hasMore,
      electricityAlertActive: result.electricityAlertActive || false,
      activities: result.activities,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir l'état des options système globales (ex: Mode alerte électricité)
// @route   GET /api/activities/system-status
// @access  Public
export const getSystemStatus = async (req, res, next) => {
  try {
    const { getElectricityAlertStatus } = await import("../services/systemSetting.service.js");
    const electricityAlertActive = await getElectricityAlertStatus();
    res.json({
      success: true,
      electricityAlertActive,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir les détails d'une activité
// @route   GET /api/activities/:id
// @access  Public
export const getActivity = async (req, res, next) => {
  try {
    const activity = await activityService.getActivityById(req.params.id);
    res.json({ success: true, activity });
  } catch (error) {
    next(error);
  }
};

// @desc    Créer une nouvelle activité
// @route   POST /api/activities
// @access  Private (Admin / Partner)
export const createActivity = async (req, res, next) => {
  try {
    const activity = await activityService.createActivity(req.body, req.user.id, req.user.role);
    res.status(201).json({ success: true, message: "Activité créée avec succès", activity });
  } catch (error) {
    next(error);
  }
};

// @desc    Mettre à jour une activité
// @route   PUT /api/activities/:id
// @access  Private (Admin / Partner owner)
export const updateActivity = async (req, res, next) => {
  try {
    const activity = await activityService.updateActivity(req.params.id, req.body, req.user);
    res.json({ success: true, message: "Activité mise à jour avec succès", activity });
  } catch (error) {
    next(error);
  }
};

// @desc    Supprimer une activité
// @route   DELETE /api/activities/:id
// @access  Private (Admin / Partner owner)
export const deleteActivity = async (req, res, next) => {
  try {
    await activityService.deleteActivity(req.params.id, req.user);
    res.json({ success: true, message: "Activité supprimée avec succès." });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir des recommandations intelligentes selon les filtres et le contexte
// @route   POST /api/activities/recommendations
// @access  Public
export const getRecommendations = async (req, res, next) => {
  try {
    const { filters = {}, sortBy = "rating", page, limit } = req.body;
    const result = await activityService.getRecommendations(filters, sortBy, { page, limit });
    res.json({
      success: true,
      count: result.activities.length,
      activities: result.activities,
      page: result.page,
      limit: result.limit,
      hasMore: result.hasMore,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Ajouter ou retirer une activité des favoris de l'utilisateur
// @route   POST /api/activities/:id/favorite
// @access  Private
export const toggleFavorite = async (req, res, next) => {
  try {
    const result = await activityService.toggleActivityFavorite(req.params.id, req.user.id);
    res.json({
      success: true,
      isFavorite: result.isFavorite,
      message: result.isFavorite
        ? "Activité ajoutée aux favoris."
        : "Activité retirée des favoris.",
      favorites: result.favorites,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir tous les avis d'une activité
// @route   GET /api/activities/:id/reviews
// @access  Public
export const getActivityReviews = async (req, res, next) => {
  try {
    const result = await activityService.getReviews(req.params.id);
    res.json({
      success: true,
      count: result.reviews.length,
      averageRating: result.averageRating,
      reviews: result.reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Ajouter un avis/commentaire sur une activité
// @route   POST /api/activities/:id/reviews
// @access  Private
export const addReview = async (req, res, next) => {
  try {
    const result = await activityService.addReview(req.params.id, req.body, req.user);
    res.status(201).json({
      success: true,
      message: "Avis soumis à la modération.",
      pending: result.pending,
      averageRating: result.averageRating,
      reviewsCount: result.reviewsCount,
      reviews: result.reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Modifier un avis existant
// @route   PUT /api/activities/:id/reviews/:reviewId
// @access  Private (Auteur de l'avis ou Admin)
export const updateReview = async (req, res, next) => {
  try {
    const result = await activityService.updateReview(
      req.params.id,
      req.params.reviewId,
      req.body,
      req.user
    );
    res.json({
      success: true,
      message: "Avis mis à jour et soumis à la modération.",
      pending: result.pending,
      averageRating: result.averageRating,
      reviewsCount: result.reviewsCount,
      reviews: result.reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Supprimer un avis
// @route   DELETE /api/activities/:id/reviews/:reviewId
// @access  Private (Auteur ou Admin)
export const deleteReview = async (req, res, next) => {
  try {
    const result = await activityService.deleteReview(
      req.params.id,
      req.params.reviewId,
      req.user
    );
    res.json({
      success: true,
      message: "Avis supprimé avec succès.",
      averageRating: result.averageRating,
      reviewsCount: result.reviewsCount,
      reviews: result.reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Réagir à un avis (Like, Love, Haha, Wow, Sad, Angry)
// @route   POST /api/activities/:id/reviews/:reviewId/react
// @access  Private
export const reactToReview = async (req, res, next) => {
  try {
    const result = await activityService.reactToReview(
      req.params.id,
      req.params.reviewId,
      req.body.type,
      req.user
    );
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir les activités créées par le partenaire connecté avec métriques
// @route   GET /api/activities/partner/my-activities
// @access  Private (Partner / Admin)
export const getPartnerActivities = async (req, res, next) => {
  try {
    const result = await activityService.getActivitiesByCreator(req.user.id);
    res.json({
      success: true,
      count: result.activities.length,
      stats: result.stats,
      activities: result.activities,
      partnerTier: req.user.partnerTier || 'standard',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bascule du Mode Électricité / Lumière en direct
// @route   PATCH /api/activities/partner/:id/power-mode
// @access  Private (Partner / Admin)
export const setPowerMode = async (req, res, next) => {
  try {
    const { powerBackupMode } = req.body;
    const activity = await activityService.updatePowerMode(req.params.id, req.user.id, powerBackupMode);
    res.json({
      success: true,
      message: `Mode Électricité / Lumière mis à jour : ${activity.powerBackupMode ? "Activé 💡" : "Désactivé"}`,
      activity,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mise à jour d'une promotion exclusive (Partenaire Pro)
// @route   PATCH /api/activities/partner/:id/promotion
// @access  Private (Partner / Admin)
export const setPromotion = async (req, res, next) => {
  try {
    const activity = await activityService.updateActivityPromotion(req.params.id, req.user.id, req.body);
    res.json({
      success: true,
      message: "Promotion mise à jour avec succès",
      activity,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Ajout d'un événement / soirée (Partenaire Pro)
// @route   POST /api/activities/partner/:id/events
// @access  Private (Partner / Admin)
export const createEvent = async (req, res, next) => {
  try {
    const activity = await activityService.addActivityEvent(req.params.id, req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: "Événement ajouté avec succès",
      activity,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Signaler / voter si l'établissement a actuellement de la lumière ou une coupure (Crowdsourcing)
// @route   POST /api/activities/:id/power-report
// @access  Private (Tous les utilisateurs authentifiés)
export const postPowerReport = async (req, res, next) => {
  try {
    const { hasPower } = req.body;
    const result = await activityService.recordPowerReport(req.params.id, req.user.id, hasPower);
    res.json({
      success: true,
      message:
        result.userVote === "yes"
          ? "Merci ! Votre confirmation de lumière active a été enregistrée 💡"
          : result.userVote === "no"
          ? "Signalement pris en compte : coupure d'électricité notifiée 🔌"
          : "Votre signalement a été retiré",
      powerReports: result,
    });
  } catch (error) {
    next(error);
  }
};



