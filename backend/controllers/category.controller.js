import { Category } from "../models/Category.js";

// @desc    Obtenir toutes les catégories
// @route   GET /api/categories
// @access  Public
export const getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ order: 1 });
    res.json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Créer une nouvelle catégorie (Admin)
// @route   POST /api/categories
// @access  Private (Admin)
export const createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({
      success: true,
      message: "Catégorie créée avec succès.",
      category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Modifier une catégorie (Admin)
// @route   PUT /api/categories/:id
// @access  Private (Admin)
export const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!category) {
      return res.status(404).json({ success: false, message: "Catégorie introuvable." });
    }
    res.json({
      success: true,
      message: "Catégorie mise à jour avec succès.",
      category,
    });
  } catch (error) {
    next(error);
  }
};
