import { Telemetry } from "../models/Telemetry.js";

/**
 * Enregistre un événement de télémétrie (session ou vue d'écran)
 */
export const recordTelemetryEvent = async ({
  sessionId,
  eventType = "screen_view",
  screenName,
  userId = null,
  userRole = "guest",
  metadata = {},
}) => {
  if (!sessionId || !screenName) {
    const error = new Error("sessionId et screenName sont requis pour enregistrer la télémétrie.");
    error.statusCode = 400;
    throw error;
  }

  const event = await Telemetry.create({
    sessionId,
    eventType,
    screenName,
    userId: userId || null,
    userRole: userRole || "guest",
    metadata,
  });

  return event;
};

/**
 * Récupère les agrégations de diagnostic pour l'Admin
 */
export const getTelemetryStats = async () => {
  // 1. Nombre total de sessions uniques
  const distinctSessions = await Telemetry.distinct("sessionId", {
    eventType: { $in: ["session_start", "screen_view"] },
  });
  const totalSessions = distinctSessions.length;

  // 2. Répartition par écran / section la plus utilisée
  const screenViews = await Telemetry.aggregate([
    { $match: { eventType: "screen_view" } },
    { $group: { _id: "$screenName", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
    { $project: { screenName: "$_id", count: 1, _id: 0 } },
  ]);

  // 3. Activité des 7 derniers jours (sessions par jour)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const dailySessions = await Telemetry.aggregate([
    {
      $match: {
        eventType: "session_start",
        createdAt: { $gte: sevenDaysAgo },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { date: "$_id", count: 1, _id: 0 } },
  ]);

  return {
    totalSessions,
    screenViews,
    dailySessions,
  };
};
