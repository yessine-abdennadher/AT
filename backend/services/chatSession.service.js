import { createHash, randomBytes, randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { ChatSession } from "../models/ChatSession.js";
import { resolveResponse } from "./chatbot/responses/resolution/responseResolver.service.js";
import { buildQuickReplies } from "./chatbot/responses/composition/quickRepliesBuilder.service.js";

const MAX_MESSAGES_PER_SESSION = 200;
const hashSessionToken = (token) => createHash("sha256").update(token).digest("hex");

const buildSessionFilter = (sessionId, sessionToken) => {
  const filter = { sessionTokenHash: hashSessionToken(sessionToken) };
  if (
    typeof sessionId === "string" &&
    mongoose.Types.ObjectId.isValid(sessionId) &&
    String(new mongoose.Types.ObjectId(sessionId)) === sessionId
  ) {
    filter.$or = [{ sessionId }, { _id: sessionId }];
  } else {
    filter.sessionId = sessionId;
  }
  return filter;
};

const publicSession = (session) => {
  if (!session) return session;
  const result = typeof session.toObject === "function" ? session.toObject() : { ...session };
  delete result.sessionTokenHash;
  return result;
};

export const createChatSessionStore = ({ ChatSessionModel = ChatSession } = {}) => ({
  createChatSession: async ({ roleContext = "anonyme", userId = null, language = "fr", hasGps = false } = {}) => {
    const sessionToken = randomBytes(32).toString("base64url");
    const lang = ["fr", "ar", "en", "derja"].includes(language) ? language : "fr";

    let welcomeText = "Bonjour ! Je suis KharjaBot, votre assistant de sorties. Que cherchez-vous ?";
    let initialSuggestions = ["Activer position 📍", "Gremda", "Chihia", "Sakiet Ezzit", "Centre-ville"];
    try {
      const resolved = resolveResponse({ intentKey: "GREETING", lang });
      if (resolved && resolved.text) welcomeText = resolved.text;
      const quick = buildQuickReplies({ status: "IDLE", lang, hasGps });
      if (Array.isArray(quick) && quick.length) initialSuggestions = quick;
    } catch {
      // repli défensif
    }

    const session = await ChatSessionModel.create({
      sessionId: randomUUID(),
      sessionTokenHash: hashSessionToken(sessionToken),
      userId,
      roleContext,
      messages: [
        {
          sender: "bot",
          text: welcomeText,
          suggestions: initialSuggestions,
        },
      ],
    });
    return { session: publicSession(session), sessionToken };
  },

  appendChatExchange: async ({ sessionId, sessionToken, userText, botMessage }) =>
    ChatSessionModel.findOneAndUpdate(
      buildSessionFilter(sessionId, sessionToken),
      {
        $push: {
          messages: {
            $each: [
              { sender: "user", text: userText },
              botMessage,
            ],
            $slice: -MAX_MESSAGES_PER_SESSION,
          },
        },
      },
      { new: true, runValidators: true }
    ),

  getChatSession: (sessionId, sessionToken) =>
    ChatSessionModel.findOne(buildSessionFilter(sessionId, sessionToken)),
});

const chatSessionStore = createChatSessionStore();

export const createChatSession = (...args) => chatSessionStore.createChatSession(...args);
export const appendChatExchange = (...args) => chatSessionStore.appendChatExchange(...args);
export const getChatSession = (...args) => chatSessionStore.getChatSession(...args);
