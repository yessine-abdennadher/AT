import mongoose from "mongoose";

const activityApprovalAuditSchema = new mongoose.Schema({
  activity: { type: mongoose.Schema.Types.ObjectId, ref: "Activity", required: true, index: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  previousState: { type: Boolean, required: true },
  nextState: { type: Boolean, required: true },
}, { timestamps: { createdAt: true, updatedAt: false }, versionKey: false });

activityApprovalAuditSchema.index({ activity: 1, createdAt: -1 });

export const ActivityApprovalAudit = mongoose.model("ActivityApprovalAudit", activityApprovalAuditSchema);
