import {
  getNotificationsForUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../services/notification.service.js";

export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id || null;
    const role = req.user?.role || "user";
    const lang = (req.query.lang || "fr").toLowerCase();

    const notifications = await getNotificationsForUser(userId, role, lang);

    res.json({
      success: true,
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id || null;
    const { id } = req.params;

    const notif = await markNotificationAsRead(id, userId);

    res.json({
      success: true,
      notification: notif,
    });
  } catch (error) {
    next(error);
  }
};

export const markAllRead = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id || null;
    const role = req.user?.role || "user";

    await markAllNotificationsAsRead(userId, role);

    res.json({
      success: true,
      message: "Toutes les notifications ont été marquées comme lues.",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotif = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteNotification(id);

    res.json({
      success: true,
      message: "Notification supprimée avec succès.",
    });
  } catch (error) {
    next(error);
  }
};
