import { City } from "../models/City.js";

// @desc    Obtenir toutes les villes supportées
// @route   GET /api/cities
// @access  Public
export const getAllCities = async (req, res, next) => {
  try {
    const { activeOnly } = req.query;
    const filter = activeOnly === "true" ? { isActive: true } : {};
    const cities = await City.find(filter).sort({ order: 1, name: 1 });
    res.json({
      success: true,
      count: cities.length,
      cities,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Créer une nouvelle ville (Admin)
// @route   POST /api/cities
// @access  Private (Admin)
export const createCity = async (req, res, next) => {
  try {
    const city = await City.create(req.body);
    res.status(201).json({
      success: true,
      message: "Ville ajoutée avec succès.",
      city,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mettre à jour une ville (Admin, ex: activation 1-clic)
// @route   PUT /api/cities/:id
// @access  Private (Admin)
export const updateCity = async (req, res, next) => {
  try {
    const city = await City.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!city) {
      return res.status(404).json({ success: false, message: "Ville introuvable." });
    }
    res.json({
      success: true,
      message: "Ville mise à jour avec succès.",
      city,
    });
  } catch (error) {
    next(error);
  }
};
