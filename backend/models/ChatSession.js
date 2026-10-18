import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ["user", "bot", "system"],
      required: true,
    },
    text: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    suggestions: [String],
    isThinking: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

const chatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    roleContext: {
      type: String,
      enum: ["rh", "manager", "collaborateur", "anonyme"],
      default: "anonyme",
    },
    messages: [messageSchema],
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const ChatSession = mongoose.model("ChatSession", chatSessionSchema);
