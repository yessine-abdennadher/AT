import mongoose from "mongoose";

const adminLoginChallengeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    challengeHash: { type: String, required: true, unique: true },
    otpHash: { type: String, required: true, select: false },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { timestamps: true, versionKey: false }
);

adminLoginChallengeSchema.index({ userId: 1, createdAt: -1 });

export const AdminLoginChallenge = mongoose.model("AdminLoginChallenge", adminLoginChallengeSchema);
