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
    sessionTokenHash: {
      type: String,
      required: true,
      select: false,
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
  {
    timestamps: true,
    toJSON: { transform: (_doc, ret) => { delete ret.sessionTokenHash; return ret; } },
    toObject: { transform: (_doc, ret) => { delete ret.sessionTokenHash; return ret; } },
  }
);

export const ChatSession = mongoose.model("ChatSession", chatSessionSchema);
