import mongoose from "mongoose";

/**
 * Dépôt Mongo par défaut. Retourne [] si la base n'est pas connectée
 * (évite le buffering Mongoose en tests/hors-ligne).
 */
export function createMongoActivityRepository() {
  return {
    async find(query, limit = 40) {
      if (mongoose.connection.readyState !== 1) return [];
      const actModule = await import("../../../../models/Activity.js");
      const Activity = actModule.Activity || actModule.default;
      return Activity.find(query).limit(limit).lean();
    },
    async findById(id) {
      if (mongoose.connection.readyState !== 1 || !id) return null;
      const actModule = await import("../../../../models/Activity.js");
      const Activity = actModule.Activity || actModule.default;
      return Activity.findById(id).lean().catch(() => null);
    },
  };
}

