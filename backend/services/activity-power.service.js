import { Activity } from "../models/Activity.js";
import { User } from "../models/User.js";
import { createNotification } from "./notification.service.js";

/** Update the power-backup setting for the activity owner. */
export const updatePowerMode = async (activityId, userId, powerBackupMode) => {
  const activity = await Activity.findById(activityId);
  if (!activity) {
    const error = new Error("Activité introuvable.");
    error.statusCode = 404;
    throw error;
  }
  if (activity.createdBy?.toString() !== userId.toString()) {
    const error = new Error("Accès refusé : vous n'êtes pas le propriétaire de cet établissement.");
    error.statusCode = 403;
    throw error;
  }
  activity.powerBackupMode = Boolean(powerBackupMode);
  await activity.save();
  await User.findByIdAndUpdate(userId, { lastActivityUpdate: new Date() });
  return activity;
};

/** Record or toggle a community power-status report and notify affected users. */
export const recordPowerReport = async (activityId, userId, hasPower) => {
  const activity = await Activity.findById(activityId);
  if (!activity) {
    const error = new Error("Activité introuvable.");
    error.statusCode = 404;
    throw error;
  }
  activity.powerReports = activity.powerReports || { yesVotes: 0, noVotes: 0, reports: [] };
  activity.powerReports.reports = activity.powerReports.reports || [];
  const existingIndex = activity.powerReports.reports.findIndex((report) => report.user?.toString() === userId.toString());
  const boolVal = Boolean(hasPower);
  let userVote = boolVal ? "yes" : "no";
  if (existingIndex > -1) {
    if (activity.powerReports.reports[existingIndex].hasPower === boolVal) {
      activity.powerReports.reports.splice(existingIndex, 1);
      userVote = null;
    } else {
      activity.powerReports.reports[existingIndex].hasPower = boolVal;
      activity.powerReports.reports[existingIndex].reportedAt = new Date();
    }
  } else {
    activity.powerReports.reports.push({ user: userId, hasPower: boolVal, reportedAt: new Date() });
  }
  const yesCount = activity.powerReports.reports.filter((report) => report.hasPower === true).length;
  const noCount = activity.powerReports.reports.filter((report) => report.hasPower === false).length;
  activity.powerReports.yesVotes = yesCount;
  activity.powerReports.noVotes = noCount;
  activity.powerReports.lastReportAt = new Date();
  activity.powerReports.lastReportStatus = userVote ? (boolVal ? "light_on" : "light_off") : null;
  await activity.save();
  try {
    if (!boolVal && noCount > 0) {
      await createNotification({
        recipient: activity.createdBy || null,
        targetRole: activity.createdBy ? "all" : "partner",
        category: "alerts",
        type: "power_alert",
        title: {
          ar: `🔌 تنبيه انقطاع تيار لدى «${activity.name}»`,
          fr: `🔌 Coupure signalée chez « ${activity.name} » (${noCount} votes)`,
          en: `🔌 Power Outage reported at "${activity.name}" (${noCount} votes)`,
        },
        description: {
          ar: `أبلغ زوار عن انقطاع تيار كهربائي (${noCount} بلاغات). يرجى تأكيد تشغيل المولد الاحتياطي.`,
          fr: `Des visiteurs signalent une coupure (${noCount} signalements). Vérifiez l'état du générateur.`,
          en: `Visitors reported a power outage (${noCount} reports). Check generator backup.`,
        },
        icon: "flash", color: "#EF4444", badgeLabel: "ALERTE ÉLEC",
        ctaText: { ar: "التحقق من النشاط", fr: "Vérifier l'état", en: "Check status" },
        ctaIcon: "bulb-outline", actionType: "activity", activityId: activity._id,
      });
    } else if (boolVal && yesCount > 0) {
      await createNotification({
        recipient: null,
        targetRole: "user",
        category: "alerts",
        type: "power_alert",
        title: {
          ar: `💡 إنارة مؤكدة لدى «${activity.name}»`,
          fr: `💡 Électricité confirmée chez « ${activity.name} »`,
          en: `💡 Power confirmed active at "${activity.name}"`,
        },
        description: {
          ar: "أكد الزوار توفر الكهرباء والإنارة بشكل طبيعي. استمتع بأوقاتك!",
          fr: "Les visiteurs confirment que l'électricité fonctionne parfaitement.",
          en: "Guests confirmed electricity and lighting are working seamlessly.",
        },
        icon: "bulb", color: "#EAB308", badgeLabel: "LUMIÈRE 💡",
        ctaText: { ar: "عرض النشاط", fr: "Découvrir l'activité", en: "Discover activity" },
        ctaIcon: "navigate-outline", actionType: "activity", activityId: activity._id,
      });
    }
  } catch (error) {
    console.warn("Échec notif power report:", error.message);
  }
  return {
    yesVotes: yesCount,
    noVotes: noCount,
    lastReportAt: activity.powerReports.lastReportAt,
    lastReportStatus: activity.powerReports.lastReportStatus,
    userVote,
  };
};
