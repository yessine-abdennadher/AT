import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null = broadcast pour un rôle ou tous les utilisateurs
      index: true,
    },
    targetRole: {
      type: String,
      enum: ["all", "user", "partner", "admin"],
      default: "all",
      index: true,
    },
    category: {
      type: String,
      enum: ["alerts", "offers_reviews", "management"],
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "power_alert",
        "promo",
        "event",
        "review_received",
        "reaction",
        "partner_tier",
        "approval",
        "system_alert",
        "contact_stats",
        "moderation",
      ],
      default: "system_alert",
    },
    title: {
      ar: { type: String, required: true },
      fr: { type: String, required: true },
      en: { type: String, required: true },
    },
    description: {
      ar: { type: String, required: true },
      fr: { type: String, required: true },
      en: { type: String, required: true },
    },
    icon: {
      type: String,
      default: "notifications-outline",
    },
    color: {
      type: String,
      default: "#0284C7",
    },
    badgeLabel: {
      type: String,
      default: "",
    },
    ctaText: {
      ar: { type: String, default: "" },
      fr: { type: String, default: "" },
      en: { type: String, default: "" },
    },
    ctaIcon: {
      type: String,
      default: "",
    },
    actionType: {
      type: String,
      enum: ["activity", "partner_dashboard", "admin_dashboard", "none"],
      default: "none",
    },
    activityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Activity",
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipient: 1, targetRole: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);
