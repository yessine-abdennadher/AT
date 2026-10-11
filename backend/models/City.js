import mongoose from "mongoose";

const citySchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: [true, "Le slug de la ville est obligatoire"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Le nom de la ville est obligatoire"],
      trim: true,
    },
    nameAr: {
      type: String,
      required: true,
      trim: true,
    },
    nameFr: {
      type: String,
      required: true,
      trim: true,
    },
    nameEn: {
      type: String,
      required: true,
      trim: true,
    },
    coords: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
    },
    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },
    badge: {
      type: String,
      default: "",
    },
    badgeAr: {
      type: String,
      default: "قريباً",
    },
    badgeFr: {
      type: String,
      default: "Bientôt",
    },
    badgeEn: {
      type: String,
      default: "Coming Soon",
    },
    coverImage: {
      type: String,
      default: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80",
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

citySchema.index({ order: 1, name: 1 });

export const City = mongoose.model("City", citySchema);
