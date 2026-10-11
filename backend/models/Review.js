import mongoose from "mongoose";

const reactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      default: "Utilisateur",
    },
    userAvatar: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: ["like", "love", "haha", "wow", "sad", "angry"],
      default: "like",
    },
  },
  { _id: true, timestamps: true }
);

const reviewSchema = new mongoose.Schema(
  {
    activity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Activity",
      required: [true, "L'identifiant de l'activité est obligatoire"],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "L'identifiant de l'utilisateur est obligatoire"],
      index: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    userAvatar: {
      type: String,
      default: "",
    },
    rating: {
      type: Number,
      required: [true, "La note est obligatoire"],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, "Le commentaire est obligatoire"],
      trim: true,
      maxlength: 1000,
    },
    reactions: {
      type: [reactionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index composite pour des requêtes de reviews ultra-rapides et triées par date
reviewSchema.index({ activity: 1, createdAt: -1 });

export const Review = mongoose.model("Review", reviewSchema);
