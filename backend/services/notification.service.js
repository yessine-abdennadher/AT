import { Notification } from "../models/Notification.js";
import { Activity } from "../models/Activity.js";

/**
 * Génère des notifications par défaut si la base est vide pour un rôle donné.
 */
async function seedDefaultNotificationsIfEmpty() {
  const count = await Notification.countDocuments();
  if (count > 0) return;

  const pirateActivity = await Activity.findOne({ name: { $regex: /pirate/i } });
  const anyActivity = pirateActivity || (await Activity.findOne());

  const sampleNotifications = [
    // ── ADMIN ─────────────────────────────────────────────────────────────
    {
      targetRole: "admin",
      category: "alerts",
      type: "power_alert",
      title: {
        ar: "⚡ تنبيه انقطاع كهرباء جماعي في صفاقس",
        fr: "⚡ Pic de coupures de courant à Sfax (14 signalements)",
        en: "⚡ Power Outage Surge in Sfax (14 reports)",
      },
      description: {
        ar: "تم رصد 14 بلاغاً في آخر 15 دقيقة. يمكنك تفعيل وضع تنبيه الكهرباء العام للتطبيق بنقرة واحدة.",
        fr: "14 signalements citoyens enregistrés en 15 min. Activez le bandeau d’Alerte Électricité générale.",
        en: "14 citizen reports in the last 15 mins. You can toggle the platform-wide Power Alert banner.",
      },
      icon: "flash",
      color: "#EF4444",
      badgeLabel: "URGENT",
      ctaText: {
        ar: "لوحة التحكم والمراقبة",
        fr: "Panneau de Contrôle Admin",
        en: "Admin Control Panel",
      },
      ctaIcon: "shield-checkmark",
      actionType: "admin_dashboard",
    },
    {
      targetRole: "admin",
      category: "management",
      type: "partner_tier",
      title: {
        ar: "🆕 شريك تجاري جديد بانتظار التفعيل",
        fr: "🆕 Inscription Partenaire en attente de validation",
        en: "🆕 New Partner Registration Pending",
      },
      description: {
        ar: "قام مطعم «Restaurant Le Pirate» بطلب ترقية حسابه إلى شريك احترافي Pro.",
        fr: "L'établissement « Restaurant Le Pirate » a demandé le statut Partenaire Pro.",
        en: "Restaurant Le Pirate requested a verified Pro Business account.",
      },
      icon: "restaurant",
      color: "#0284C7",
      badgeLabel: "PARTENAIRE",
      ctaText: {
        ar: "فحص واعتماد الحساب",
        fr: "Examiner et certifier Pro",
        en: "Review and certify Pro",
      },
      ctaIcon: "checkmark-circle-outline",
      actionType: "admin_dashboard",
    },

    // ── PARTNER ───────────────────────────────────────────────────────────
    {
      targetRole: "partner",
      category: "offers_reviews",
      type: "review_received",
      title: {
        ar: "⭐ تقييم 5 نجوم جديد لمطعمك!",
        fr: "⭐ Nouvel avis 5 étoiles sur votre établissement !",
        en: "⭐ New 5-Star Review Received!",
      },
      description: {
        ar: "كتب الزائر سامي: «خدمة ممتازة وأجواء رائعة، المولد الكهربائي شغال والراحة مضمونة!»",
        fr: "Un client a écrit : « Superbe accueil, générateur allumé en cas de coupure, tout est au top ! »",
        en: "A guest wrote: 'Great hospitality, generator on, seamless service!'",
      },
      icon: "star",
      color: "#F59E0B",
      badgeLabel: "AVIS 5/5",
      ctaText: {
        ar: "عرض والرد على التقييم",
        fr: "Consulter et remercier",
        en: "View and reply",
      },
      ctaIcon: "chatbubbles-outline",
      actionType: "activity",
      activityId: anyActivity?._id,
    },
    {
      targetRole: "partner",
      category: "alerts",
      type: "power_alert",
      title: {
        ar: "💡 تأكيد وضع الإنارة لمقرك",
        fr: "💡 Signalement de coupure dans votre zone",
        en: "💡 Real-time Power Status Alert",
      },
      description: {
        ar: "قام 2 زوار بالإبلاغ عن انقطاع تيار في منطقتكم. تأكد من تفعيل المولد ليعرف الزوار أنكم في الخدمة!",
        fr: "Des coupures sont signalées dans votre secteur. Confirmez que votre générateur est allumé.",
        en: "Blackouts reported nearby. Confirm your power backup to reassure guests.",
      },
      icon: "bulb",
      color: "#EAB308",
      badgeLabel: "ÉLECTRICITÉ",
      ctaText: {
        ar: "تحديث حالة المولد",
        fr: "Gérer la lumière garantie",
        en: "Manage power backup",
      },
      ctaIcon: "flash-outline",
      actionType: "partner_dashboard",
    },
    {
      targetRole: "partner",
      category: "management",
      type: "contact_stats",
      title: {
        ar: "📈 45 نقرة اتصال وحجز هذا الأسبوع",
        fr: "📈 45 demandes directes reçues cette semaine",
        en: "📈 45 Direct Contact Inquiries this week",
      },
      description: {
        ar: "شهدت صفحتكم تفاعلاً متزايداً مع 28 نقرة واتساب و17 مكالمة حجز هاتفية مباشرة.",
        fr: "28 clics sur votre WhatsApp et 17 appels téléphoniques directs générés.",
        en: "28 WhatsApp clicks and 17 direct calls recorded through ActivityTN.",
      },
      icon: "call",
      color: "#10B981",
      badgeLabel: "CONTACTS",
      ctaText: {
        ar: "فتح لوحة التحكم",
        fr: "Voir les statistiques",
        en: "View analytics",
      },
      ctaIcon: "analytics-outline",
      actionType: "partner_dashboard",
    },

    // ── SIMPLE USER ───────────────────────────────────────────────────────
    {
      targetRole: "user",
      category: "alerts",
      type: "power_alert",
      title: {
        ar: "💡 إنارة مستمرة ومضمونة لدى مطعم القرصان",
        fr: "💡 Électricité garantie chez Restaurant Le Pirate",
        en: "💡 Verified Power Backup at Restaurant Le Pirate",
      },
      description: {
        ar: "أكد الزوار وإدارة المطعم أن المولد الكهربائي يعمل بصورة ممتازة. استمتع بأمسيتك دون انقطاع!",
        fr: "Le générateur est allumé et confirmé par les visiteurs. Climatisation et service continus assurés.",
        en: "Guests confirmed generator power is active. Enjoy your evening without interruptions!",
      },
      icon: "bulb",
      color: "#EAB308",
      badgeLabel: "LUMIÈRE 💡",
      ctaText: {
        ar: "عرض النشاط وحجز طاولة",
        fr: "Découvrir et réserver",
        en: "Discover & reserve",
      },
      ctaIcon: "navigate-outline",
      actionType: "activity",
      activityId: anyActivity?._id,
    },
    {
      targetRole: "user",
      category: "offers_reviews",
      type: "promo",
      title: {
        ar: "🔥 خصم حصري 20% في صفاقس اليوم!",
        fr: "🔥 Promo Flash : -20% ce soir à Sfax !",
        en: "🔥 20% Flash Deal in Sfax!",
      },
      description: {
        ar: "استمتع بخصم فوري على تذاكر الأنشطة الترفيهية عند الحجز المباشر عبر التطبيق.",
        fr: "Bénéficiez de 20% de remise immédiate pour vos sorties loisirs ce soir.",
        en: "Enjoy 20% off activities when booking directly through ActivityTN.",
      },
      icon: "pricetag",
      color: "#EF4444",
      badgeLabel: "PROMO -20%",
      ctaText: {
        ar: "استفد من العرض الآن",
        fr: "Voir la promotion",
        en: "View deal",
      },
      ctaIcon: "sparkles",
      actionType: "activity",
      activityId: anyActivity?._id,
    },
    {
      targetRole: "user",
      category: "offers_reviews",
      type: "reaction",
      title: {
        ar: "❤️ تفاعل جديد مع تقييمك!",
        fr: "❤️ Nouveau « J’adore » reçu sur votre avis",
        en: "❤️ Someone loved your review!",
      },
      description: {
        ar: "أعجب 4 أشخاص بتعليقك الأخير وساعدهم في اختيار وجهتهم القادمة في صفاقس.",
        fr: "Votre recommandation récente a reçu 4 mentions positives de la communauté.",
        en: "4 people liked your recent review and found it very helpful for their outing.",
      },
      icon: "heart",
      color: "#F43F5E",
      badgeLabel: "COMMUNAUTÉ",
      ctaText: {
        ar: "مشاهدة التفاعل",
        fr: "Consulter mes avis",
        en: "View review",
      },
      ctaIcon: "chatbubbles-outline",
      actionType: "activity",
      activityId: anyActivity?._id,
    },
  ];

  await Notification.insertMany(sampleNotifications);
}

/**
 * Récupère les notifications adaptées au rôle et à l'utilisateur depuis MongoDB.
 */
export async function getNotificationsForUser(userId = null, role = "user", lang = "fr") {
  await seedDefaultNotificationsIfEmpty();

  const query = {
    $or: [
      { recipient: userId },
      { recipient: null, targetRole: { $in: ["all", role] } },
    ],
  };

  const list = await Notification.find(query).sort({ createdAt: -1 }).lean();

  return list.map((item) => {
    const isRead =
      item.read || (userId && item.readBy?.some((uid) => String(uid) === String(userId)));

    return {
      id: item._id.toString(),
      category: item.category,
      type: item.type,
      title: item.title[lang] || item.title.fr || item.title.en || "",
      description: item.description[lang] || item.description.fr || item.description.en || "",
      icon: item.icon,
      color: item.color,
      badgeLabel: item.badgeLabel,
      ctaText: item.ctaText?.[lang] || item.ctaText?.fr || item.ctaText?.en || "",
      ctaIcon: item.ctaIcon,
      actionType: item.actionType,
      activityId: item.activityId ? item.activityId.toString() : null,
      read: Boolean(isRead),
      createdAt: item.createdAt,
    };
  });
}

/**
 * Marque une notification comme lue.
 */
export async function markNotificationAsRead(notificationId, userId = null) {
  const notif = await Notification.findById(notificationId);
  if (!notif) {
    throw new Error("Notification introuvable");
  }

  if (userId) {
    if (!notif.readBy.some((uid) => String(uid) === String(userId))) {
      notif.readBy.push(userId);
    }
  }
  notif.read = true;
  await notif.save();

  return notif;
}

/**
 * Marque toutes les notifications comme lues pour un utilisateur.
 */
export async function markAllNotificationsAsRead(userId = null, role = "user") {
  const query = {
    $or: [
      { recipient: userId },
      { recipient: null, targetRole: { $in: ["all", role] } },
    ],
  };

  if (userId) {
    await Notification.updateMany(query, {
      $addToSet: { readBy: userId },
      $set: { read: true },
    });
  } else {
    await Notification.updateMany(query, { $set: { read: true } });
  }

  return { success: true };
}

/**
 * Supprime une notification.
 */
export async function deleteNotification(notificationId) {
  await Notification.findByIdAndDelete(notificationId);
  return { success: true };
}

/**
 * Crée une nouvelle notification (déclenchée par la logique métier).
 */
export async function createNotification(data) {
  const created = await Notification.create(data);
  return created;
}
