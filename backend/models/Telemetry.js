import mongoose from "mongoose";

const telemetrySchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: ["session_start", "screen_view", "action", "session_end"],
      default: "screen_view",
      index: true,
    },
    screenName: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    userRole: {
      type: String,
      default: "guest",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index composé pour requêtes d'agrégation d'activité temporelle
telemetrySchema.index({ createdAt: -1, eventType: 1 });
telemetrySchema.index({ screenName: 1, eventType: 1 });

export const Telemetry = mongoose.model("Telemetry", telemetrySchema);
