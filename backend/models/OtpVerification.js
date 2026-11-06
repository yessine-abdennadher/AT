import mongoose from "mongoose";

const otpVerificationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    partnerData: {
      type: Object,
      default: null,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 600, // Suppression automatique TTL après 10 minutes (600s)
    },
  },
  {
    timestamps: true,
  }
);

export const OtpVerification = mongoose.model("OtpVerification", otpVerificationSchema);

