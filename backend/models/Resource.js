import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Le titre de la ressource est obligatoire"],
      trim: true,
      maxlength: [100, "Le titre ne peut pas dépasser 100 caractères"],
    },
    description: {
      type: String,
      required: [true, "La description est obligatoire"],
      trim: true,
    },
    category: {
      type: String,
      default: "Général",
      trim: true,
    },
    status: {
      type: String,
      enum: ["brouillon", "publié", "archivé"],
      default: "publié",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Resource = mongoose.model("Resource", resourceSchema);
