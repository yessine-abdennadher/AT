import { User } from "../models/User.js";

export const toggleActivityFavorite = async (activityId, userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("Utilisateur introuvable.");
    error.statusCode = 404;
    throw error;
  }
  const strFavorites = (user.favorites || []).map((favorite) => favorite.toString());
  const isAlreadyFavorite = strFavorites.includes(activityId);
  if (isAlreadyFavorite) {
    user.favorites = user.favorites.filter((favorite) => favorite.toString() !== activityId);
  } else {
    user.favorites.push(activityId);
  }
  await user.save({ validateBeforeSave: false });
  return {
    isFavorite: !isAlreadyFavorite,
    favorites: user.favorites.map((favorite) => favorite.toString()),
  };
};
