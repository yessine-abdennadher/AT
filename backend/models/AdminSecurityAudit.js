import mongoose from "mongoose";

const adminSecurityAuditSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    targetType: { type: String, enum: ["user", "activity", "review"], required: true, index: true },
    action: {
      type: String,
      enum: ["user.status.changed", "user.role.changed", "partner.tier.changed", "partner.subscription.changed", "activity.highlight.changed", "activity.coordinates.verified", "activity.deleted", "review.status.changed"],
      required: true,
      index: true,
    },
    previousValue: { type: mongoose.Schema.Types.Mixed, required: true },
    newValue: { type: mongoose.Schema.Types.Mixed, required: true },
    ipAddress: { type: String, maxlength: 64, default: "" },
    userAgent: { type: String, maxlength: 512, default: "" },
  },
  { timestamps: true, versionKey: false }
);

adminSecurityAuditSchema.index({ createdAt: -1 });

export const AdminSecurityAudit = mongoose.model("AdminSecurityAudit", adminSecurityAuditSchema);
