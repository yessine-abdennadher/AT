import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Le nom de l'activité est obligatoire"],
      trim: true,
    },
    nameAr: { type: String, trim: true },
    nameFr: { type: String, trim: true },
    nameEn: { type: String, trim: true },
    category: {
      type: String,
      required: [true, "La catégorie est obligatoire"],
      enum: ["fun", "sport", "couple", "friends", "outdoor", "food", "creative"],
      default: "fun",
    },
    type: {
      type: String,
      enum: ["activity", "restaurant", "cafe", "other"],
      default: "activity",
    },
    city: {
      type: String,
      required: [true, "La ville est obligatoire"],
      trim: true,
    },
    cityAr: { type: String, trim: true },
    cityFr: { type: String, trim: true },
    cityEn: { type: String, trim: true },
    locationName: {
      type: String,
      required: true,
    },
    locationNameAr: { type: String, trim: true },
    locationNameFr: { type: String, trim: true },
    locationNameEn: { type: String, trim: true },
    address: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    whatsapp: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    descriptionAr: { type: String, trim: true },
    descriptionFr: { type: String, trim: true },
    descriptionEn: { type: String, trim: true },
    badgeAr: { type: String, default: "" },
    badgeFr: { type: String, default: "" },
    badgeEn: { type: String, default: "" },
    translations: {
      ar: {
        name: { type: String },
        description: { type: String },
        locationName: { type: String },
        city: { type: String },
        badge: { type: String },
      },
      fr: {
        name: { type: String },
        description: { type: String },
        locationName: { type: String },
        city: { type: String },
        badge: { type: String },
      },
      en: {
        name: { type: String },
        description: { type: String },
        locationName: { type: String },
        city: { type: String },
        badge: { type: String },
      },
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      default: "TND",
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewsCount: {
      type: Number,
      default: 0,
    },
    distanceKm: {
      type: Number,
      default: 5.0,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    badge: {
      type: String,
      default: "",
    },
    coordinates: {
      latitude: { type: Number, default: 34.7406 },
      longitude: { type: Number, default: 10.7603 },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
    duration: {
      type: String,
      default: "1h 30",
    },
    durationMinutes: {
      type: Number,
      default: 90,
    },
    tags: {
      type: [String],
      default: ["نشاط", "ترفيه"],
    },
    suitableFor: {
      type: [String],
      default: ["صحاب", "عائلة"],
    },
    openingHours: {
      type: String,
      default: "10:00 - 22:00",
    },
    openingTime: {
      type: String,
      default: "09:00",
    },
    closingTime: {
      type: String,
      default: "23:00",
    },
    openDays: {
      type: [String],
      default: ["Tous les jours"],
    },
    hasPowerBackup: {
      type: Boolean,
      default: true,
    },
    powerBackupMode: {
      type: Boolean,
      default: true, // Mode Électricité & Lumière garantie en direct (affiche la lampe allumée 💡)
    },
    powerReports: {
      yesVotes: { type: Number, default: 0 },
      noVotes: { type: Number, default: 0 },
      lastReportAt: { type: Date, default: null },
      lastReportStatus: { type: String, enum: ["light_on", "light_off", null], default: null },
      reports: [
        {
          user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          hasPower: { type: Boolean, required: true },
          reportedAt: { type: Date, default: Date.now },
        },
      ],
    },
    hasAirConditioning: {
      type: Boolean,
      default: true,
    },
    isOpenNow: {
      type: Boolean,
      default: true,
    },
    events: [
      {
        title: { type: String, required: true },
        image: { type: String, default: "" },
        date: { type: String, default: "" },
        time: { type: String, default: "" },
        description: { type: String, default: "" },
        category: { type: String, default: "music" }, // music, food, party, art
        price: { type: Number, default: 0 },
      },
    ],
    promotion: {
      isPromo: { type: Boolean, default: false },
      promoType: { type: String, enum: ["all", "item"], default: "all" },
      discountPercent: { type: Number, default: 0 },
      targetItem: { type: String, default: "" },
      promoLabel: { type: String, default: "" },
      validUntil: { type: String, default: "" },
    },
  },
  { timestamps: true, strict: false }
);

// Indexations pour optimiser les performances des requêtes fréquentes et filtres
activitySchema.index({ city: 1, category: 1, rating: -1 });
activitySchema.index({ price: 1, rating: -1 });
activitySchema.index({ durationMinutes: 1, rating: -1 });
activitySchema.index({ distanceKm: 1, rating: -1 });
activitySchema.index({ suitableFor: 1, rating: -1 });
activitySchema.index({ hasPowerBackup: 1, rating: -1 });
activitySchema.index({ isIndoor: 1, rating: -1 });
activitySchema.index({ hasAirConditioning: 1, rating: -1 });
activitySchema.index({ isOpenNow: 1, rating: -1 });
activitySchema.index({ priceTag: 1, rating: -1 });
activitySchema.index({ badge: 1, rating: -1 });
activitySchema.index({ duration: 1, rating: -1 });
activitySchema.index({ distance: 1, rating: -1 });
activitySchema.index({ type: 1, isPopular: -1, isFeatured: -1 });
activitySchema.index({ createdBy: 1 });
activitySchema.index({
  name: "text",
  description: "text",
  locationName: "text",
  tags: "text",
});

export const Activity = mongoose.model("Activity", activitySchema);
