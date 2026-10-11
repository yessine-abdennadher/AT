import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: [true, "Le slug de la catégorie est obligatoire"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Le nom par défaut est obligatoire"],
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
    icon: {
      type: String,
      required: true,
      default: "sparkles-outline",
    },
    color: {
      type: String,
      default: "#FF4B5C",
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

categorySchema.index({ order: 1, slug: 1 });

export const Category = mongoose.model("Category", categorySchema);
