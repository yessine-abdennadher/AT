import { SystemSetting } from "../models/SystemSetting.js";

/**
 * Récupérer la valeur d'un paramètre système (avec valeur par défaut)
 */
export const getSystemSetting = async (key, defaultValue = null) => {
  try {
    const setting = await SystemSetting.findOne({ key }).lean();
    if (!setting) return defaultValue;
    return setting.value;
  } catch (error) {
    console.error(`[SystemSetting] Erreur lors de la lecture de ${key}:`, error);
    return defaultValue;
  }
};

/**
 * Mettre à jour ou créer un paramètre système
 */
export const setSystemSetting = async (key, value, userId = null) => {
  const setting = await SystemSetting.findOneAndUpdate(
    { key },
    { key, value, updatedBy: userId },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return setting.value;
};

/**
 * Raccourci pour l'état du mode alerte électricité globale
 */
export const getElectricityAlertStatus = async () => {
  return await getSystemSetting("electricityAlertActive", false);
};

export const setElectricityAlertStatus = async (active, userId = null) => {
  return await setSystemSetting("electricityAlertActive", Boolean(active), userId);
};
