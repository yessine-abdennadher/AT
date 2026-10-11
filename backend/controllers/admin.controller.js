import * as adminService from "../services/admin.service.js";

// @desc    Obtenir les statistiques KPI globales
// @route   GET /api/admin/stats
// @access  Private (Admin)
export const getStats = async (req, res, next) => {
  try {
    const stats = await adminService.getPlatformStats();
    res.json({ success: true, stats });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir la liste paginée des utilisateurs
// @route   GET /api/admin/users
// @access  Private (Admin)
export const getUsers = async (req, res, next) => {
  try {
    const result = await adminService.getUsersList(req.query);
    res.json({
      success: true,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      users: result.users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Activer ou suspendre un compte utilisateur
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin)
export const changeUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const user = await adminService.updateUserStatus(req.params.id, isActive, req.user._id);
    res.json({
      success: true,
      message: `Compte ${user.isActive ? "activé" : "suspendu"} avec succès.`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Changer le rôle d'un utilisateur
// @route   PATCH /api/admin/users/:id/role
// @access  Private (Admin)
export const changeUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await adminService.updateUserRole(req.params.id, role, req.user._id);
    res.json({
      success: true,
      message: `Rôle mis à jour avec succès : ${user.role}`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir les activités pour modération
// @route   GET /api/admin/activities
// @access  Private (Admin)
export const getActivitiesForModeration = async (req, res, next) => {
  try {
    const result = await adminService.getAdminActivities(req.query);
    res.json({
      success: true,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      activities: result.activities,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approuver ou rejeter une activité
// @route   PATCH /api/admin/activities/:id/approve
// @access  Private (Admin)
export const setActivityApproval = async (req, res, next) => {
  try {
    const { isApproved } = req.body;
    const activity = await adminService.toggleActivityApproval(req.params.id, isApproved);
    res.json({
      success: true,
      message: `Activité ${activity.isApproved ? "approuvée" : "mise en attente"} avec succès.`,
      activity,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mettre en avant (Featured) ou Populaire
// @route   PATCH /api/admin/activities/:id/highlight
// @access  Private (Admin)
export const toggleHighlight = async (req, res, next) => {
  try {
    const { field } = req.body; // 'isFeatured' ou 'isPopular'
    const activity = await adminService.toggleActivityHighlight(req.params.id, field);
    res.json({
      success: true,
      message: `Statut ${field} mis à jour : ${activity[field]}`,
      activity,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Suppression administrative d'une activité
// @route   DELETE /api/admin/activities/:id
// @access  Private (Admin)
export const removeActivity = async (req, res, next) => {
  try {
    await adminService.deleteActivityByAdmin(req.params.id);
    res.json({
      success: true,
      message: "Activité et ses avis supprimés avec succès par l'administrateur.",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir les statistiques de diagnostic et télémétrie
// @route   GET /api/admin/diagnostics
// @access  Private (Admin)
export const getDiagnostics = async (req, res, next) => {
  try {
    const data = await adminService.getPlatformDiagnostics();
    res.json({
      success: true,
      diagnostics: data,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Modifier le tier d'un partenaire (standard / pro)
// @route   PATCH /api/admin/partners/:id/tier
// @access  Private (Admin)
export const changePartnerTier = async (req, res, next) => {
  try {
    const { tier } = req.body;
    const partner = await adminService.updatePartnerTier(req.params.id, tier);
    res.json({
      success: true,
      message: `Tier partenaire mis à jour : ${partner.partnerTier}`,
      partner,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Activer ou désactiver le mode alerte électricité globale (Admin)
// @route   PATCH /api/admin/electricity-mode
// @access  Private (Admin)
export const changeGlobalElectricityMode = async (req, res, next) => {
  try {
    const { active } = req.body;
    const status = await adminService.updateGlobalElectricityMode(active, req.user._id);
    res.json({
      success: true,
      electricityAlertActive: status,
      message: status
        ? "Mode Alerte Électricité activé à l'échelle de la plateforme ⚡💡"
        : "Mode Alerte Électricité désactivé (Mode normal)",
    });
  } catch (error) {
    next(error);
  }
};


