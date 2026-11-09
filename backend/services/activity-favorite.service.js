import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Activity } from "../models/Activity.js";

export const MAX_FAVORITES_PER_USER = 200;

export const toggleActivityFavorite = async (activityId, userId) => {
  if (!mongoose.isObjectIdOrHexString(activityId)) {
    const error = new Error("Identifiant d’activité invalide.");
    error.statusCode = 400;
    throw error;
  }
  const activity = await Activity.findOne({ _id: activityId, isApproved: true }).select("_id").lean();
  if (!activity) {
    const error = new Error("Activité introuvable.");
    error.statusCode = 404;
    throw error;
  }
  const user = await User.findById(userId).select("favorites");
  if (!user) {
    const error = new Error("Utilisateur introuvable.");
    error.statusCode = 404;
    throw error;
  }
  const isAlreadyFavorite = (user.favorites || []).some((favorite) => favorite.toString() === activityId);
  const update = isAlreadyFavorite
    ? { $pull: { favorites: activityId } }
    : { $addToSet: { favorites: activityId } };
  const filter = isAlreadyFavorite
    ? { _id: userId, favorites: activityId }
    : {
        _id: userId,
        $expr: { $lt: [{ $size: { $ifNull: ["$favorites", []] } }, MAX_FAVORITES_PER_USER] },
      };
  const updatedUser = await User.findOneAndUpdate(filter, update, { new: true }).select("favorites");
  if (!updatedUser) {
    const error = new Error("La limite de 200 favoris est atteinte.");
    error.statusCode = 409;
    throw error;
  }
  return {
    isFavorite: !isAlreadyFavorite,
    favorites: updatedUser.favorites.map((favorite) => favorite.toString()),
  };
};
